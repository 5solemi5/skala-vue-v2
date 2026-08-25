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
   * 테두리 빛의 두께(px).
   *
   * 한때는 빛이 들어오는 쪽(lightX·lightY)을 받아 그쪽만 밝혔다.
   * 그런데 마당에 아무도 방향을 넘겨 주지 않아 열두 명이 전부
   * 같은 값으로 왼쪽 위만 밝았고, 빛이 드는 게 아니라
   * 후광이 한쪽으로 빗나가 붙은 것처럼 보였다.
   *
   * 방향을 지우고 둘레를 고르게 두른다.
   * 어느 쪽에서 봐도 어긋나 보이지 않는다.
   */
  rimSize: { type: Number, default: 1.1 },
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
 * 그림자를 색만 바꿔 두 겹 얹는다. 둘 다 밀지 않고 흐림만 준다.
 *   첫 겹  좁게  → 몸 둘레를 따라 얇게 밝은 선이 생긴다
 *   둘째 겹 넓게 → 그 선 바깥으로 아주 옅게 번진다
 *
 * 처음에는 빛이 오는 쪽으로 밀어 한쪽 테두리만 밝혔다.
 * 방향을 넘겨 주는 곳이 없어 전원이 같은 쪽으로 밀렸고,
 * 결국 빛이 아니라 어긋나 붙은 후광이 되었다.
 *
 * 둘째 겹을 5px 로 넓게 퍼뜨렸을 때는 사람이 빛을 받는 게 아니라
 * 스스로 발광하는 것처럼 보였다. 스티커의 흰 테두리 위에 흰빛이 겹쳐서다.
 * 빛은 닿는 것이지 뿜는 것이 아니라, 좁게 두른다.
 *
 * 테두리를 직접 그리지 않는 건, 그림이 도형 여러 개로 되어 있어서
 * 각 도형마다 선이 생기면 몸 한가운데에도 줄이 그어지기 때문이다.
 * 그림자는 전체 실루엣을 따라가므로 바깥 테두리에만 생긴다.
 */
