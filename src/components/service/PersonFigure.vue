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
const layers = computed(() => {
  if (props.variant === 'line') return ['line']
  if (props.variant === 'silhouette') return ['shade']
  return ['cut', 'ink']
})
</script>

<template>
  <svg
    class="figure"
    :class="variant"
    viewBox="0 0 24 28"
    :style="{ '--coat': look.coat, '--accent': accent }"
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
 * 스티커 컷아웃.
 * 아래 층은 흰색으로 두껍게 둘러 오려낸 자국을 만들고 위에 진짜 색을 얹는다.
 * 표지에 스티커를 붙인 것처럼 보이는 게 벌룬 라인의 장치다.
 */
.cut * {
  fill: #fff;
  stroke: #fff;
  stroke-width: 4.6;
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
