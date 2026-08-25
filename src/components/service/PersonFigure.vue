<script setup>
import { computed } from 'vue'

/*
 * 챙기는 사람 하나를 그린다.
 *
 * 마당에서 걸어다니는 사람과 창 아래 서 있는 사람이 같은 사람으로 보여야 해서
 * 그림을 한 곳에 두고 결만 바꿔 쓴다.
 *
 *   sticker      두꺼운 흰 테두리. 일러스트형 무대에서 쓴다
 *   line         얇은 금선. 각인형 무대에서 쓴다
 *   silhouette   속을 채운 어두운 형상. 창 아래 하늘을 등지고 설 때 쓴다
 *
 * 생김새는 사람 id 에서 뽑는다.
 * 난수를 쓰면 다시 그릴 때마다 모자가 바뀌어 다른 사람처럼 보인다.
 * 마당에서 밀짚모자를 쓰고 걷던 사람이 창 아래에서도 밀짚모자여야 한다.
 */
const props = defineProps({
  person: { type: Object, required: true },
  variant: { type: String, default: 'sticker' },
  // 금선으로 그릴 때 쓸 색
  accent: { type: String, default: '#EAC379' },
  /*
   * 빛이 들어오는 쪽.
   *
   * 해가 왼쪽에 있으면 사람의 왼쪽 테두리가 밝다.
   * 그 방향을 밖에서 넘겨받는다. 창에서는 실제 해의 자리를 계산해서 주므로
   * 아침에는 왼쪽, 저녁에는 오른쪽에서 빛이 든다.
   *
   * 값은 픽셀이고, 위쪽이 음수다.
   */
  lightX: { type: Number, default: -1.6 },
  lightY: { type: Number, default: -1.6 },
  // 그 빛의 색. 노을이면 주황이고 한낮이면 흰빛에 가깝다
  lightColor: { type: String, default: 'rgba(255, 238, 198, 0.7)' },
  // 둘레로 번지는 빛. 아주 옅어야 한다
  lightSoft: { type: String, default: 'rgba(255, 226, 168, 0.28)' },
  /*
   * 지금 무엇을 하고 있나 — walk / idle / stretch / sit / jump / look
   * 무엇을 할지는 usePersonAct 가 정하고, 어떻게 보일지는 이 파일이 정한다.
   */
  act: { type: String, default: 'walk' },
  // 걸음 빠르기(초). 사람마다 조금씩 달라야 한 무리로 안 보인다
  step: { type: Number, default: 0.86 },
})

/*
 * id 에서 수를 뽑는다.
 *
 * 마지막에 한 번 섞어 준다. 이걸 빼먹었더니 열두 명이 거의 같은 옷을 입고 나왔다.
 * id 가 p_seed0 ~ p_seed11 처럼 끝 글자만 다르면 상위 비트가 거의 같은데,
 * 값을 뽑을 때 그 상위 비트를 보고 있었다.
 */
const hash = (text) => {
  let n = 0
  for (let i = 0; i < text.length; i += 1) {
    n = (n * 31 + text.charCodeAt(i)) >>> 0
  }
  n ^= n >>> 16
  n = Math.imul(n, 2246822507) >>> 0
  n ^= n >>> 13
  n = Math.imul(n, 3266489909) >>> 0
  n ^= n >>> 16
  return n >>> 0
}

// 부호 없는 시프트(>>>)를 쓴다. >> 로 하면 큰 수에서 음수가 나온다
const pick = (seed, shift, range) => (seed >>> shift) % range

/*
 * 옷 색.
 * 벌룬 라인에서 실측된 색들이다 — 페리윙클, 로즈 코럴, 모브,
 * 네버랜드 핑크, 고래 잉크블루, 잎사귀 초록.
 * 판정에 쓰는 빨강·주황·초록과는 겹치지 않는 쪽으로만 골랐다.
 */
const COATS = ['#849CCB', '#EB7187', '#C69FC0', '#CF89C3', '#464F64', '#5FA98C']

const look = computed(() => {
  const seed = hash(props.person.id)
  return {
    hat: pick(seed, 9, 5),
    hold: pick(seed, 13, 4),
    coat: COATS[pick(seed, 19, COATS.length)],
  }
})

// 실루엣은 층을 하나만 쓴다. 흰 테두리를 두르면 하늘에서 떠 보인다
/*
 * 테두리 빛.
 *
 * 그림자를 색만 바꿔 두 겹 얹는다.
 *   첫 겹  흐림 없이 빛이 오는 쪽으로 조금 밀어 둔다 → 그쪽 테두리만 밝아진다
 *   둘째 겹 아주 옅게 번지게 → 빛이 닿은 자리가 부드러워진다
 *
 * 처음에는 둘째 겹을 5px 로 넓게 퍼뜨렸더니 사람이 빛을 받는 게 아니라
 * 스스로 발광하는 것처럼 보였다. 스티커의 흰 테두리 위에 흰빛이 겹쳐
 * 후광이 되어 버렸다. 빛은 닿는 것이지 뿜는 것이 아니다.
 *
 * 테두리를 직접 그리지 않는 건, 그림이 도형 여러 개로 되어 있어서
 * 각 도형마다 선이 생기면 몸 한가운데에도 줄이 그어지기 때문이다.
 * 그림자는 전체 실루엣을 따라가므로 바깥 테두리에만 생긴다.
 */
