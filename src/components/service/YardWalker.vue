<script setup>
import { computed } from 'vue'
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
  /*
   * 물속인가.
   *
   * 물속에서는 바닥을 딛지 않는다. 발밑을 지면에 못 박아 두면
   * 헤엄치는 자세로 해저를 걸어다니게 된다.
   */
  under: { type: Boolean, default: false },
  // 물속에서 이 사람이 떠 있는 높이(판 아래에서 %)
  depth: { type: Number, default: 30 },
})

const { act } = usePersonAct(props.seed, () => (props.under ? 'sea' : 'land'))

// 밖에서 시킨 게 있으면 그게 먼저다
const shown = computed(() => props.forced || act.value)

const style = computed(() => ({
  '--depth': `${props.depth}%`,
  '--dur': `${props.dur}s`,
  '--delay': `${props.delay}s`,
  '--scale': String(props.scale),
  '--back': `${props.back}px`,
  '--from': `${props.from}%`,
  '--to': `${props.to}%`,
  zIndex: String(40 - props.back),
}))
</script>

<template>
  <div
    class="walker"
    :class="{ resting: shown !== 'walk' && shown !== 'swim', under }"
    :data-wid="person.id"
    :style="style"
  >
    <PersonFigure :person="person" :variant="variant" :accent="accent" :act="shown" :step="step" />
  </div>
</template>

<style scoped>
.walker {
  position: absolute;
  /*
   * 지면은 접혀 있든 펼쳐져 있든 늘 판의 아래쪽이다.
   * 다만 맨 아래 22px 은 좌하단 라벨과 우하단 서명이 쓰는 자리라 비켜 선다.
   */
  bottom: calc(24px + var(--back) * 0.42);
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
 */
.walker :deep(.figure) {
  width: calc(44px * var(--size, 1));
  height: calc(51px * var(--size, 1));
}

@media (max-width: 560px) {
  /* 좁은 화면에서는 판도 116px 로 낮아진다 */
  .walker :deep(.figure) {
    width: calc(36px * var(--size, 1));
    height: calc(42px * var(--size, 1));
  }
}

@media (prefers-reduced-motion: reduce) {
  /* 움직이지 않을 때는 자기 구간 한가운데에 선다 */
  .walker {
    animation: none;
    left: calc((var(--from) + var(--to)) / 2);
  }
}
</style>
