<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { STAGE_GROUPS, stageById } from './stages'
import StageScene from './StageScene.vue'
import YardWalker from './YardWalker.vue'

/*
 * 마당.
 *
 * ── 이 판만 결이 다른 이유 ──────────────────────────
 * 참고한 다이어리 브랜드는 시각 언어를 둘로 나눠 쓰고 한 면에 섞지 않는다.
 * 이 화면에서 창문·좌표·에디션 번호는 각인형이고 여기 캐릭터는 일러스트형이다.
 * 그래서 섞지 않고 '도판' 으로 액자에 넣어 따로 세웠다.
 *
 * 다만 무대에 따라 캐릭터도 언어를 바꾼다.
 * 차콜 텍스타일에 금박 선으로 그린 탐사선이 떠 있는 판 위를
 * 두꺼운 흰 테두리를 두른 스티커 사람이 걸어다니면 두 언어가 한 면에서 부딪힌다.
 * 각인형 무대에서는 사람도 금선 드로잉이 된다.
 *
 * ── 눌러서 넓게 보기 ────────────────────────────────
 * 평소에는 지면 쪽 띠만 보인다. 아침에 판정을 읽으러 온 사람에게
 * 그림이 화면을 다 차지하면 방해가 되기 때문이다.
 * 누르면 하늘까지 열리면서 그제야 모티프가 드러난다.
 */
const configStore = useConfigStore()

const props = defineProps({
  people: { type: Array, required: true },
  /*
   * 사람마다 그곳의 지금 날씨.
   *
   * 마당은 원래 날씨를 몰랐다. 걸어다니는 것과 무슨 옷을 입었는지는
   * 사람 id 에서 뽑은 수로만 정해져서, 비가 쏟아지는 날에도
   * 우산을 든 사람은 우연히 든 사람뿐이었다.
   */
  weatherById: { type: Object, default: () => ({}) },
})

const stage = computed(() => stageById(configStore.yardTheme))
const isEngraved = computed(() => stage.value.lang === 'engraved')

// 무대 이름. 에디션은 고유명사라 영문을 앞세우고 한글을 붙인다
const stageName = computed(() => (configStore.lang === 'en' ? stage.value.en : stage.value.ko))

const groups = computed(() =>
  STAGE_GROUPS.map((g) => ({
    id: g.id,
    label: configStore.t(`yard.group.${g.id}`),
    stages: g.stages,
  })),
)

/*
 * 넓게 볼까 접어 둘까.
 * 저장하지 않는다. 설정이 아니라 잠깐 들여다보는 일이라
 * 다음에 들어왔을 때는 다시 얇은 띠로 시작하는 게 맞다.
 */
const open = ref(false)
const pickerOpen = ref(false)

/*
 * 고르면 닫는다.
 *
 * 무대는 하나만 서 있을 수 있어서, 하나 고르면 그것으로 끝이다.
 * 목록이 그대로 열려 있으면 아직 고르는 중인 것처럼 보이는데,
 * 정작 바뀐 판은 그 목록에 가려 안 보인다 — 고른 결과를 보러
 * 목록을 손으로 다시 닫아야 했다.
 */
const pickStage = (id) => {
  configStore.setYardTheme(id)
  pickerOpen.value = false
}

/*
 * ── 판을 재서 그림과 사람을 같은 바닥에 세운다 ─────
 *
 * 화폭은 800x260 이다. 판이 그 비율이면 아무 문제가 없는데, 좁은 화면에서
 * 펼치면 판은 358x200 이 된다. 훨씬 세로로 긴 상자다.
 *
 * 예전에는 이럴 때 그림을 통째로 줄여 넣었다(meet). 그러면 그림은 116px 만
 * 그려지고 위아래로 84px 씩 빈칸이 남는다. 펼쳤는데 판의 4할이 빈칸이다.
 * 사람들은 발밑을 판 바닥에서 24px 로 못 박아 두었으니, 그림 바닥이 42px
 * 위로 올라간 만큼 열두 명이 그림 밖 빈칸에 서 있었다.
 *
 * 두 증상은 같은 뿌리다 — 그림은 판을 자기 비율로 읽고 사람은 픽셀로 읽었다.
 * 그래서 판을 실제로 재고, 그 수 하나에서 둘 다 나오게 한다.
 */
