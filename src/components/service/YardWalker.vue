<script setup>
import { computed, ref, watch, nextTick, onUnmounted } from 'vue'
import PersonFigure from './PersonFigure.vue'
import { usePersonAct } from './usePersonAct'

/*
 * 마당을 오가는 사람 하나.
 *
 * 사람마다 자기 차례로 걷다 쉬다 해야 해서 한 명을 한 컴포넌트로 뒀다.
 * 여러 명의 동작을 부모 한 곳에서 관리하려면 타이머 목록을 들고 있어야 하는데,
 * 사람이 늘고 줄 때마다 그 목록을 맞춰 주는 일이 붙는다.
 * 컴포넌트로 두면 사라질 때 자기 타이머를 알아서 정리한다.
 */
const props = defineProps({
  person: { type: Object, required: true },
  variant: { type: String, default: 'sticker' },
  accent: { type: String, default: '#EAC379' },
  seed: { type: Number, default: 1 },
  // 걷는 데 걸리는 시간, 시작 지점, 앞뒤 자리 — 부모가 정해서 넘긴다
  dur: { type: Number, default: 90 },
  delay: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  step: { type: Number, default: 0.86 },
  // 이 사람이 오가는 구간(%). 판 전체가 아니라 자기 몫만 오간다
  from: { type: Number, default: 2 },
  to: { type: Number, default: 92 },
  back: { type: Number, default: 0 },
  /*
   * 밖에서 시키는 동작. 없으면 스스로 정한 걸 한다.
   *
   * 악수만은 혼자 정할 수 없다. 마주 서 있지 않은데 손을 내밀면
   * 허공에 대고 흔드는 것이 되어서, 누가 옆에 왔는지 아는 쪽 —
   * 즉 마당 전체를 보는 부모가 정해서 내려보낸다.
   */
  forced: { type: String, default: '' },
  // 그곳의 지금 날씨. 비가 오면 우산을 편다
  weather: { type: Object, default: null },
  /*
   * 물속인가.
   *
   * 물속에서는 바닥을 딛지 않는다. 발밑을 지면에 못 박아 두면
   * 헤엄치는 자세로 해저를 걸어다니게 된다.
   */
  under: { type: Boolean, default: false },
  // 물속에서 이 사람이 떠 있는 높이(판 아래에서 %)
  depth: { type: Number, default: 30 },
  // 애니메이션을 얼마나 앞당겨 시작할지(음수 초)
  phase: { type: Number, default: 0 },
})

const { act } = usePersonAct(props.seed, () => (props.under ? 'sea' : 'land'))

// 밖에서 시킨 게 있으면 그게 먼저다
const target = computed(() => props.forced || act.value)

/*
 * 동작을 바꿀 때 한 박자 쉬어 간다.
 *
 * 그냥 바꾸면 이전 자세가 중간에 잘린다. 팔을 뻗다 만 채로 사라지고
 * 다음 동작의 첫 프레임이 그 자리에 들어와서, 팔다리가 순간이동한다.
 * 사람이 동작을 바꾸는 게 아니라 그림이 갈아 끼워지는 것으로 보인다.
 *
 *   1  지금 팔다리가 어디 있는지 읽어 둔다 (아직 이전 동작이 돌고 있을 때)
 *   2  새 동작으로 갈아 끼우되 재생은 멈춰 둔다
 *   3  이전 자세에서 새 동작의 첫 자세까지 흘려보낸다
 *   4  도착하면 재생을 푼다
 *
 * ── 원자세로 돌리면 안 된다 ───────────────────────
 * 처음에는 무조건 선 자세(transform: none)로 되돌렸다. 뭍에서는 대부분의
 * 동작이 선 자세에서 시작하니 그런대로 맞았는데, 물속에서 무너졌다.
 * 헤엄은 -64도로 누워 있고 흐르기는 -42도로 누워 있어서,
 * 그 사이에 0도를 한 번 거치면 물속에서 벌떡 일어섰다 다시 눕는다.
 *
 * 그래서 돌아갈 곳을 정해 두지 않는다. 새 동작을 멈춘 채로 씌워 두면
 * 그 동작의 0% 자세가 그대로 읽히므로, 거기로 곧장 간다.
 *
 * ── transition 으로는 안 됐다 ─────────────────────
 * 처음에는 인라인으로 자세를 박아 두고 transition 으로 놓아 주었다.
 * 그런데 재어 보니 260ms 중 앞의 200ms 는 꿈쩍도 않다가 끝에서 한 번에
 * 움직였다. 애니메이션을 끄는 것과 인라인을 지우는 것이 한 번의
 * 스타일 계산에 섞이면서 transition 이 제때 시작을 못 잡은 것이다.
 *
 * Web Animations 로 직접 재생하면 시작점과 끝점을 코드가 쥐고 있으니
 * 그런 실랑이가 없다.
 */
