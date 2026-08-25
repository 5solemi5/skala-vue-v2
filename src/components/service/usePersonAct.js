import { ref, onUnmounted } from 'vue'

/*
 * 사람이 지금 무엇을 하고 있나.
 *
 * 걷기만 시켜 놓으면 열두 명이 한 줄로 좌우를 오가는 컨베이어가 된다.
 * 걷다가 멈춰 서고, 기지개를 켜고, 앉아 쉬다가, 가끔 폴짝 뛴다.
 *
 * ── 왜 CSS 만으로 안 했나 ──────────────────────────
 * 한 벌의 긴 keyframes 안에 여섯 가지 동작을 시간대별로 욱여넣을 수는 있다.
 * 그런데 동작마다 움직이는 부위가 달라서(앉기는 다리, 기지개는 팔)
 * 한 타임라인에 섞으면 어느 구간이 무슨 동작인지 알아볼 수 없게 된다.
 *
 * 지금 무엇을 하는지만 여기서 정하고, 그 동작을 어떻게 그릴지는 CSS 가 맡는다.
 *
 * ── 자리 이동은 CSS 가 계속 맡는다 ────────────────
 * 걷지 않는 동안에는 부모가 animation-play-state 를 멈춰 세운다.
 * 그래서 '멈춰 서서 기지개를 켠다' 가 자연스럽게 나온다.
 */

/** 동작과 머무는 시간(초). 걷는 시간이 길어야 산책처럼 보인다 */
const ACTS = [
  { id: 'walk', min: 9, max: 20 },
  { id: 'idle', min: 3, max: 6 },
  { id: 'stretch', min: 2.6, max: 3.4 },
  { id: 'sit', min: 6, max: 12 },
  { id: 'jump', min: 1.6, max: 2.4 },
  { id: 'look', min: 2.4, max: 4 },
  // 뛰어서 날아가듯. 오래 하면 마당이 아니라 운동장이 되므로 짧게
  { id: 'dash', min: 2.2, max: 3.6 },
  // 손 흔들기. 짧아야 인사로 읽힌다. 길면 누굴 부르는 것 같다
  { id: 'wave', min: 1.8, max: 2.8 },
  // 리듬 타기
  { id: 'dance', min: 3, max: 5.5 },
  // 쪼그려 앉아 들여다보기. 오래 봐도 어색하지 않다
  { id: 'crouch', min: 4, max: 8 },
  // 제자리에서 한 바퀴
  { id: 'spin', min: 1.6, max: 3 },
]

/*
 * 다음에 무엇을 할까.
 *
 * 걷기가 절반쯤 나오게 무게를 준다. 안 그러면 다들 앉아만 있어서
 * 마당이 아니라 대기실처럼 보인다.
 * 앉았다가 바로 또 앉는 것도 막는다.
 */
const NEXT = {
  walk: ['idle', 'stretch', 'sit', 'jump', 'look', 'dash', 'crouch', 'walk', 'walk', 'walk'],
  idle: ['walk', 'walk', 'stretch', 'look', 'wave', 'dance', 'spin'],
  stretch: ['walk', 'walk', 'idle', 'dance'],
  sit: ['walk', 'walk', 'idle', 'look'],
  jump: ['walk', 'walk', 'dash', 'spin', 'idle'],
  look: ['walk', 'walk', 'sit', 'wave'],
  // 뛰고 나면 숨을 고른다. 계속 날아다니면 한 명만 따로 노는 것처럼 보인다
  dash: ['walk', 'walk', 'idle', 'jump'],
  // 손을 흔들었으면 가던 길을 간다. 흔들고 또 흔들면 인사가 아니게 된다
  wave: ['walk', 'walk', 'idle'],
  dance: ['walk', 'idle', 'spin', 'walk'],
  // 들여다보다 일어나면 기지개가 자연스럽다
  crouch: ['walk', 'stretch', 'idle', 'walk'],
  spin: ['walk', 'walk', 'idle', 'dance'],
}

const spec = (id) => ACTS.find((a) => a.id === id) ?? ACTS[0]

/**
 * @param seed  사람마다 다른 수. 같은 사람은 늘 같은 차례로 움직인다
 */
export const usePersonAct = (seed = 1) => {
  const act = ref('walk')

  // 사람마다 다른 차례가 나오도록 씨앗에서 뽑는다
  let x = seed >>> 0 || 1
  const rand = () => {
    x ^= x << 13
    x >>>= 0
    x ^= x >> 17
    x ^= x << 5
    x >>>= 0
    return x / 4294967296
  }

  let timer = null
  const step = () => {
    const s = spec(act.value)
    const hold = (s.min + rand() * (s.max - s.min)) * 1000
    timer = setTimeout(() => {
      const pool = NEXT[act.value] ?? ['walk']
      act.value = pool[Math.floor(rand() * pool.length)]
      step()
    }, hold)
  }

  // 다 같이 걷기 시작하면 줄 맞춰 행진하는 것처럼 보인다. 시작을 흩어 놓는다
  timer = setTimeout(step, rand() * 6000)

  onUnmounted(() => clearTimeout(timer))

  return { act }
}
