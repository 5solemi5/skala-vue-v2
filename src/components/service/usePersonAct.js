import { ref, watch, onUnmounted } from 'vue'

/*
 * 사람이 지금 무엇을 하고 있나.
 *
 * 걷기만 시켜 놓으면 열두 명이 한 줄로 좌우를 오가는 컨베이어가 된다.
 * 걷다가 멈춰 서고, 기지개를 켜고, 앉아 쉬다가, 가끔 폴짝 뛴다.
 *
 * 무대가 물속이면 동작 표가 통째로 바뀐다.
 * 걷기·앉기·점프는 바닥과 중력이 있어야 성립하는 동작이라
 * 심해에서는 쓸 수가 없다. 색만 바꿔 쓰면 물속에서 걸어다니게 된다.
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

/*
 * ── 물속 ──────────────────────────────────────────
 *
 * 뭍의 동작을 색만 바꿔 쓸 수가 없다.
 * 걷기는 바닥을 디뎌야 하고, 앉기와 쪼그려 앉기는 중력이 있어야 하고,
 * 점프는 떨어질 곳이 있어야 한다. 물속에는 셋 다 없다.
 *
 * 여기서는 기본이 헤엄이고, 멈추면 걷는 게 아니라 뜬다.
 */
const SEA_ACTS = [
  { id: 'swim', min: 8, max: 18 },
  // 팔다리를 접고 가만히 떠 있기
  { id: 'hover', min: 3, max: 7 },
  // 물살에 몸을 맡기고 흐르기
  { id: 'drift', min: 4, max: 9 },
  // 위로 차고 오르기
  { id: 'ascend', min: 2.4, max: 4 },
  // 아래로 가라앉기
  { id: 'sink', min: 2.6, max: 4.5 },
  // 앞으로 한 바퀴
  { id: 'roll', min: 1.8, max: 3 },
  // 몸을 웅크렸다 펴며 나아가기
  { id: 'tuck', min: 2.2, max: 3.6 },
  // 물속에서도 인사는 한다
  { id: 'wave', min: 1.8, max: 2.8 },
]

const SEA_NEXT = {
  swim: ['hover', 'drift', 'roll', 'tuck', 'ascend', 'sink', 'swim', 'swim', 'swim'],
  hover: ['swim', 'swim', 'drift', 'wave', 'roll'],
  drift: ['swim', 'swim', 'hover', 'sink'],
  ascend: ['swim', 'drift', 'hover'],
  sink: ['swim', 'hover', 'drift'],
  roll: ['swim', 'swim', 'hover', 'tuck'],
  tuck: ['swim', 'swim', 'roll'],
  wave: ['swim', 'swim', 'hover'],
}

const SETS = {
  land: { acts: ACTS, next: NEXT, first: 'walk' },
  sea: { acts: SEA_ACTS, next: SEA_NEXT, first: 'swim' },
}

const spec = (set, id) => set.acts.find((a) => a.id === id) ?? set.acts[0]

/**
 * @param seed  사람마다 다른 수. 같은 사람은 늘 같은 차례로 움직인다
 */
/**
 * @param seed   사람마다 다른 수. 같은 사람은 늘 같은 차례로 움직인다
 * @param world  'land' | 'sea', 또는 그것을 돌려주는 함수.
 *
 * 함수로 받는 이유가 있다.
 * 처음에는 문자열 하나로 받아 setup 때 한 번만 읽었다. 그런데 사람은
 * id 로 키가 잡혀 있어서 무대를 바꿔도 컴포넌트가 다시 만들어지지 않는다.
 * 들판에서 심해로 넘어가면 자리와 자세는 물속으로 바뀌는데
 * 동작 기계는 뭍의 것이 그대로 돌아, 바닷속을 걸어다녔다.
 */
export const usePersonAct = (seed = 1, world = 'land') => {
  const worldOf = () => (typeof world === 'function' ? world() : world)
  let set = SETS[worldOf()] ?? SETS.land
  const act = ref(set.first)

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
    const s = spec(set, act.value)
    const hold = (s.min + rand() * (s.max - s.min)) * 1000
    timer = setTimeout(() => {
      const pool = set.next[act.value] ?? [set.first]
      act.value = pool[Math.floor(rand() * pool.length)]
      step()
    }, hold)
  }

  // 다 같이 걷기 시작하면 줄 맞춰 행진하는 것처럼 보인다. 시작을 흩어 놓는다
  timer = setTimeout(step, rand() * 6000)

  /*
   * 세계가 바뀌면 기계를 갈아 끼운다.
   *
   * 기다리던 타이머부터 끊는다. 안 끊으면 뭍의 차례가 한 번 더 돌아
   * 물속에서 '앉기' 가 한 번 나오고 그다음부터 헤엄친다.
   */
  watch(
    () => worldOf(),
    (w) => {
      clearTimeout(timer)
      set = SETS[w] ?? SETS.land
      /*
       * 다 같이 같은 동작으로 시작하지 않는다.
       *
       * 처음에는 새 세계의 기본 동작(걷기·헤엄)으로 전원을 돌려놓았다.
       * 그랬더니 배경을 바꾸는 순간 열두 명이 한 몸처럼 같은 자세를
       * 취해서, 그 자리에 살고 있던 사람들이 아니라 방금 배치된
       * 인형들로 보였다.
       *
       * 각자 다른 동작으로 시작한다. 누구는 헤엄치고 누구는 떠 있고
       * 누구는 흐르고 있으면, 원래 거기서 그러고 있던 것으로 보인다.
       */
      const pool = set.next[set.first] ?? [set.first]
      act.value = pool[Math.floor(rand() * pool.length)]
      step()
    },
  )

  onUnmounted(() => clearTimeout(timer))

  return { act }
}
