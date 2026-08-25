<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

const walkers = computed(() => {
  const total = props.people.length || 1

  return props.people.map((person, i) => {
    const seed = hash(person.id + i)

    // 산책이라 느긋해야 한다. 빠르면 쫓기는 것처럼 보인다.
    const duration = 74 + pick(seed, 3, 46)

    /*
     * 출발 지점.
     * 처음에는 id 에서 뽑은 수만 썼는데 몇 명 안 될 때 한쪽에 몰려 서 있었다.
     * 자리를 먼저 고르게 나눠 주고 거기에 조금씩만 흔들어 준다.
     */
    const spread = i / total
    const jitter = pick(seed, 7, 100) / 100 / total

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
      dur: duration,
      delay: -(duration * ((spread + jitter) % 1)),
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

const MEET_PX = 26
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
    seen.push({ id: p.id, x: r.left + r.width / 2, y: r.bottom })
  })

  for (let a = 0; a < seen.length; a += 1) {
    for (let b = a + 1; b < seen.length; b += 1) {
      const one = seen[a]
      const two = seen[b]
      if (greeting.value[one.id] || greeting.value[two.id]) continue
      // 같은 깊이에서 걷고 있어야 정말 마주친 것이다
      if (Math.abs(one.y - two.y) > 7) continue
      if (Math.abs(one.x - two.x) > MEET_PX) continue
      const pair = one.id < two.id ? `${one.id}|${two.id}` : `${two.id}|${one.id}`
      if ((cooled.get(pair) ?? 0) > now) continue

      greeting.value = { ...greeting.value, [one.id]: true, [two.id]: true }
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

onMounted(() => {
  beat = setInterval(look, 520)
})
onUnmounted(() => clearInterval(beat))
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
                @click="configStore.setYardTheme(s.id)"
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
      <StageScene :stage="stage" :open="open" />

      <!-- 걸어다니는 사람들 -->
      <TransitionGroup name="walker" type="transition" tag="div" class="walkers">
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
          :back="w.back"
          :forced="greeting[w.person.id] ? 'greet' : ''"
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
  height: 132px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-gold) 30%, var(--color-line));
  border-radius: 4px;
  cursor: pointer;
  transition: height var(--dur-move) var(--ease-out);
}
.stage.open {
  /* 화폭이 800x260 이라 이 비로 열어야 그림이 비율 그대로 다 들어온다 */
  height: clamp(200px, 32.5vw, 279px);
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
  .stage {
    height: 116px;
  }
  .swatches {
    grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .walker {
    left: calc(6% + var(--back) * 2.4%);
  }
}
</style>