const rim = computed(() => ({
  '--rim': `${props.rimSize}px`,
  '--rim-lit': props.lightColor,
  '--rim-soft': props.lightSoft,
  /*
   * 일렁임의 위상.
   *
   * 다 같이 밝아졌다 어두워지면 열두 명이 한 박자로 숨 쉬는 게 되어
   * 살아 있다기보다 기계로 보인다. 사람마다 다른 지점에서 시작하게 어긋뜨린다.
   */
  '--ember-delay': `${-((hash(props.person.id + 'e') % 260) / 100).toFixed(2)}s`,
  '--ember-dur': `${(2.1 + (hash(props.person.id + 'd') % 140) / 100).toFixed(2)}s`,
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
    <!--
      빛을 이 겹에 건다.

      svg 자체(.figure)에는 이미 자세 애니메이션이 붙어 있다.
      앉기·점프는 몸 전체를 움직이는 것이라 .figure 를 잡고 있어서,
      여기에 일렁임까지 얹으면 둘 중 하나만 살아남는다.
      그림 층을 한 겹 감싸고 빛은 그 겹이 맡는다.
    -->
    <g class="lit">
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
    </g>
  </svg>
</template>

<style scoped>
/*
 * 일렁이는 테두리 빛.
 *
 * 흐림 반경을 애니메이션한다. filter 문자열은 보간되지 않으므로
 * 길이 하나를 @property 로 등록해 두고 그 값만 움직인다.
 * 등록한 이름은 문서 전체에서 하나뿐이어야 해서 pf 를 붙였다
 * (PeopleBoard 가 --sheen 을 쓰고 있다).
 */
@property --ember {
  syntax: '<length>';
  inherits: false;
  initial-value: 1.1px;
}

.lit {
  filter: drop-shadow(0 0 var(--ember) var(--rim-lit))
    drop-shadow(0 0 calc(var(--ember) * 2.8) var(--rim-soft));
  animation: pfEmber var(--ember-dur, 2.6s) ease-in-out var(--ember-delay, 0s) infinite;
}

/*
 * 고르게 커졌다 작아지면 숨 쉬는 것이지 이글거리는 것이 아니다.
 * 마디를 일부러 어긋난 자리에 두어 다음 밝기가 언제 올지 모르게 한다.
 */
@keyframes pfEmber {
  0% {
    --ember: calc(var(--rim) * 0.8);
  }
  17% {
    --ember: calc(var(--rim) * 1.55);
  }
  26% {
    --ember: calc(var(--rim) * 0.95);
  }
  41% {
    --ember: calc(var(--rim) * 1.9);
  }
  55% {
    --ember: calc(var(--rim) * 1.05);
  }
  68% {
    --ember: calc(var(--rim) * 1.7);
  }
  83% {
    --ember: calc(var(--rim) * 0.85);
  }
  100% {
    --ember: calc(var(--rim) * 0.8);
  }
}

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

/*
 * 도약 — 뛰어서 날아가듯.
 *
 * 점프(pfJump)는 제자리에서 위아래로만 튄다. 이건 앞으로 나아가는 몸짓이라
 * 몸을 앞으로 기울이고, 다리를 앞뒤로 크게 벌리고, 팔을 뒤로 젖힌다.
 * 자리 이동은 부모가 계속 시키고 있으니 여기서는 뜨는 것만 맡는다.
 */
.figure.dash {
  animation: pfDash 0.66s ease-in-out infinite;
  transform-origin: center bottom;
  transform-box: fill-box;
}
@keyframes pfDash {
  0%,
  100% {
    transform: translateY(0) rotate(-5deg);
  }
  28% {
    transform: translateY(-12px) rotate(-14deg);
  }
  52% {
    transform: translateY(-15px) rotate(-11deg);
  }
  78% {
    transform: translateY(-4px) rotate(-3deg);
  }
}
.figure.dash .leg.one {
  animation: pfDashLegA 0.66s ease-in-out infinite;
}
.figure.dash .leg.two {
  animation: pfDashLegB 0.66s ease-in-out infinite;
}
.figure.dash .arm.one,
.figure.dash .arm.two {
  animation: pfDashArm 0.66s ease-in-out infinite;
}
@keyframes pfDashLegA {
  0%,
  100% {
    transform: rotate(18deg);
  }
  50% {
    transform: rotate(34deg);
  }
}
@keyframes pfDashLegB {
  0%,
  100% {
    transform: rotate(-22deg);
  }
  50% {
    transform: rotate(-38deg);
  }
}
@keyframes pfDashArm {
  0%,
  100% {
    transform: rotate(26deg);
  }
  50% {
    transform: rotate(40deg);
  }
}

/*
 * 손 흔들기.
 *
 * 악수와 헷갈리지 않게 팔을 위로 든다.
 * 악수는 가로로 뻗어 위아래로 흔들고, 이건 들어 올려 좌우로 흔든다.
 * 고개를 살짝 기울이면 인사하는 것으로 읽힌다. 안 기울이면 신호를 보내는 것 같다.
 */
.figure.wave .arm.two {
  animation: pfWave 0.58s ease-in-out infinite;
}
.figure.wave .head {
  transform: rotate(-6deg);
}
@keyframes pfWave {
  0%,
  100% {
    transform: rotate(152deg);
  }
  50% {
    transform: rotate(186deg);
  }
}

/*
 * 리듬 타기.
 *
 * 몸을 좌우로 기울이면서 팔을 번갈아 든다.
 * 발은 붙여 둔다. 다리까지 움직이면 춤이 아니라 비틀거리는 것이 된다.
 */
.figure.dance {
  animation: pfDance 0.86s ease-in-out infinite;
  transform-origin: center bottom;
  transform-box: fill-box;
}
@keyframes pfDance {
  0%,
  100% {
    transform: rotate(-7deg) translateY(0);
  }
  25% {
    transform: rotate(0deg) translateY(-2.2px);
  }
  50% {
    transform: rotate(7deg) translateY(0);
  }
  75% {
    transform: rotate(0deg) translateY(-2.2px);
  }
}
.figure.dance .arm.one {
  animation: pfDanceArmA 0.86s ease-in-out infinite;
}
.figure.dance .arm.two {
  animation: pfDanceArmB 0.86s ease-in-out infinite;
}
@keyframes pfDanceArmA {
  0%,
  100% {
    transform: rotate(-34deg);
  }
  50% {
    transform: rotate(-8deg);
  }
}
@keyframes pfDanceArmB {
  0%,
  100% {
    transform: rotate(8deg);
  }
  50% {
    transform: rotate(34deg);
  }
}

/*
 * 쪼그려 앉아 들여다보기.
 *
 * 앉기(sit)와 다르다. 앉기는 쉬는 것이고 이건 무언가를 보는 것이라,
 * 몸을 낮추되 고개는 앞으로 숙이고 조금씩 움직인다.
 * 마당에 꽃과 풀이 있으니 들여다볼 것은 있다.
 */
.figure.crouch {
  animation: pfCrouch 2.6s ease-in-out infinite;
  transform-origin: center bottom;
  transform-box: fill-box;
}
@keyframes pfCrouch {
  0%,
  100% {
    transform: translateY(3.4px) scaleY(0.86);
  }
  50% {
    transform: translateY(4.6px) scaleY(0.82);
  }
}
.figure.crouch .head {
  animation: pfPeer 2.6s ease-in-out infinite;
}
@keyframes pfPeer {
  0%,
  100% {
    transform: rotate(12deg) translateY(1px);
  }
  50% {
    transform: rotate(17deg) translateY(1.8px);
  }
}
.figure.crouch .leg.one {
  transform: rotate(22deg) scaleY(0.72);
}
.figure.crouch .leg.two {
  transform: rotate(-22deg) scaleY(0.72);
}
.figure.crouch .arm.one,
.figure.crouch .arm.two {
  transform: rotate(16deg) scaleY(0.8);
}

/*
 * 제자리에서 한 바퀴.
 *
 * 진짜로 돌리려면 3차원이 필요한데, 가로만 눌렀다 펴면
 * 등을 보였다가 다시 앞을 보는 것으로 읽힌다. 종이 인형이 도는 것처럼.
 * 가운데(scaleX 0)를 빠르게 지나가야 납작해진 순간이 눈에 안 밟힌다.
 */
.figure.spin {
  animation: pfSpin 1.6s linear infinite;
  transform-origin: center center;
  transform-box: fill-box;
}
@keyframes pfSpin {
  0% {
    transform: scaleX(1);
  }
  20% {
    transform: scaleX(0.92);
  }
  29% {
    transform: scaleX(0.06);
  }
  38% {
    transform: scaleX(-0.92);
  }
  58% {
    transform: scaleX(-1);
  }
  70% {
    transform: scaleX(-0.92);
  }
  79% {
    transform: scaleX(0.06);
  }
  88% {
    transform: scaleX(0.92);
  }
  100% {
    transform: scaleX(1);
  }
}

/*
 * 악수.
 *
 * 마주친 두 사람이 같은 순간에 같은 몸짓을 한다.
 * 한쪽 팔만 가로로 뻗고 위아래로 두어 번 흔든다.
 * 반대쪽 팔은 가만히 둬야 손을 흔드는 게 아니라 손을 잡는 것으로 읽힌다.
 */
.figure.greet .arm.two {
  animation: pfShake 0.9s ease-in-out infinite;
}
.figure.greet .head {
  animation: pfNod 0.9s ease-in-out infinite;
}
@keyframes pfShake {
  0%,
  100% {
    transform: rotate(78deg) translateY(-1px);
  }
  50% {
    transform: rotate(92deg) translateY(1.4px);
  }
}
@keyframes pfNod {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(5deg) translateY(0.6px);
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
