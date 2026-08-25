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
    // 모자를 안 썼을 때 쓸 머리 모양. 민머리로 두면 열두 명이 다 같아 보인다
    hair: pick(seed, 25, 4),
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

        <!--
        손에 든 것.

        오른팔(x 16.8~19.6, y 13.4~19.8) 끝이 손이다. 거기서 시작해야 한다.
        우산 갓을 y 8.4 에 두었더니 머리(반지름 6.6, y 0.4~13.6) 와 겹쳐서
        우산이 아니라 목에 걸린 갈고리로 보였다. 머리 옆으로 비켜 세운다.

        thin 은 선으로만 그린다. 스티커 층은 gear 를 채우기도 해서,
        열린 곡선에 채움이 들어가면 손잡이가 부풀어 덩어리가 된다.
      -->
        <g v-if="look.hold === 1" class="gear held">
          <!-- 갓. 아래 가장자리를 물결로 닫아야 버섯이 아니라 우산으로 읽힌다 -->
          <path d="M16.8 6.2 Q18.9 7.7 21 6.2 Q23.1 7.7 25.2 6.2 A4.2 4.1 0 0 0 16.8 6.2 Z" />
          <path class="thin" d="M21 6.2 L19.2 18.4" />
          <path class="thin" d="M19.1 18.4 q-0.3 1.5 -1.9 1.2" />
        </g>
        <g v-else-if="look.hold === 2" class="gear held">
          <!-- 손가방. 손 아래로 늘어뜨린다 -->
          <rect x="17.2" y="20.2" width="5.2" height="4.8" rx="1" />
          <path class="thin" d="M18.4 20.2 a1.4 1.5 0 0 1 2.8 0" />
        </g>
        <g v-else-if="look.hold === 3" class="gear held">
          <!-- 꽃 한 송이. 들판이니 꺾어 든 것이 있어도 이상하지 않다 -->
          <path class="thin" d="M18.5 19.6 L20 15.4" />
          <circle cx="20" cy="10" r="1.15" />
          <circle cx="17.9" cy="12.1" r="1.15" />
          <circle cx="22.1" cy="12.1" r="1.15" />
          <circle cx="20" cy="14.2" r="1.15" />
          <circle class="pip" cx="20" cy="12.1" r="1.05" />
        </g>

        <rect class="body" x="6.6" y="12.6" width="10.8" height="9" rx="4.2" />

        <!--
        머리 · 눈 · 모자를 한 덩이로 묶는다.
        모자를 따로 두었더니 고개를 돌릴 때 얼굴만 돌고 모자는 그 자리에 남았다.
      -->
        <g class="noggin">
          <!-- 머리를 몸보다 크게 잡으면 귀엽게 읽힌다 -->
          <circle class="head" cx="12" cy="7" r="6.6" />

          <!--
          쓴 것 네 가지. 같은 사람은 늘 같은 걸 쓴다.

          모두 눈(y 7.6) 위에서 끝난다. 이마를 가로지르면 얼굴이 잘린다.
          좌우로 뻗는 것은 머리 중심(x 12) 기준으로 대칭이어야 한다.
          한때 챙이 x 2.6~13.2 이라 왼쪽으로만 튀어나와 있었다.
        -->
          <!--
          아무것도 안 쓴 사람의 머리카락.

          두피를 따라 도는 초승달 띠 하나를 바탕으로 깔고 모양만 바꾼다.
          바깥 반지름 7.0 이 머리(6.6)보다 조금 커서 얹힌 것처럼 보이고,
          안쪽 5.4 로 파내면 이마가 드러난다. 눈(y 7.6) 위에서 끝난다.
        -->
          <!--
            아무것도 안 쓴 사람의 머리카락.

            세 번 갈아엎었다.
              두꺼운 띠로 두피를 덮으니   검은 헬멧이었다
              둥근 앞머리로 바꾸니       여전히 덩어리였다
              굵은 두 가닥만 남기니      개미 더듬이가 됐다

            가늘게, 대신 여러 가닥. 선 하나는 0.7 밖에 안 되지만
            여덟 가닥이 정수리를 덮으면 숱이 있어 보인다.
            굵기로 채우면 덩어리가 되고, 개수로 채우면 머리카락이 된다.

            가닥은 모두 두피(반지름 6.6 인 원 위)에서 시작해 한쪽으로 쓸린다.
            사방으로 뻗치면 심어 놓은 것처럼 보인다.

            홀수 번은 좌우를 뒤집어 가르마가 반대로 간 것처럼 보이게 한다.
            hair 가 2 이상이면 귀 옆으로 흘러내리는 가닥을 더해
            머리가 긴 사람이 된다. 사람 정보에 성별은 없으니 씨앗에서 뽑는다.
          -->
          <g
            v-if="look.hat === 0"
            class="gear hair"
            :transform="look.hair % 2 ? 'translate(24,0) scale(-1,1)' : undefined"
          >
            <!-- 정수리 여덟 가닥 -->
            <path class="thin" d="M6.6 3.2 C6.4 1.2 7.6 0.2 8.8 0.4" />
            <path class="thin" d="M7.8 1.9 C7.8 0.2 9 -0.7 10.1 -0.4" />
            <path class="thin" d="M9.2 1 C9.4 -0.7 10.6 -1.5 11.7 -1.1" />
            <path class="thin" d="M10.9 0.5 C11.2 -1.2 12.5 -1.9 13.5 -1.4" />
            <path class="thin" d="M12.6 0.4 C13.1 -1.2 14.4 -1.7 15.2 -1.1" />
            <path class="thin" d="M14.3 0.8 C15 -0.6 16.2 -0.9 16.8 -0.2" />
            <path class="thin" d="M15.8 1.6 C16.6 0.5 17.6 0.4 18 1.1" />
            <path class="thin" d="M17.1 2.8 C17.9 2 18.7 2.1 18.9 2.7" />

            <!-- 귀 옆으로 흘러내리는 여섯 가닥 -->
            <template v-if="look.hair >= 2">
              <path class="thin" d="M7 3.2 C5.2 6.4 5.4 10.2 6.7 12.9" />
              <path class="thin" d="M6.3 4 C4.5 7.2 4.8 10.8 6.1 13.4" />
              <path class="thin" d="M5.9 5.2 C4.3 8.2 4.5 11.4 5.6 13.9" />
              <path class="thin" d="M17 3.2 C18.8 6.4 18.6 10.2 17.3 12.9" />
              <path class="thin" d="M17.7 4 C19.5 7.2 19.2 10.8 17.9 13.4" />
              <path class="thin" d="M18.1 5.2 C19.7 8.2 19.5 11.4 18.4 13.9" />
            </template>
          </g>
          <g v-else-if="look.hat === 1" class="gear">
            <!-- 비니. 헐렁하게 머리를 덮고 방울이 하나 -->
            <path d="M6.6 5.2 A5.4 5.0 0 0 1 17.4 5.2 Z" />
            <rect x="5.8" y="4.4" width="12.4" height="1.9" rx="0.95" />
            <circle cx="12" cy="-0.2" r="1.45" />
          </g>
          <g v-else-if="look.hat === 2" class="gear">
            <!-- 야구모자. 챙은 한쪽으로만 나가되 머리에 붙어 있어야 한다 -->
            <path d="M6.7 5.9 A5.3 5.3 0 0 1 17.3 5.9 Z" />
            <path d="M17.0 5.5 C20.4 5.4 22.7 6.3 22.7 7.4 C22.7 8.0 19.6 7.6 16.8 7.0 Z" />
          </g>
          <g v-else-if="look.hat === 3" class="gear">
            <!-- 밀짚모자. 챙이 넓고 좌우 대칭이다 -->
            <ellipse cx="12" cy="4.9" rx="9.3" ry="1.7" />
            <path d="M7.6 4.6 A4.5 4.4 0 0 1 16.4 4.6 Z" />
          </g>
          <g v-else-if="look.hat === 4" class="gear">
            <!-- 머리띠와 리본 -->
            <path d="M5.9 5.2 A6.3 6.3 0 0 1 18.1 5.2 L17.6 6.6 A6.0 6.0 0 0 0 6.4 6.6 Z" />
            <path d="M17.2 4.2 L20.6 2.4 L20.2 6.1 Z" />
            <path d="M17.2 4.2 L21.4 5.3 L19.6 7.6 Z" />
            <circle class="pip" cx="17.5" cy="4.9" r="1.1" />
          </g>

          <!-- 실루엣에는 눈을 그리지 않는다. 역광에서는 얼굴이 안 보인다 -->
          <template v-if="variant !== 'silhouette'">
            <circle class="eye" cx="9.6" cy="7.6" r="1.1" />
            <circle class="eye" cx="14.4" cy="7.6" r="1.1" />
          </template>
        </g>

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
/*
 * 고개는 머리 아래(목)를 축으로 돈다.
 * fill-box 로 두면 모자까지 포함한 덩이의 가운데가 축이 되어
 * 모자가 클수록 축이 위로 올라간다. 그림 좌표로 못을 박는다.
 */