const ART_W = 800
const ART_H = 260

/*
 * 발이 닿을 자리(화폭 아래에서 몇 칸).
 *
 * 지면은 화폭 228~260 에 깔린 32칸짜리 띠다. 맨 앞 사람은 그 띠에 열 칸쯤
 * 들어와 서고, 뒤로 갈수록 띠 위쪽으로 올라간다.
 * 넓은 화면에서 그림이 1.075배로 그려질 때의 24px~37px 과 같은 자리다.
 */
const FOOT = 22
const FOOT_BACK = 0.387

const stageEl = ref(null)
const box = ref({ w: 0, h: 0 })
let ro = null

/*
 * 어느 쪽을 남기고 어느 쪽을 자를지.
 *
 * 늘 채운다(slice). 남는 자리를 만들지 않는 대신 넘치는 쪽을 자르는데,
 * 무엇을 자르느냐는 판이 그림보다 세로로 긴지 가로로 긴지에 달렸다.
 *
 * 세로로 길면 — 좁은 화면에서 펼친 경우다 — 좌우를 자른다. 이때 오른쪽을
 * 남긴다(xMax). 모티프가 화폭 548~644 에, 그러니까 오른쪽 4분면에 서 있어서
 * 가운데를 기준으로 자르면(xMid) 모티프의 오른쪽 절반이 잘려 나간다.
 * 넓게 보려고 누른 사람이 보려는 게 그 모티프다.
 */
const fit = computed(() => {
  const { w, h } = box.value
  if (!open.value || !w || !h) return 'xMidYMax slice'
  return h * ART_W > w * ART_H ? 'xMaxYMid slice' : 'xMidYMax slice'
})

/*
 * 그림이 몇 배로 그려지고 있는가.
 *
 * slice 라 화폭의 아래끝은 늘 판의 아래끝에 붙는다 — 세로로 긴 판에서는
 * 높이가 딱 맞고, 가로로 긴 판에서는 위쪽만 잘린다. 어느 쪽이든 바닥은
 * 바닥이라, 발밑은 이 배율에 칸수를 곱하기만 하면 된다.
 */
const k = computed(() => {
  const { w, h } = box.value
  if (!w || !h) return ART_W / 860
  return Math.max(w / ART_W, h / ART_H)
})

/*
 * 사람들에게 내려보내는 바닥.
 *
 * --floor  맨 앞줄의 발밑(px)
 * --rise   한 겹 뒤로 갈 때마다 올라가는 만큼(px)
 * --k      그림 배율. 사람 크기도 이걸 따라간다
 */
const ground = computed(() => ({
  '--size': String(sizeK.value),
  '--floor': `${(FOOT * k.value).toFixed(2)}px`,
  '--rise': `${(FOOT_BACK * k.value).toFixed(3)}px`,
  '--k': k.value.toFixed(4),
}))

const measure = (el) => {
  if (el) box.value = { w: el.clientWidth, h: el.clientHeight }
}

/**
 * 챙기는 사람 수만큼, 마당을 걸어다니는 사람들.
 *
 * 값은 사람마다 고정이어야 한다. 다시 그릴 때마다 자리가 바뀌면
 * 걸어가던 사람이 순간이동한 것처럼 보인다.
 * 그래서 난수 대신 id 에서 뽑은 수를 쓴다. 같은 사람은 늘 같은 모습으로 걷는다.
 */
const hash = (text) => {
  let n = 0
  for (let i = 0; i < text.length; i += 1) {
    n = (n * 31 + text.charCodeAt(i)) >>> 0
  }
  /*
   * 마지막에 한 번 섞어 준다.
   * 이걸 빼먹었더니 열두 명이 거의 같은 옷을 입고 나왔다.
   * id 가 p_seed0 ~ p_seed11 처럼 끝 글자만 다르면 상위 비트가 거의 같은데,
   * 값을 뽑을 때 그 상위 비트를 보고 있었다.
   */
  n ^= n >>> 16
  n = Math.imul(n, 2246822507) >>> 0
  n ^= n >>> 13
  n = Math.imul(n, 3266489909) >>> 0
  n ^= n >>> 16
  return n >>> 0
}

