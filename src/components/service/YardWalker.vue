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
})

const { act } = usePersonAct(props.seed)

// 밖에서 시킨 게 있으면 그게 먼저다
const shown = computed(() => props.forced || act.value)

const style = computed(() => ({
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
  <div class="walker" :class="{ resting: shown !== 'walk' }" :data-wid="person.id" :style="style">
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