/*
 * 곡선은 양끝이 느린 것으로.
 *
 * 처음에는 화면 전체가 쓰는 ease-out(0.22, 1, …)을 썼는데,
 * 그건 첫 순간에 절반을 가 버리는 곡선이라 재어 보니 40ms 만에 29도가
 * 움직였다. 부드럽게 하려던 것이 또 다른 튐이 됐다.
 * 시작도 끝도 느린 곡선이라야 팔이 흘러가는 것으로 보인다.
 *
 * 물속 자세는 60도 넘게 눕기도 해서 260ms 로는 모자란다.
 */
const EASE_MS = 320
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
const shown = ref(target.value)
const settling = ref(false)
const root = ref(null)
let timer = null

/*
 * 세계가 바뀔 때는 이어 붙이지 않는다.
 *
 * 자세를 흘려보내는 건 같은 화면 안에서 동작이 바뀔 때 쓰는 것이다.
 * 배경이 통째로 바뀌는 순간에 그걸 하면, 서 있던 0도에서 헤엄치는
 * -58도까지 몸이 돌아가는 과정이 그대로 보인다. 열두 명이 한꺼번에
 * 같은 방향으로 눕는 게 보이니 '들판 사람들을 물에 담갔다' 가 된다.
 *
 * 배경이 바뀌면 눈은 어차피 장면 전체를 다시 읽는다. 그때는 끊어야
 * 원래 거기 있던 사람들로 보인다.
 */
let cutting = false
watch(
  () => props.under,
  () => {
    cutting = true
    setTimeout(() => {
      cutting = false
    }, 120)
  },
  { flush: 'sync' },
)

watch(target, async (v) => {
  const el = root.value
  if (!el || cutting) {
    shown.value = v
    return
  }
  clearTimeout(timer)

  const nodes = [el.querySelector('.figure'), ...el.querySelectorAll('.figure *')].filter(Boolean)

  // 1 — 이전 동작이 아직 돌고 있을 때 지금 자세를 읽는다
  const from = nodes.map((n) => getComputedStyle(n).transform)

  // 2 — 새 동작으로 갈아 끼우되 재생은 멈춰 둔다.
  //     멈춘 애니메이션은 0% 에 서 있으므로, 새 동작이 어디서 시작하는지
  //     그대로 읽을 수 있다.
  settling.value = true
  shown.value = v
  await nextTick()

  // 3 — 이전 자세에서 새 동작의 첫 자세까지 흘려보낸다
  nodes.forEach((n, i) => {
    const to = getComputedStyle(n).transform
    if (from[i] === to) return
    n.animate([{ transform: from[i] }, { transform: to }], { duration: EASE_MS, easing: EASE })
  })

  // 4 — 도착하면 재생을 푼다
  timer = setTimeout(() => {
    settling.value = false
  }, EASE_MS)
})

onUnmounted(() => clearTimeout(timer))

const style = computed(() => ({
  /*
   * 이 사람의 박자.
   *
   * 같은 동작이라도 다들 0 초부터 시작하면 열둘이 한 몸처럼 젓는다.
   * 음수 지연을 주면 이미 그만큼 지나간 상태로 시작하므로,
   * 배경을 켠 순간부터 제각각인 것처럼 보인다.
   */
  '--phase': `${props.phase}s`,
  '--depth': `${props.depth}%`,
  '--dur': `${props.dur}s`,
  '--delay': `${props.delay}s`,
  '--scale': String(props.scale),
  // 단위 없는 수로 넘긴다. 발밑을 px 이 아니라 그림 배율에서 받는 --rise 와
  // 곱해야 해서, 여기에 px 이 붙어 있으면 길이끼리 곱하는 꼴이 되어 계산이 깨진다
  '--back': String(props.back),
  '--from': `${props.from}%`,
  '--to': `${props.to}%`,
  zIndex: String(40 - props.back),
}))
</script>

<template>
  <div
    class="walker"
    ref="root"
    :class="{ resting: shown !== 'walk' && shown !== 'swim', under, settling }"
    :data-wid="person.id"
    :style="style"
  >
    <PersonFigure
      :person="person"
      :variant="variant"
      :accent="accent"
      :act="shown"
      :step="step"
      :weather="weather"
      :under="under"
    />
  </div>
</template>

<style scoped>
.walker {
  position: absolute;
  /*
   * 발밑.
   *
   * 24px 로 못 박아 두었었다. 넓은 화면에서는 맞았다 — 그림이 1.075배로
   * 그려지니 지면 띠가 판 아래 34px 을 차지하고, 24px 은 그 띠 안이다.
   *
   * 좁은 화면에서 어긋났다. 그림이 절반 크기로 그려지면 지면 띠도 14px 로
   * 줄어드는데 발밑은 24px 에 그대로 있어서, 사람들이 지면 위 허공에 섰다.
   * 펼치면 더 나빠졌다 — 그림 아래로 빈칸이 생기고 거기 서 있었다.
   *
   * 그래서 픽셀을 버리고 마당이 재어 내려보내는 수를 쓴다.
   * --floor 와 --rise 는 둘 다 그림이 실제로 몇 배로 그려지고 있는지에서
   * 나오므로, 판이 어떤 크기가 되든 발은 같은 지면을 딛는다.
   */
  bottom: calc(var(--floor, 23.65px) + var(--back, 0) * var(--rise, 0.416px));
  left: 0;
  transform: scale(var(--scale));
  transform-origin: bottom center;
  animation: stroll var(--dur) linear var(--delay) infinite alternate;
}