// 부호 없는 시프트(>>>)를 쓴다. >> 로 하면 큰 수에서 음수가 나와
// 걸음 시간이 음수가 되고 사람이 화면 밖에 서 버린다.
const pick = (seed, shift, range) => (seed >>> shift) % range

/*
 * 사람 크기는 몇 명이냐에 따라 달라진다.
 *
 * 넷이 걸을 때와 열둘이 걸을 때 같은 크기로 두면,
 * 넷일 때는 허전하고 열둘일 때는 서로 겹쳐 몇 명인지 세어지지 않는다.
 * 다섯까지는 크게, 열둘로 갈수록 조금씩 줄인다.
 */
const sizeK = computed(() => {
  const n = props.people.length || 1
  if (n <= 5) return 1
  return Number(Math.max(0.78, 1 - (n - 5) * 0.032).toFixed(3))
})

const walkers = computed(() => {
  const total = props.people.length || 1

  return props.people.map((person, i) => {
    const seed = hash(person.id + i)

    // 산책이라 느긋해야 한다. 빠르면 쫓기는 것처럼 보인다.
    const pace = 74 + pick(seed, 3, 46)

    /*
     * 자기 자리.
     *
     * 처음에는 출발 지점만 고르게 나눠 주고 모두가 판 전체를 오가게 두었다.
     * 시작하는 순간에는 고르게 서 있었는데, 사람마다 걷는 속도가 달라서
     * 몇 분 지나면 오른쪽에 넷이 뭉치고 왼쪽이 비었다.
     * 출발을 나누는 것으로는 부족했다 — 오래 보고 있는 화면이라
     * 어느 순간에 봐도 고르게 퍼져 있어야 한다.
     *
     * 그래서 자리를 나눠 준다. 각자 자기 구간 안에서만 오간다.
     * 구간끼리는 조금씩 겹쳐 두어야 이웃과 마주쳐 악수할 일이 생긴다.
     */
    /*
     * 흔들림은 양쪽으로 줘야 한다.
     * 0~+1칸으로만 밀었더니 열두 명이 모두 오른쪽으로만 밀려서,
     * 자리를 고르게 나눠 놓고도 왼쪽이 비었다.
     * 칸 한가운데를 기준으로 좌우 같은 만큼만 흔든다.
     */
    const home = (i + 0.5) / total + ((pick(seed, 7, 100) / 100 - 0.5) * 0.6) / total
    const span = Math.min(0.44, Math.max(0.24, 1.6 / total))
    let from = home - span / 2
    let to = home + span / 2
    // 판 밖으로 나가지 않게 통째로 안으로 민다. 폭을 줄이지는 않는다
    if (from < 0.02) {
      to += 0.02 - from
      from = 0.02
    }
    if (to > 0.94) {
      from = Math.max(0.02, from - (to - 0.94))
      to = 0.94
    }

    /*
     * 앞뒤 자리.
     * 한 줄로만 걸으면 열두 명이 겹쳐서 몇 명인지 세어지지 않는다.
     * 뒤로 갈수록 작게 그리고 뒤에 둔다.
     */
    const back = pick(seed, 21, 32)

    return {
      id: person.id,
      person,
      seed,
      /*
       * 오가는 데 걸리는 시간.
       * 구간이 좁아진 만큼 줄여야 걷는 속도가 그대로다.
       * 안 줄이면 좁은 자리를 아주 느리게 기어가는 것처럼 보인다.
       */
      dur: Number((pace * ((to - from) / 0.9)).toFixed(1)),
      // 같은 구간이라도 지금 어디쯤 와 있는지는 사람마다 다르다
      delay: -(pace * ((to - from) / 0.9) * (pick(seed, 11, 100) / 100)),
      from: Number((from * 100).toFixed(1)),
      to: Number((to * 100).toFixed(1)),
      /*
       * 물속에서는 back 이 앞뒤가 아니라 높이다.
       * 바닥(24px)에서 재던 것을 판 아래에서 %로 재서, 물기둥 전체에 흩어진다.
       */
      depth: Number((10 + ((i * 37 + pick(seed, 17, 40)) % 62)).toFixed(0)),
      // 사람마다 다른 박자. 같은 동작이라도 시작점이 달라야 한 무리로 안 논다
      phase: -Number(((pick(seed, 23, 600) / 100) % 6).toFixed(2)),
      scale: Number((1.0 - (back / 32) * 0.32).toFixed(2)),
      // 느리게 걸으니 발도 느리게 놀려야 한다
      step: 0.62 + pick(seed, 15, 26) / 100,
      back,
    }
  })
})
/*
 * 마주치면 악수한다.
 *
 * 자리 이동은 CSS 가 맡고 있어서(left 를 % 로 오가는 keyframes)
 * 누가 지금 어디 있는지는 자바스크립트가 알 도리가 없다.
 * 그래서 계산하지 않고 재기로 했다 — 실제로 그려진 자리를 읽는다.
 *
 * 깊이(back)가 비슷한 둘만 짝으로 본다. 화면에서 겹쳐 보인다고
 * 다 만난 게 아니다. 뒤쪽 언덕을 걷는 사람과 앞쪽 풀밭을 걷는 사람은
 * 가로 자리가 같아도 서로 다른 자리에 있다.
 */