const rim = computed(() => ({
  filter:
    `drop-shadow(${props.lightX}px ${props.lightY}px 0 ${props.lightColor})` +
    ` drop-shadow(${props.lightX * 1.3}px ${props.lightY * 1.3}px 2.5px ${props.lightSoft})`,
}))

const layers = computed(() => {
  if (props.variant === 'line') return ['line']
  if (props.variant === 'silhouette') return ['shade']
  return ['cut', 'ink']
})
</script>

<template>
  <svg
    class="figure"
    :class="[variant, act]"
    viewBox="0 0 24 28"
    :style="{ '--coat': look.coat, '--accent': accent, '--step': `${step}s`, ...rim }"
    aria-hidden="true"
  >
    <g v-for="layer in layers" :key="layer" :class="layer">
      <!-- 팔은 몸 뒤에 둔다. 앞에 두면 몸을 가로질러 지저분해진다 -->
      <rect class="arm one" x="4.4" y="13.4" width="2.8" height="6.4" rx="1.4" />
      <rect class="arm two" x="16.8" y="13.4" width="2.8" height="6.4" rx="1.4" />

      <!-- 손에 든 것 -->
      <g v-if="look.hold === 1" class="gear">
        <path d="M18.2 13.6v-6" />
        <path d="M14.2 8.4a4 3.4 0 0 1 8 0z" />
      </g>
      <g v-else-if="look.hold === 2" class="gear">
        <circle cx="18.2" cy="18.6" r="2.4" />
      </g>
      <g v-else-if="look.hold === 3" class="gear">
        <path d="M18.2 14.2v5.6" />
        <path d="M16.2 19.8h4" />
      </g>

      <rect class="body" x="6.6" y="12.6" width="10.8" height="9" rx="4.2" />

      <!-- 머리를 몸보다 크게 잡으면 귀엽게 읽힌다 -->
      <circle class="head" cx="12" cy="7" r="6.6" />

      <!-- 쓴 것 다섯 가지. 같은 사람은 늘 같은 걸 쓴다 -->
      <g v-if="look.hat === 1" class="gear">
        <path d="M5.6 5.4a6.6 6.6 0 0 1 12.8 0z" />
        <circle cx="12" cy="0.6" r="1.35" />
      </g>
      <g v-else-if="look.hat === 2" class="gear">
        <path d="M5.8 6.1a6.4 6.4 0 0 1 12.4 0z" />
        <rect x="2.6" y="5.8" width="10.6" height="2" rx="1" />
      </g>
      <g v-else-if="look.hat === 3" class="gear">
        <circle cx="7.6" cy="3" r="2.2" />
        <circle cx="12" cy="1.7" r="2.5" />
        <circle cx="16.4" cy="3" r="2.2" />
      </g>
      <g v-else-if="look.hat === 4" class="gear">
        <path d="M5.4 4.8h13.2" />
        <path d="M8 4.8c0-3 8-3 8 0" />
      </g>

      <!-- 실루엣에는 눈을 그리지 않는다. 역광에서는 얼굴이 안 보인다 -->
      <template v-if="variant !== 'silhouette'">
        <circle class="eye" cx="9.6" cy="7.6" r="1.1" />
        <circle class="eye" cx="14.4" cy="7.6" r="1.1" />
      </template>

      <rect class="leg one" x="7.8" y="21" width="3.2" height="5.6" rx="1.6" />
      <rect class="leg two" x="13" y="21" width="3.2" height="5.6" rx="1.6" />
    </g>
  </svg>
</template>

<style scoped>
.figure {
  display: block;
  overflow: visible;
}

/*
 * ── 자세 ──────────────────────────────────────────
 *
 * 그림이 도형 몇 개로 되어 있어서 부위를 하나씩 돌려 자세를 만든다.
 * 회전 기준점은 관절 자리다 — 다리와 팔은 위쪽(엉덩이·어깨),
 * 머리는 목, 몸은 발밑.
 *
 * 자세는 여기서만 정한다. 마당이든 창이든 같은 사람이 같은 몸짓을 하게.
 */
.figure :is(.leg, .arm) {
  transform-origin: center top;
  transform-box: fill-box;
}
.figure .head {
  transform-origin: center bottom;
  transform-box: fill-box;
}