/*
 * 걷지 않는 동안에는 자리 이동을 멈춘다.
 * 그래야 '멈춰 서서 기지개를 켠다' 가 된다.
 * 팔다리 자세는 PersonFigure 가 맡는다.
 */
.walker.resting {
  animation-play-state: paused;
}

/*
 * 동작을 바꾸는 동안.
 *
 * 팔다리 애니메이션만 끈다. 자리 이동(stroll)은 .walker 가 맡고 있어서
 * 여기 걸리지 않는다 — 자세를 고치는 동안 걸음이 멈추면
 * 그것대로 어색하다.
 */
/*
 * 자세를 옮기는 동안에는 재생만 멈춘다.
 *
 * 아예 끄면(animation: none) 새 동작이 어디서 시작하는지 알 수 없다.
 * 멈춰 두면 0% 자세에 서 있어서 그 값을 읽어 목표로 삼을 수 있다.
 */
.walker.settling :deep(.figure),
.walker.settling :deep(.figure *) {
  animation-play-state: paused !important;
}

/*
 * 물속.
 *
 * 지면에서 재지 않고 판 아래에서 %로 잰다. 물기둥 어디에나 있을 수
 * 있어야 위아래로 흩어져 뜬다. 가로로만 늘어서면 수영장 레인이 된다.
 *
 * 헤엄치는 동안에는 자리가 계속 옮겨진다. 멈추는 건 떠 있거나
 * 흐르거나 구를 때뿐이다.
 */
.walker.under {
  bottom: var(--depth);
  /*
   * 가는 방향으로 몸을 돌린다.
   *
   * stroll 은 alternate 라 한 바퀴가 두 배 시간이다 —
   * 앞의 dur 동안 오른쪽으로 가고 뒤의 dur 동안 왼쪽으로 돌아온다.
   * 그래서 두 배 길이의 애니메이션으로 절반 지점에서 판을 뒤집으면
   * 늘 나아가는 쪽을 보게 된다. 뒤집지 않으면 갈 때는 헤엄치고
   * 올 때는 뒤로 끌려가는 것처럼 보인다.
   */
  animation:
    stroll var(--dur) linear var(--delay) infinite alternate,
    face calc(var(--dur) * 2) steps(1, end) var(--delay) infinite;
}
@keyframes face {
  0% {
    transform: scale(var(--scale)) scaleX(1);
  }
  50% {
    transform: scale(var(--scale)) scaleX(-1);
  }
}

@keyframes stroll {
  from {
    left: var(--from);
  }
  to {
    left: var(--to);
  }
}

/*
 * 사람 크기.
 *
 * 30px 로 두었더니 사람마다 다르게 뽑아 둔 옷·모자 색이 보이지 않았다.
 * 공들여 나눠 놓은 것이 화면에서는 회색 점 몇 개였다.
 * 판이 132px 이고 발밑이 24~37px 이라, 54px 까지는 언덕을 가리지 않는다.
 *
 * ── 배경과 같이 커지되, 어느 밑으로는 안 내려간다 ──
 * 41 x 배율이면 넓은 화면에서 44px 이 나온다. 그림이 커지고 작아지는 대로
 * 사람도 따라가서, 나무 옆에 선 사람의 키가 어느 폭에서나 같은 비로 보인다.
 *
 * 다만 아래를 막는다. 좁은 화면에서 그림은 절반 크기로 그려지는데 그대로
 * 따라가면 사람이 18px 이 되어, 색을 못 알아보던 30px 시절로 돌아간다.
 * 작은 화면에서는 비율보다 알아보는 쪽이 먼저다 — 예전 반응형이 두던 36px 을
 * 바닥으로 삼되, 이제는 560px 에서 끊기지 않고 이어진다.
 */
.walker :deep(.figure) {
  --fig-w: max(36px, calc(41px * var(--k, 1.075)));
  width: calc(var(--fig-w) * var(--size, 1));
  /* 44 x 51 이던 비 그대로 */
  height: calc(var(--fig-w) * 1.16 * var(--size, 1));
}

@media (prefers-reduced-motion: reduce) {
  /* 움직이지 않을 때는 자기 구간 한가운데에 선다 */
  .walker {
    animation: none;
    left: calc((var(--from) + var(--to)) / 2);
  }
}
</style>