const greeting = ref({})
let beat = null

/* 방금 인사한 둘은 한동안 다시 걸리지 않는다.
   손을 놓자마자 같은 자리에서 또 잡으면 인사가 아니라 고장으로 보인다 */
const cooled = new Map()

/*
 * 악수가 성립하는 사이.
 *
 * 30px 로 두었더니 몸이 거의 겹친 채로 손을 잡았다.
 * 사람 하나가 44px 인데 30px 까지 붙으면 둘이 한 덩어리로 보여서,
 * 악수를 하는 건지 겹쳐 서 있는 건지 알 수가 없었다.
 *
 * 몸 하나 너비쯤 떨어져 있을 때 잡는다. 사람 크기는 인원수와 깊이에 따라
 * 달라지므로 고정 픽셀이 아니라 실제로 그려진 너비로 잰다.
 */
const MEET_LO = 0.86
const MEET_HI = 1.3
const GREET_MS = 2600
const COOL_MS = 11000

const look = () => {
  const now = Date.now()
  const seen = []
  props.people.forEach((p) => {
    const el = document.querySelector(`.walker[data-wid="${CSS.escape(p.id)}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    if (!r.width) return
    seen.push({ id: p.id, x: r.left + r.width / 2, y: r.bottom, w: r.width })
  })

  for (let a = 0; a < seen.length; a += 1) {
    for (let b = a + 1; b < seen.length; b += 1) {
      const one = seen[a]
      const two = seen[b]
      if (greeting.value[one.id] || greeting.value[two.id]) continue
      // 같은 깊이에서 걷고 있어야 정말 마주친 것이다
      if (Math.abs(one.y - two.y) > 7) continue
      const gap = Math.abs(one.x - two.x)
      const body = (one.w + two.w) / 2
      if (gap < body * MEET_LO || gap > body * MEET_HI) continue
      const pair = one.id < two.id ? `${one.id}|${two.id}` : `${two.id}|${one.id}`
      if ((cooled.get(pair) ?? 0) > now) continue

      /*
       * 왼쪽에 선 사람이 오른팔을, 오른쪽에 선 사람이 왼팔을 뻗는다.
       * 여기서만 누가 어느 쪽인지 알 수 있다.
       */
      const [lft, rgt] = one.x <= two.x ? [one, two] : [two, one]
      /*
       * 악수냐 하이파이브냐.
       *
       * 겉모습은 사람마다 늘 같아야 해서 씨앗으로 정하지만,
       * 이건 겉모습이 아니라 그때그때 일어나는 일이라 그냥 뽑는다.
       * 같은 둘이 만나도 이번엔 악수, 다음엔 하이파이브면 된다.
       */
      const hi = Math.random() < 0.42
      greeting.value = {
        ...greeting.value,
        [lft.id]: hi ? 'five' : 'greet',
        [rgt.id]: hi ? 'fiveL' : 'greetL',
      }
      cooled.set(pair, now + GREET_MS + COOL_MS)
      setTimeout(() => {
        const next = { ...greeting.value }
        delete next[one.id]
        delete next[two.id]
        greeting.value = next
      }, GREET_MS)
    }
  }
}

/*
 * 무대가 바뀌면 하던 인사는 없던 일이 된다.
 *
 * 악수는 밖에서 시키는 동작이라 무대가 바뀌어도 그대로 남는다.
 * 들판에서 손을 잡던 둘이 심해로 넘어가서도 물속에 선 채로 손을
 * 흔들고 있었다 — 헤엄치는 사람들 사이에서 그 둘만 뭍에 있었다.
 */
watch(
  () => stage.value.id,
  () => {
    greeting.value = {}
    cooled.clear()
  },
)

onMounted(() => {
  /*
   * 펼치는 동안에도 계속 잰다.
   * 높이가 116 에서 200 으로 흐르는 사이 그림은 계속 커지는데, 처음과 끝만
   * 재면 사람들은 두 자리 사이를 순간이동한다. 매 프레임 같이 따라가야
   * 그림이 커지는 동안 발이 지면에 붙어 있다.
   */
  ro = new ResizeObserver(() => measure(stageEl.value))
  if (stageEl.value) {
    ro.observe(stageEl.value)
    measure(stageEl.value)
  }
  beat = setInterval(look, 520)
})
onUnmounted(() => {
  clearInterval(beat)
  ro?.disconnect()
})
</script>

<template>
  <div class="ambient">
    <!--
      도판 제목 줄.
      여기는 손으로 그린 그림이고 위쪽 창은 계산해서 그리는 판이라 결이 아주 다른데,
      아무 표시 없이 나란히 두면 둘 중 하나가 덜 만든 것처럼 보인다.
    -->
    <p class="plate-cap">
      <span class="plate-no">PL.</span>
      <span class="plate-name">{{ configStore.t('yard.plate') }}</span>
      <span class="plate-rule" aria-hidden="true"></span>
      <button
        type="button"
        class="plate-pick"
        :aria-expanded="pickerOpen"
        @click="pickerOpen = !pickerOpen"
      >
        <span v-if="stage.no" class="pno">#{{ stage.no }}</span>
        {{ stageName }}
        <span class="chev" :class="{ up: pickerOpen }" aria-hidden="true">▾</span>
      </button>
    </p>

    <!-- 무대 고르기 -->
    <Transition name="drawer">
      <div v-if="pickerOpen" class="picker">
        <section v-for="g in groups" :key="g.id" class="group">
          <p class="group-name">{{ g.label }}</p>
          <ul class="swatches">
            <li v-for="s in g.stages" :key="s.id">
              <button
                type="button"
                class="swatch"
                :class="{ on: s.id === configStore.yardTheme }"
                :aria-pressed="s.id === configStore.yardTheme"
                @click="pickStage(s.id)"
              >
                <span
                  class="chip"
                  aria-hidden="true"
                  :style="{
                    background: `linear-gradient(165deg, ${s.sky} 0%, ${s.far} 55%, ${s.ground} 100%)`,
                  }"
                >
                  <i class="dot" :style="{ background: s.accent }"></i>
                </span>
                <span class="meta">
                  <span v-if="s.no" class="sno">#{{ s.no }}</span>
                  <span class="sen">{{ s.en }}</span>
                  <span class="sko">{{ s.ko }}</span>
                </span>
              </button>
            </li>
          </ul>
        </section>
      </div>
    </Transition>

    <!--
      눌러서 넓게 보는 판.
      button 이 아니라 div 에 역할을 준 건, 안에 다른 버튼이 들어갈 수 있어서
      버튼 안에 버튼이 들어가는 짜임을 피하려는 것이다.
    -->
    <div
      ref="stageEl"
      class="stage"
      :class="[stage.lang, { open }]"
      role="button"
      tabindex="0"
      :aria-expanded="open"
      :aria-label="configStore.t(open ? 'yard.collapse' : 'yard.expand')"
      @click="open = !open"
      @keydown.enter.prevent="open = !open"
      @keydown.space.prevent="open = !open"
    >
      <StageScene :stage="stage" :open="open" :fit="fit" />

      <!-- 걸어다니는 사람들 -->
      <TransitionGroup name="walker" type="transition" tag="div" class="walkers" :style="ground">
        <YardWalker
          v-for="w in walkers"
          :key="w.id"
          :person="w.person"
          :variant="isEngraved ? 'line' : 'sticker'"
          :accent="stage.accent"
          :seed="w.seed"
          :dur="w.dur"
          :delay="w.delay"
          :scale="w.scale"
          :step="w.step"
          :weather="weatherById[w.person.id] ?? null"
          :under="!!stage.under"
          :depth="w.depth"
          :phase="w.phase"
          :from="w.from"
          :to="w.to"
          :back="w.back"
          :forced="greeting[w.person.id] || ''"
        />
      </TransitionGroup>

      <!--
        고정 프레임.
        참고한 표지 열세 장 모두 좌하단에 초소형 대문자 라벨,
        우하단에 손글씨 서명이 예외 없이 들어가 있었다.
      -->
      <p class="frame-label">
        {{ stage.lang === 'engraved' ? 'GOLDEN RECORDS' : 'BALLOON' }}
        ·
        <template v-if="stage.no">#{{ stage.no }}</template>
        {{ stage.en }}
      </p>
      <p class="frame-sign">{{ configStore.t('yard.sign') }}</p>

      <span class="hint" aria-hidden="true">
        {{ configStore.t(open ? 'yard.collapse' : 'yard.expand') }}
        <svg viewBox="0 0 10 6"><path d="M1 1.5 5 4.8 9 1.5" /></svg>
      </span>
    </div>
  </div>
</template>

<style scoped>
/*
 * 판의 높이를 화면이 아니라 판 자신의 폭에서 잰다.
 *
 * vw 로 재던 것이 어긋나 있었다. 화면 폭에는 좌우 여백이 붙어 있어서,
 * 32.5vw 는 화폭의 비가 아니라 '여백까지 포함한 비'가 된다. 390px 화면에서
 * 판은 358px 인데 32.5vw 는 127px 을 내놓으니, 비율대로면 116px 인 그림이
 * 11px 더 큰 상자에 들어가고 그만큼 좌우가 잘렸다.
 *
 * cqw 는 이 상자의 폭을 잰다. 32.5cqw 는 어느 폭에서든 정확히 화폭의 비다.
 */
.ambient {
  container-type: inline-size;
}

/* 도판 제목 줄. 도감의 도판 캡션에서 가져온 형식이다 */
.plate-cap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 0;
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  letter-spacing: 0.1em;
  color: var(--color-ink-3);
}
.plate-no {
  color: var(--color-gold);
}
.plate-name {
  letter-spacing: 0.04em;
  color: var(--color-ink-2);
}
.plate-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-gold) 55%, transparent),
    color-mix(in srgb, var(--color-gold) 18%, transparent)
  );
}
.plate-pick {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 2px 6px;
  font-family: inherit;
  font-size: inherit;
  letter-spacing: 0.06em;
  color: var(--color-ink-2);
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    color var(--dur-state) var(--ease-out),
    border-color var(--dur-state) var(--ease-out);
}
.plate-pick:hover {
  color: var(--color-ink);
  border-color: var(--color-line);
}
.pno {
  color: var(--color-gold);
}
.chev {
  font-size: 8px;
  transition: transform var(--dur-move) var(--ease-out);
}
.chev.up {
  transform: rotate(180deg);
}

/* ── 무대 고르기 ── */
.picker {
  margin-top: 8px;
  padding: 14px;
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
}
.drawer-enter-active,
.drawer-leave-active {
  transition:
    opacity var(--dur-move) var(--ease-out),
    transform var(--dur-move) var(--ease-out);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.group + .group {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--color-line);
}
.group-name {
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  letter-spacing: 0.12em;
  color: var(--color-ink-4);
}
.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.swatch {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px;
  text-align: left;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    border-color var(--dur-state) var(--ease-out),
    background-color var(--dur-state) var(--ease-out);
}
.swatch:hover {
  background: var(--color-paper-2);
}
.swatch.on {
  border-color: var(--color-gold);
  background: var(--color-paper-2);
}
/* 무대의 색 세 단계를 미리 보여 준다 */
.chip {
  position: relative;
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
}
.dot {
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  box-shadow: 0 0 0 1.4px rgba(0, 0, 0, 0.22);
}
.meta {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}
.sno {
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.06em;
  color: var(--color-gold);
}
.sen {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sko {
  font-size: var(--fs-2xs);
  color: var(--color-ink-3);
}

/* ── 판 ── */
.stage {
  position: relative;
  margin-top: 8px;
  /*
   * 접힌 띠.
   *
   * 15.4cqw 는 펼친 높이의 47%다 — 넓은 화면에서 132/279 로 잡아 두었던
   * 그 비를 그대로 폭에서 뽑는다. 어느 폭에서나 같은 만큼만 보여 준다.
   *
   * 다만 아래를 막는다. 좁은 화면에서 비율대로 가면 55px 이 되는데,
   * 거기 서는 사람이 36px 이라 띠를 사람이 다 차지한다.
   */
  height: max(86px, min(15.4cqw, 132px));
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-gold) 30%, var(--color-line));
  border-radius: 4px;
  cursor: pointer;
  transition: height var(--dur-move) var(--ease-out);
}
.stage.open {
  /*
   * 펼친 판은 화폭의 비 그대로다. 32.5cqw = 260/800.
   *
   * 한동안 좁은 화면에서만 200px 로 열었다. 116px 로 여는 건 여는 게
   * 아니라고 봤고, 넘치는 만큼은 좌우를 잘라 채웠다.
   * 잘리는 양이 문제였다 — 358px 판에 200px 이면 그림이 615px 로 그려져서
   * 화폭의 42%가 화면 밖으로 나갔다. 왼쪽 절반이 통째로 없는 그림이었다.
   *
   * 넓게 보려고 누르는 건 판을 키우려는 게 아니라 그림 전체를 보려는 것이다.
   * 그래서 비율을 지키는 쪽으로 되돌렸다. 좁은 화면에서 펼친 판은
   * 낮고 길어지지만, 넓은 화면에서 보는 것과 같은 그림이 다 보인다.
   */
  height: min(32.5cqw, 279px);
}
.stage:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 2px;
}

/* ── 걸어다니는 사람들 ── */
.walkers {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
/* 사람이 늘고 줄 때 */
.walker-enter-active,
.walker-leave-active {
  transition:
    opacity var(--dur-move) var(--ease-out),
    transform var(--dur-move) var(--ease-out);
}
.walker-enter-from,
.walker-leave-to {
  opacity: 0;
  transform: scale(calc(var(--scale) * 0.6));
}

/* ── 고정 프레임 ── */
.frame-label,
.frame-sign {
  position: absolute;
  bottom: 7px;
  margin: 0;
  font-size: 8.5px;
  pointer-events: none;
  /* 어두운 무대든 밝은 무대든 읽히게 */
  mix-blend-mode: difference;
  color: #d8d4cc;
}
.frame-label {
  left: 10px;
  font-family: var(--font-mono);
  letter-spacing: 0.14em;
}
.frame-sign {
  right: 10px;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 11px;
  letter-spacing: 0.02em;
}

.hint {
  position: absolute;
  top: 8px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  font-size: 9.5px;
  letter-spacing: 0.08em;
  color: #f2ead9;
  background: rgba(12, 14, 18, 0.34);
  border: 1px solid rgba(242, 234, 217, 0.28);
  border-radius: 999px;
  backdrop-filter: blur(4px);
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--dur-state) var(--ease-out);
}
.stage:hover .hint,
.stage:focus-visible .hint,
.stage.open .hint {
  opacity: 1;
}
.hint svg {
  width: 9px;
  height: 6px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  transition: transform var(--dur-move) var(--ease-out);
}
.stage.open .hint svg {
  transform: rotate(180deg);
}

@media (max-width: 560px) {
  /* 판 높이는 이제 폭에서 나오므로 여기서 따로 정하지 않는다 */
  .swatches {
    grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  }
  /*
   * 라벨과 서명을 판 끝으로 더 붙인다.
   *
   * 좁은 화면에서는 그림이 절반 크기로 그려지고, 지면 띠도 34px 이 아니라
   * 14px 이다. 발밑이 그 띠를 따라 내려오면서 예전 라벨 자리와 겹친다.
   * 겹치는 쪽을 비켜 주는 건 라벨이다 — 지면은 옮길 수 없다.
   */
  .frame-label,
  .frame-sign {
    bottom: 3px;
  }
  .frame-label {
    font-size: 7.5px;
    letter-spacing: 0.1em;
  }
  .frame-sign {
    font-size: 9.5px;
  }
}
</style>