/* 걷기 — 팔다리가 번갈아 나간다 */
.figure.walk .leg.one,
.figure.walk .arm.two {
  animation: pfStepA var(--step) ease-in-out infinite;
}
.figure.walk .leg.two,
.figure.walk .arm.one {
  animation: pfStepB var(--step) ease-in-out infinite;
}
@keyframes pfStepA {
  50% {
    transform: translateY(-1.1px) rotate(7deg);
  }
}
@keyframes pfStepB {
  50% {
    transform: translateY(-1.1px) rotate(-7deg);
  }
}

/*
 * 서 있기 — 숨만 쉰다.
 * 완전히 멈춰 세우면 그림이 붙어 버린 것처럼 보인다.
 */
.figure.idle {
  animation: pfBreathe 3.4s ease-in-out infinite;
}
@keyframes pfBreathe {
  50% {
    transform: translateY(-0.6px);
  }
}

/* 기지개 — 팔을 위로 벌리고 몸을 살짝 젖힌다 */
.figure.stretch .arm.one {
  animation: pfStretchL 2.8s ease-in-out infinite;
}
.figure.stretch .arm.two {
  animation: pfStretchR 2.8s ease-in-out infinite;
}
.figure.stretch .head {
  animation: pfLean 2.8s ease-in-out infinite;
}
@keyframes pfStretchL {
  40%,
  70% {
    transform: rotate(155deg) translateY(1px);
  }
}
@keyframes pfStretchR {
  40%,
  70% {
    transform: rotate(-155deg) translateY(1px);
  }
}
@keyframes pfLean {
  40%,
  70% {
    transform: rotate(-8deg) translateY(-0.5px);
  }
}

/*
 * 앉기 — 몸을 내리고 다리를 앞으로 접는다.
 * 다리만 접으면 키가 그대로라 공중에 앉은 것처럼 보여서 몸도 같이 내린다.
 */
.figure.sit {
  animation: pfSitBody 0.7s ease-out forwards;
}
.figure.sit .leg.one {
  animation: pfSitLegA 0.7s ease-out forwards;
}
.figure.sit .leg.two {
  animation: pfSitLegB 0.7s ease-out forwards;
}
.figure.sit .arm.one,
.figure.sit .arm.two {
  animation: pfSitArm 0.7s ease-out forwards;
}
@keyframes pfSitBody {
  to {
    transform: translateY(4.5px);
  }
}
@keyframes pfSitLegA {
  to {
    transform: rotate(74deg) translateY(0.5px);
  }
}
@keyframes pfSitLegB {
  to {
    transform: rotate(66deg) translateY(0.5px);
  }
}
@keyframes pfSitArm {
  to {
    transform: rotate(-10deg);
  }
}

/* 폴짝 — 굽혔다 뛰고 착지하며 눌린다 */
.figure.jump {
  animation: pfJump 1.1s ease-in-out infinite;
  transform-origin: center bottom;
  transform-box: fill-box;
}
@keyframes pfJump {
  0%,
  100% {
    transform: translateY(0) scale(1, 1);
  }
  18% {
    transform: translateY(1px) scale(1.08, 0.9);
  }
  48% {
    transform: translateY(-9px) scale(0.96, 1.06);
  }
  78% {
    transform: translateY(0.5px) scale(1.06, 0.94);
  }
}

/* 두리번 — 고개만 좌우로 */
.figure.look .head {
  animation: pfLook 3.6s ease-in-out infinite;
}
@keyframes pfLook {
  25% {
    transform: rotate(-13deg);
  }
  70% {
    transform: rotate(13deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .figure,
  .figure * {
    animation: none !important;
  }
}

/*
 * 스티커 컷아웃.
 * 아래 층은 흰색으로 두껍게 둘러 오려낸 자국을 만들고 위에 진짜 색을 얹는다.
 * 표지에 스티커를 붙인 것처럼 보이는 게 벌룬 라인의 장치다.
 */
.figure.sticker {
  /* 흰 테두리가 이미 밝아서 빛까지 세면 덩어리로 뭉친다 */
  --rim-fade: 0.6;
}

.cut * {
  fill: #fff;
  stroke: #fff;
  stroke-width: 4.2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.ink .body,
.ink .arm,
.ink .leg {
  fill: var(--coat);
}
.ink .head {
  fill: #f6e7d8;
}
.ink .eye {
  fill: #2b2b2f;
}
.ink .gear {
  fill: color-mix(in srgb, var(--coat) 72%, #1a1a1e);
  stroke: color-mix(in srgb, var(--coat) 72%, #1a1a1e);
  stroke-width: 1.3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/*
 * 금선 드로잉.
 * 면을 칠하지 않고 윤곽선만 남긴다. 무대의 모티프와 같은 굵기, 같은 색이다.
 */
.line * {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.3;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.line .eye {
  fill: var(--accent);
  stroke: none;
}

/*
 * 실루엣.
 * 하늘을 등지고 서면 사람은 검게 보인다.
 * 옷 색도 얼굴도 안 보이고 형상만 남는다. 그래서 한 색으로 채운다.
 */
.shade * {
  fill: #12161d;
  stroke: #12161d;
  stroke-width: 1.2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
</style>
