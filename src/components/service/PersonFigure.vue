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
    // 볼은 있는 사람만 있다. 전원이 볼그레하면 한 벌로 찍어낸 인형이 된다
    blush: pick(seed, 29, 3) === 0,
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
  // 눈 깜빡임도 사람마다 다른 때에
  '--blink-delay': `${-((hash(props.person.id + 'b') % 700) / 100).toFixed(2)}s`,
  '--blink-dur': `${(4.2 + (hash(props.person.id + 'k') % 280) / 100).toFixed(2)}s`,
}))

const layers = computed(() => {
  if (props.variant === 'line') return ['line']
  if (props.variant === 'silhouette') return ['shade']
  /*
   * 흰 테두리.
   *
   * 4.2 로 두껍게 둘렀더니 사람이 흰 덩어리 안에 갇혀 보였고,
   * 아예 없애 보니 어두운 무대에서 몸이 배경에 녹았다.
   * 형태가 뭉개지지 않을 만큼만, 배경에서 떨어질 만큼만 얇게 두른다.
   */
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

          모자는 머리보다 넓어야 한다. 머리가 x 5.4~18.6 인데 크라운을
          6.6~17.4 로 잡았더니 쓴 것이 아니라 올려 둔 것으로 보였다.
          머리 폭을 넘겨야 비로소 눌러쓴 것이 된다.

          다만 넓히면 아래 가장자리가 이마를 통째로 덮는다. 좁을 때는
          그 선이 정수리만 가로질렀는데, 넓어지니 머리 폭 전체를 가로질러
          눈까지 내려왔다. 가장자리를 y 5 위로 올려 이마를 남긴다 —
          모자와 눈(y 7.7) 사이가 비어야 얼굴이 있다.

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

            여러 번 갈아엎었다.
              두꺼운 띠로 두피를 덮으니   검은 헬멧이었다
              둥근 앞머리로 바꾸니       여전히 덩어리였다
              굵은 두 가닥만 남기니      개미 더듬이가 됐다
              가는 여덟 가닥은          작게 두면 긁힌 자국처럼 지저분했다
              원 세 개로 숱을 채우니     다시 덩어리였다
              옆으로 내린 자락은        귀마개로 보였다

            남은 건 곱슬 한 가닥. 얼굴을 하나도 가리지 않는다.
            제일 단순하고 제일 귀엽다. 더 그릴수록 나빠지는 자리였다.
          -->
          <g v-if="look.hat === 0" class="gear hair">
            <path class="curl" d="M11.4 0.8 C10 -2.6 15.4 -3.4 15.2 -0.2" />
          </g>
          <g v-else-if="look.hat === 1" class="gear">
            <!--
              비니.

              돔에 띠를 두르고 방울을 올린 모양이었는데, 돔이 머리보다
              좁아서 쓴 게 아니라 그릇을 엎어 놓은 것 같았다.
              위로 길게 뽑고 접단을 넓게 둘러 눌러쓴 니트로 바꾼다.
              방울은 머리 위로 한참 떨어뜨려야 늘어진 게 보인다.
            -->
            <path d="M4.8 4.8 C4.8 -0.4 7.9 -2.6 12 -2.6 C16.1 -2.6 19.2 -0.4 19.2 4.8 Z" />
            <rect x="4.3" y="2.9" width="15.4" height="2.5" rx="1.25" />

            <circle cx="12" cy="-4" r="1.85" />
          </g>
          <g v-else-if="look.hat === 2" class="gear">
            <!-- 야구모자. 챙은 한쪽으로만 나가되 머리에 붙어 있어야 한다 -->
            <path d="M5 4.9 A7 6.1 0 0 1 19 4.9 Z" />
            <path d="M18.5 4.1 C22.3 4 24.8 5.1 24.8 6.3 C24.8 7 21.3 6.5 18.1 5.8 Z" />
          </g>
          <g v-else-if="look.hat === 3" class="gear">
            <!-- 밀짚모자. 챙이 넓고 좌우 대칭이다 -->
            <ellipse cx="12" cy="3.9" rx="10.6" ry="1.9" />
            <path d="M6.5 3.6 A5.6 5.2 0 0 1 17.5 3.6 Z" />
          </g>
          <g v-else-if="look.hat === 4" class="gear">
            <!--
              머리핀.

              처음에는 머리띠였다. 머리 위를 넘어가는 띠 하나인데,
              채워 그리면 두건이 되고 선으로 그리면 허공에 뜬 고리가 됐다.
              머리에 얹혀 지나가기만 하는 물건이라 얹힐 자리가 없었다.

              핀은 다르다. 머리카락을 집는 물건이라 집을 머리카락만 있으면 된다.
              몇 가닥을 한쪽으로 쓸어 두고 그 위에 작은 막대 두 개를 지른다.

              막대에는 선을 두르지 않는다. 다른 장비와 같은 굵기(1.3)로
              두르면 1px 막대가 2.6px 덩어리가 되어 핀이 아니라 얼룩이 된다.
            -->
            <g class="fringe">
              <path d="M12.6 0.6 C10.6 1.4 9 2.6 8.1 4.3" />
              <path d="M14.2 1.1 C12.2 1.9 10.5 3.2 9.6 4.9" />
              <path d="M15.6 2 C13.9 2.9 12.4 4.1 11.6 5.5" />
            </g>
            <rect
              class="pin"
              x="13.5"
              y="2.2"
              width="4.1"
              height="1"
              rx="0.5"
              transform="rotate(-24 15.55 2.7)"
            />
            <rect
              class="pin"
              x="13.7"
              y="4.1"
              width="3.4"
              height="0.9"
              rx="0.45"
              transform="rotate(-24 15.4 4.55)"
            />
          </g>

          <!--
            실루엣에는 얼굴을 그리지 않는다. 역광에서는 안 보인다.

            왼쪽 위에 흰 점을 하나 찍는다. 이게 없으면 까만 점 두 개만 남아
            무언가 노려보는 것처럼 보인다. 점 하나가 '보고 있다' 와
            '뚫려 있다' 를 가른다.
            볼은 눈보다 아래 바깥에 둔다 — 눈에 붙으면 부은 것처럼 보인다.
            셋 중 하나만 볼이 있다. 전원이 볼그레하면 한 벌로 찍어낸 인형이 된다.
          -->
          <template v-if="variant !== 'silhouette'">
            <template v-if="look.blush">
              <circle class="blush" cx="7.05" cy="9.85" r="1.42" />
              <circle class="blush" cx="16.95" cy="9.85" r="1.42" />
            </template>
            <!--
              뜬 눈과 웃는 눈을 둘 다 그려 두고 하나만 보인다.
              모양이 바뀌는 것이라 CSS 로 바꿔 그릴 수가 없어서,
              둘 다 두고 지금 무엇을 하는지에 따라 보일 것을 고른다.
            -->
            <g class="eyes">
              <circle class="eye" cx="9.55" cy="7.7" r="1.3" />
              <circle class="eye" cx="14.45" cy="7.7" r="1.3" />
              <circle class="spark" cx="9.16" cy="7.28" r="0.44" />
              <circle class="spark" cx="14.06" cy="7.28" r="0.44" />
            </g>
            <g class="smile">
              <path d="M8.3 8.15 A1.4 1.4 0 0 1 10.8 8.15" />
              <path d="M13.2 8.15 A1.4 1.4 0 0 1 15.7 8.15" />
            </g>
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
.figure.greetL .noggin,
.figure.five .noggin,
.figure.fiveL .noggin {
  animation: pfNod 0.9s ease-in-out infinite;
}
/*
 * 하이파이브.
 *
 * 악수가 가슴 높이에서 손을 잡는 것이라면 이건 머리 위에서 부딪는 것이다.
 * 팔을 한 번 크게 올려 치고, 부딪는 순간 몸이 살짝 뜬다.
 * 치고 나서 조금 되튀어야 부딪힌 것으로 읽힌다 — 그대로 멈추면
 * 둘이 손을 든 채 서 있는 그림이 된다.
 */
.figure.five .arm.two {
  animation: pfFiveR 2.4s ease-out both;
}
.figure.five .gear.held {
  animation: pfFiveR 2.4s ease-out both;
}
.figure.fiveL .arm.one {
  animation: pfFiveL 2.4s ease-out both;
}
.figure.five,
.figure.fiveL {
  animation: pfFiveHop 2.4s ease-out both;
  transform-origin: center bottom;
  transform-box: fill-box;
}
@keyframes pfFiveR {
  0% {
    transform: rotate(-16deg);
  }
  26% {
    transform: rotate(-152deg);
  }
  38% {
    transform: rotate(-126deg);
  }
  52% {
    transform: rotate(-143deg);
  }
  68% {
    transform: rotate(-133deg);
  }
  100% {
    transform: rotate(-138deg);
  }
}
@keyframes pfFiveL {
  0% {
    transform: rotate(16deg);
  }
  26% {
    transform: rotate(152deg);
  }
  38% {
    transform: rotate(126deg);
  }
  52% {
    transform: rotate(143deg);
  }
  68% {
    transform: rotate(133deg);
  }
  100% {
    transform: rotate(138deg);
  }
}
/* 손이 부딪는 38% 에 맞춰 뜬다 */
@keyframes pfFiveHop {
  0%,
  100% {
    transform: translateY(0) scale(1, 1);
  }
  20% {
    transform: translateY(1px) scale(1.05, 0.94);
  }
  38% {
    transform: translateY(-5px) scale(0.97, 1.04);
  }
  56% {
    transform: translateY(0) scale(1.03, 0.97);
  }
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

/*
 * ── 물속 ──────────────────────────────────────────
 *
 * 물속에서는 몸이 늘 조금씩 기운다. 딛고 선 것이 없어서다.
 * 그래서 어떤 동작이든 바탕에 흔들림이 깔린다.
 *
 * 팔다리는 물을 밀어야 하므로 뭍보다 크고 느리게 움직인다.
 * 걸음(pfStep)은 7도쯤 흔들리지만 헤엄은 30도 넘게 젓는다.
 * 작게 저으면 물속에서 걷는 것처럼 보인다.
 */
.figure:is(.swim, .hover, .drift, .ascend, .sink, .roll, .tuck) {
  transform-origin: center;
  transform-box: fill-box;
}

/* 헤엄 — 팔로 물을 젓고 다리로 찬다 */
.figure.swim {
  animation: pfSwimBody 2.6s ease-in-out infinite;
}
.figure.swim .arm.one {
  animation: pfPaddleA 1.5s ease-in-out infinite;
}
.figure.swim .arm.two {
  animation: pfPaddleB 1.5s ease-in-out infinite;
}
.figure.swim .leg.one {
  animation: pfKickA 1.1s ease-in-out infinite;
}
.figure.swim .leg.two {
  animation: pfKickB 1.1s ease-in-out infinite;
}
/*
 * 물속에서는 몸이 눕는다.
 *
 * 처음에는 선 자세에서 7도쯤만 기울였는데, 그건 헤엄이 아니라
 * 물속에서 걷는 것이었다. 사람은 나아가는 쪽으로 몸을 눕힌다.
 * 60도쯤 눕히고 그 언저리에서 물결처럼 오르내린다.
 *
 * 어느 쪽으로 눕느냐는 부모가 정한다 — 가는 방향이 바뀌면
 * 판을 통째로 뒤집어서 늘 앞으로 나아가는 것으로 보이게 한다.
 */
@keyframes pfSwimBody {
  0%,
  100% {
    transform: rotate(-58deg) translateY(1px);
  }
  50% {
    transform: rotate(-70deg) translateY(-3px);
  }
}
@keyframes pfPaddleA {
  0%,
  100% {
    transform: rotate(-26deg);
  }
  50% {
    transform: rotate(-96deg);
  }
}
@keyframes pfPaddleB {
  0%,
  100% {
    transform: rotate(96deg);
  }
  50% {
    transform: rotate(26deg);
  }
}
@keyframes pfKickA {
  0%,
  100% {
    transform: rotate(16deg);
  }
  50% {
    transform: rotate(-14deg);
  }
}
@keyframes pfKickB {
  0%,
  100% {
    transform: rotate(-16deg);
  }
  50% {
    transform: rotate(14deg);
  }
}

/* 떠 있기 — 팔다리를 늘어뜨리고 물결에 맡긴다 */
.figure.hover {
  animation: pfHover 3.8s ease-in-out infinite;
}
.figure.hover .arm.one {
  transform: rotate(-30deg);
}
.figure.hover .arm.two {
  transform: rotate(30deg);
}
.figure.hover .leg.one {
  transform: rotate(9deg);
}
.figure.hover .leg.two {
  transform: rotate(-9deg);
}
@keyframes pfHover {
  0%,
  100% {
    transform: rotate(-13deg) translateY(2px);
  }
  50% {
    transform: rotate(-4deg) translateY(-3px);
  }
}

/* 흐르기 — 물살에 옆으로 누워 실려 간다 */
.figure.drift {
  animation: pfDrift 5.2s ease-in-out infinite;
}
.figure.drift .arm.one {
  transform: rotate(-58deg);
}
.figure.drift .arm.two {
  transform: rotate(18deg);
}
@keyframes pfDrift {
  0%,
  100% {
    transform: rotate(-42deg) translateY(0);
  }
  50% {
    transform: rotate(-31deg) translateY(-4px);
  }
}

/* 차고 오르기 / 가라앉기 — 팔의 방향이 몸이 가는 쪽을 말한다 */
.figure.ascend {
  animation: pfAscend 1.6s ease-in-out infinite;
}
.figure.ascend .arm.one {
  transform: rotate(158deg);
}
.figure.ascend .arm.two {
  transform: rotate(-158deg);
}
.figure.ascend :is(.leg.one, .leg.two) {
  animation: pfKickA 0.62s ease-in-out infinite;
}
@keyframes pfAscend {
  0%,
  100% {
    transform: translateY(2px) scaleY(0.97);
  }
  50% {
    transform: translateY(-6px) scaleY(1.04);
  }
}
.figure.sink {
  animation: pfSink 3.4s ease-in-out infinite;
}
.figure.sink .arm.one {
  transform: rotate(-46deg);
}
.figure.sink .arm.two {
  transform: rotate(46deg);
}
@keyframes pfSink {
  0%,
  100% {
    transform: translateY(-2px) rotate(3deg);
  }
  50% {
    transform: translateY(5px) rotate(-3deg);
  }
}

/* 앞구르기 — 물속에서는 넘어질 걱정이 없다 */
.figure.roll {
  animation: pfRoll 1.9s ease-in-out infinite;
}
.figure.roll :is(.arm.one, .arm.two) {
  transform: rotate(0deg) scaleY(0.8);
}
.figure.roll :is(.leg.one, .leg.two) {
  transform: scaleY(0.78);
}
@keyframes pfRoll {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 웅크렸다 펴며 나아가기. 해파리가 하는 방식이다 */
.figure.tuck {
  animation: pfTuck 1.5s ease-in-out infinite;
}
.figure.tuck .arm.one {
  animation: pfTuckArmA 1.5s ease-in-out infinite;
}
.figure.tuck .arm.two {
  animation: pfTuckArmB 1.5s ease-in-out infinite;
}
.figure.tuck :is(.leg.one, .leg.two) {
  animation: pfTuckLeg 1.5s ease-in-out infinite;
}
@keyframes pfTuck {
  0%,
  100% {
    transform: rotate(-52deg) scale(1, 1);
  }
  35% {
    transform: rotate(-52deg) scale(1.1, 0.84);
  }
  62% {
    transform: rotate(-56deg) scale(0.92, 1.12) translateY(-5px);
  }
}
@keyframes pfTuckArmA {
  0%,
  100% {
    transform: rotate(-24deg);
  }
  35% {
    transform: rotate(-74deg);
  }
}
@keyframes pfTuckArmB {
  0%,
  100% {
    transform: rotate(24deg);
  }
  35% {
    transform: rotate(74deg);
  }
}
@keyframes pfTuckLeg {
  0%,
  100% {
    transform: rotate(0deg) scaleY(1);
  }
  35% {
    transform: rotate(0deg) scaleY(0.66);
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
/* 핀은 채움만 쓴다. 선을 두르면 막대가 얼룩이 된다 */
.gear .pin {
  stroke: none;
}
/*
 * 앞머리. 옷 색이 아니라 머리카락 색이고, 채우지 않는다.
 * 굵기로 채우면 덩어리가 되고 개수로 채우면 머리카락이 된다 —
 * 이 파일에서 같은 결론에 도달한 게 세 번째다.
 */
.gear .fringe path {
  fill: none;
  stroke-width: 0.8;
  stroke-linecap: round;
}
.ink .gear .fringe path {
  stroke: #3a2a22;
}
/*
 * 머리카락.
 * 옷 색을 섞어 쓰는 다른 장비와 달리 제 색을 갖는다.
 * 분홍 옷을 입었다고 분홍 머리가 되면 사람이 아니라 인형으로 보인다.
 */
.gear.hair {
  stroke-width: 0.7;
}
/* 곱슬 한 가닥만 선이다. 나머지는 덩이라 채운다 */
.gear.hair .curl {
  fill: none;
  stroke-width: 1.5;
}
.ink .gear.hair {
  fill: #3a2a22;
  stroke: #3a2a22;
}

/*
 * 반짝임과 볼.
 *
 * 스티커에서만 쓴다. 각인형 무대는 금박 선 몇 개로만 그리는 결이라
 * 거기에 분홍 볼을 찍으면 두 언어가 한 얼굴에서 부딪는다.
 */

/*
 * 웃는 눈.
 *
 * 평소에는 뜬 눈만 보인다. 기쁜 일이 있을 때만 반달이 된다 —
 * 인사할 때, 손을 흔들 때, 리듬을 탈 때, 뛰어오를 때.
 * 걷다가도 웃고 있으면 웃는 게 아니라 그냥 그런 얼굴이 된다.
 */
.smile {
  display: none;
  fill: none;
  stroke: #2b2b2f;
  stroke-width: 0.92;
  stroke-linecap: round;
}
.line .smile {
  stroke: var(--accent);
}
.figure:is(.greet, .greetL, .five, .fiveL, .wave, .dance, .jump, .roll, .tuck, .ascend) .smile {
  display: block;
}
.figure:is(.greet, .greetL, .five, .fiveL, .wave, .dance, .jump, .roll, .tuck, .ascend) .eyes {
  display: none;
}

/*
 * 눈 깜빡임.
 *
 * 늘 뜨고 있으면 인형이다. 4~7초에 한 번, 아주 잠깐 감는다.
 * 감는 데 쓰는 시간은 전체의 3% 뿐이라 눈치채기 전에 다시 뜬다 —
 * 그게 깜빡임이다. 오래 감으면 조는 것이 된다.
 *
 * 반짝임까지 같이 감겨야 해서 눈 두 개와 반짝임 두 개를 한 덩이로 묶었다.
 * 사람마다 다른 때에 감는다. 열둘이 동시에 감으면 기계다.
 */
.eyes {
  transform-origin: center;
  transform-box: fill-box;
  animation: pfBlink var(--blink-dur, 5.4s) steps(1, end) var(--blink-delay, 0s) infinite;
}
@keyframes pfBlink {
  0%,
  94%,
  100% {
    transform: scaleY(1);
  }
  96% {
    transform: scaleY(0.14);
  }
}

/*
 * 머리카락은 몸보다 한 박자 늦게 따라온다.
 *
 * 머리에 붙여만 두었더니 걷든 뛰든 정수리에 못 박힌 것 같았다.
 * 정수리를 축으로 조금씩 흔들리게 둔다. 각도는 아주 작아야 한다 —
 * 크게 흔들면 머리카락이 아니라 깃발이 된다.
 */
.gear.hair,
.gear.hair.back {
  transform-origin: 12px 6px;
  transform-box: view-box;
}
.figure.walk :is(.gear.hair, .gear.hair.back) {
  animation: pfHairSoft var(--step) ease-in-out infinite;
}
.figure:is(.jump, .dash) :is(.gear.hair, .gear.hair.back) {
  animation: pfHairSwing 0.66s ease-in-out infinite;
}
.figure.dance :is(.gear.hair, .gear.hair.back) {
  animation: pfHairSwing 0.86s ease-in-out infinite;
}
.figure:is(.idle, .look, .sit, .crouch) :is(.gear.hair, .gear.hair.back) {
  animation: pfHairSoft 3.6s ease-in-out infinite;
}
@keyframes pfHairSoft {
  0%,
  100% {
    transform: rotate(-1.6deg);
  }
  50% {
    transform: rotate(1.6deg);
  }
}
@keyframes pfHairSwing {
  0%,
  100% {
    transform: rotate(-5deg) translateY(0.3px);
  }
  50% {
    transform: rotate(5deg) translateY(-0.5px);
  }
}
/*
 * 안광.
 *
 * 한 번 걷어냈다가 되살렸다. 없애 놓으니 까만 점 두 개만 남아
 * 인형이 아니라 무언가 노려보는 것처럼 보였다.
 * 흰 점 하나가 있고 없고가 '보고 있다' 와 '뚫려 있다' 를 가른다.
 */
.spark {
  fill: #fff;
}
.blush {
  fill: #efa6a0;
  opacity: 0.6;
}
/* 아주 얇은 흰 테두리. 형태를 덮지 않고 윤곽만 짚는다 */
.cut * {
  fill: #fff;
  stroke: #fff;
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.line :is(.spark, .blush),
.cut :is(.spark, .blush) {
  display: none;
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