.noggin {
  transform-origin: 12px 13.4px;
  transform-box: view-box;
}

/*
 * 든 물건은 손을 따라간다.
 * 팔은 어깨(18.2, 13.4)를 축으로 흔들리는데 물건은 가만히 있어서,
 * 걸을 때마다 우산이 팔에서 떨어져 허공에 떠 있었다.
 */
.gear.held {
  transform-origin: 18.2px 13.4px;
  transform-box: view-box;
}

/* 걷기 — 팔다리가 번갈아 나간다 */
.figure.walk .leg.one,
.figure.walk .arm.two {
  animation: pfStepA var(--step) ease-in-out infinite;
}
/* 오른팔이 pfStepA 를 타므로 물건도 같은 것을 탄다 */
.figure.walk .gear.held {
  animation: pfStepA var(--step) ease-in-out infinite;
}
.figure.dash .gear.held {
  animation: pfDashArm 0.66s ease-in-out infinite;
}
.figure.dance .gear.held {
  animation: pfDanceArmB 0.86s ease-in-out infinite;
}
.figure.crouch .gear.held {
  transform: rotate(16deg);
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
.figure.stretch .noggin {
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
.figure.look .noggin {
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
/*
 * 흔드는 손은 빈 손이어야 한다.
 * 오른팔(arm.two)로 흔들게 두었더니 우산을 든 채로 우산을 흔들었다.
 * 물건은 늘 오른손에 있으므로 인사는 왼손이 맡는다.
 */
.figure.wave .arm.one {
  animation: pfWave 0.58s ease-in-out infinite;
}
.figure.wave .noggin {
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
.figure.crouch .noggin {
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
/*
 * 악수.
 *
 * 둘 다 같은 쪽으로 팔을 뻗게 두었더니 손을 잡는 게 아니라
 * 나란히 서서 같은 방향을 찌르는 모양이 됐다.
 *
 * 서로를 향해야 한다. 왼쪽에 선 사람은 오른팔을 오른쪽으로,
 * 오른쪽에 선 사람은 왼팔을 왼쪽으로 뻗는다.
 * 누가 왼쪽인지는 마당이 자리를 재서 알고 있으므로 거기서 정해 준다.
 *
 * 팔은 어깨를 축으로 아래를 향해 있으니, 오른쪽으로 뻗으려면 -90도다.
 * 그 언저리에서 위아래로 흔들면 손을 잡고 흔드는 것으로 읽힌다.
 * 두 사람이 같은 순간에 시작하므로 흔드는 박자도 맞는다.
 */
.figure.greet .arm.two {
  animation: pfShakeR 2.4s ease-out both;
}
/* 뻗은 팔에 물건이 들려 있어도 괜찮다. 같이 흔들리면 된다 */
.figure.greet .gear.held {
  animation: pfShakeR 2.4s ease-out both;
}
.figure.greetL .arm.one {
  animation: pfShakeL 2.4s ease-out both;
}
.figure.greet .noggin,
.figure.greetL .noggin {
  animation: pfNod 0.9s ease-in-out infinite;
}
/*
 * 뻗어서 잡고, 잡은 채로 흔든다.
 *
 * 처음에는 뻗은 자리에서 조금씩 오가기만 반복했더니
 * 손을 잡는 게 아니라 계속 찌르는 모양이었다.
 *
 * 앞의 15%가 뻗는 동작이다. 팔이 내려와 있다가 한 번에 올라가 손을 잡는다.
 * 그다음부터는 어깨를 축으로 위아래로 펌프질한다. 세 번쯤이면 충분하다.
 * 반복하지 않는다(both). 한 번 잡은 손을 다시 뻗을 일은 없다.
 */
@keyframes pfShakeR {
  0% {
    transform: rotate(-12deg);
  }
  15% {
    transform: rotate(-95deg);
  }
  28% {
    transform: rotate(-85deg);
  }
  41% {
    transform: rotate(-103deg);
  }
  54% {
    transform: rotate(-87deg);
  }
  67% {
    transform: rotate(-101deg);
  }
  80% {
    transform: rotate(-90deg);
  }
  100% {
    transform: rotate(-95deg);
  }
}
@keyframes pfShakeL {
  0% {
    transform: rotate(12deg);
  }
  15% {
    transform: rotate(95deg);
  }
  28% {
    transform: rotate(85deg);
  }
  41% {
    transform: rotate(103deg);
  }
  54% {
    transform: rotate(87deg);
  }
  67% {
    transform: rotate(101deg);
  }
  80% {
    transform: rotate(90deg);
  }
  100% {
    transform: rotate(95deg);
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
/*
 * 선으로만 그리는 것들.
 * 우산대·가방끈·꽃대는 열린 곡선이라, 채우면 안쪽이 메워져
 * 가느다란 것이 덩어리가 된다.
 */
.gear .thin {
  fill: none;
}
/*
 * 머리카락.
 * 옷 색을 섞어 쓰는 다른 장비와 달리 제 색을 갖는다.
 * 분홍 옷을 입었다고 분홍 머리가 되면 사람이 아니라 인형으로 보인다.
 */
.gear.hair {
  stroke-width: 0.7;
}
.ink .gear.hair {
  fill: none;
  stroke: #3a2a22;
}

/* 꽃술·리본 매듭은 옷 색보다 밝아야 겹친 게 구분된다 */
.ink .gear .pip {
  fill: #f6e7d8;
  stroke: none;
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
