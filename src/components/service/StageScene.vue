<script setup>
import { computed, useId } from 'vue'

/*
 * 무대 한 장.
 *
 * 800×260 화폭에 풍경을 여러 겹 쌓는다.
 * 접혀 있을 때는 아래쪽 띠만 잘라 보여주고, 펼치면 전부 드러난다.
 * 늘려서 채우지 않기 때문에 어느 쪽에서도 비율이 찌그러지지 않는다.
 *
 * ── 겹의 순서 ──────────────────────────────────────
 *   하늘 → 빛무리 → 빛줄기 → 먼 산 → 구름 → 새 떼
 *   → 모티프 → 원경 언덕 → 안개 띠 → 중경 언덕과 나무
 *   → 근경 → 덤불과 꽃 → 지면 → 전경 풀 → 떠다니는 것 → 비네트 → 결
 *
 * 흩뿌린 게 아니라 뒤에서 앞으로 세운 것이라
 * 요소가 아무리 많아도 눈은 모티프 하나에 멈춘다.
 *
 * ── 자리는 고정이다 ────────────────────────────────
 * 난수를 쓰면 다시 그릴 때마다 나무가 순간이동한다.
 * 무대 id 에서 뽑은 수로 자리를 정해서, 같은 무대는 늘 같은 풍경이다.
 */
const props = defineProps({
  stage: { type: Object, required: true },
  /*
   * 판이 펼쳐졌는지.
   *
   * 처음에는 부모의 .stage.open 을 :global() 로 참조해서 모티프를 띄웠다.
   * 컴포넌트 경계를 넘는 선택자라 scoped 규칙과 어긋나 아무것도 안 보였다.
   * 상태를 넘겨받으면 이 파일 안에서만 따지면 된다.
   */
  open: { type: Boolean, default: false },
})

const uid = useId()

/** 같은 무대는 늘 같은 풍경이 되도록 id 에서 수를 뽑는다 */
const seedOf = (text) => {
  let n = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    n ^= text.charCodeAt(i)
    n = Math.imul(n, 16777619) >>> 0
  }
  return n
}
const rng = (seed) => {
  let x = seed >>> 0
  return () => {
    x ^= x << 13
    x >>>= 0
    x ^= x >> 17
    x ^= x << 5
    x >>>= 0
    return x / 4294967296
  }
}

const scene = computed(() => {
  const s = props.stage
  const r = rng(seedOf(s.id))
  const pick = (a, b) => a + r() * (b - a)

  // 구름. 크기와 높이를 다르게 해서 깊이를 만든다
  const clouds = Array.from({ length: s.clouds ?? 0 }, (_, i) => ({
    i,
    x: pick(-40, 780),
    y: pick(18, 92),
    w: pick(70, 190),
    h: pick(14, 30),
    o: pick(0.28, 0.7),
    dur: pick(120, 260),
  }))

  // 새 떼. 한 무리가 천천히 지나간다
  const birds = s.birds
    ? Array.from({ length: 5 }, (_, i) => ({
        i,
        x: i * 22 + (i % 2) * 8,
        y: (i % 3) * 9,
        s: pick(0.8, 1.15),
      }))
    : []

  // 나무. 큰 것 하나에 작은 것들이 흩어진다
  const trees = Array.from({ length: s.trees ?? 0 }, (_, i) => {
    const big = i === 0
    return {
      i,
      x: pick(40, 760),
      base: pick(178, 208),
      h: big ? pick(52, 66) : pick(22, 42),
      w: big ? pick(30, 40) : pick(14, 26),
      dark: r() > 0.55,
    }
  })

  // 덤불과 꽃
  const flowers = s.flowers
    ? Array.from({ length: 26 }, () => ({
        x: pick(10, 790),
        y: pick(202, 236),
        r: pick(2.2, 4.4),
        sway: pick(2.6, 5),
      }))
    : []

  // 전경 풀. 바람에 흔들린다
  const grass = s.grass
    ? Array.from({ length: 46 }, () => {
        const x = pick(-10, 810)
        return {
          x,
          h: pick(20, 58),
          lean: pick(-9, 9),
          sway: pick(2.2, 4.4),
          delay: pick(0, 3),
        }
      })
    : []

  // 떠다니는 것 — 홀씨·눈·별·먼지·물보라
  const motes = Array.from({ length: s.motes === 'none' ? 0 : 16 }, () => ({
    x: pick(0, 800),
    y: pick(30, 230),
    r: pick(0.9, 2.4),
    dur: pick(9, 22),
    delay: pick(0, 12),
    drift: pick(-30, 30),
  }))

  return { clouds, birds, trees, flowers, grass, motes }
})

// 산 능선. 겹마다 높이와 들쭉날쭉함을 달리한다
const ridge = (base, amp, seed) => {
  const r = rng(seed)
  let d = `M0 ${base}`
  for (let x = 0; x <= 800; x += 50) {
    d += ` L${x} ${Math.round(base - r() * amp)}`
  }
  return `${d} L800 260 L0 260Z`
}
const ridges = computed(() => {
  const s = props.stage
  const n = s.mountains ?? 0
  const base = seedOf(s.id)
  return Array.from({ length: n }, (_, i) => ({
    i,
    d: ridge(150 + i * 12, 46 - i * 12, base + i * 977),
    o: 0.3 + i * 0.2,
  }))
})
</script>

<template>
  <svg class="scene" viewBox="0 0 800 260" :class="[stage.lang, { open }]" aria-hidden="true">
    <defs>
      <linearGradient :id="`sky-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="stage.sky" />
        <stop offset="58%" :stop-color="stage.mid" />
        <!--
          하늘 맨 아래만 살짝 안개를 섞는다.
          처음에는 안개 색을 그대로 끝에 뒀더니 하늘 절반이 뿌옇게 죽었다.
          안개는 지평선 띠에서 하는 일이지 하늘 전체가 할 일이 아니다.
        -->
        <stop offset="100%" :stop-color="stage.haze" stop-opacity="0.55" />
      </linearGradient>
      <radialGradient :id="`glow-${uid}`" cx="0.72" cy="0.24" r="0.55">
        <stop offset="0%" :stop-color="stage.bloom" stop-opacity="0.5" />
        <stop offset="100%" :stop-color="stage.bloom" stop-opacity="0" />
      </radialGradient>
      <linearGradient :id="`mist-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="stage.haze" stop-opacity="0" />
        <stop offset="45%" :stop-color="stage.haze" stop-opacity="0.62" />
        <stop offset="100%" :stop-color="stage.haze" stop-opacity="0" />
      </linearGradient>
      <radialGradient :id="`vig-${uid}`" cx="0.5" cy="0.45" r="0.78">
        <stop offset="55%" stop-color="#000" stop-opacity="0" />
        <stop offset="100%" stop-color="#000" stop-opacity="0.34" />
      </radialGradient>
      <filter :id="`soft-${uid}`" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <filter :id="`grain-${uid}`" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <clipPath :id="`box-${uid}`"><rect x="0" y="0" width="800" height="260" /></clipPath>
    </defs>

    <g :clip-path="`url(#box-${uid})`">
      <!-- ① 하늘 -->
      <rect x="0" y="0" width="800" height="260" :fill="`url(#sky-${uid})`" />

      <!-- ② 빛무리 -->
      <rect x="0" y="0" width="800" height="260" :fill="`url(#glow-${uid})`" />

      <!-- ③ 빛줄기. 구름 사이로 내리는 빛 -->
      <g v-if="stage.rays" class="rays" :fill="stage.bloom">
        <path v-for="k in 5" :key="k" :d="`M${520 + k * 26} 8 L${430 + k * 34} 260 L${470 + k * 34} 260Z`" />
      </g>

      <!-- ④ 먼 산. 뒤로 갈수록 옅다 -->
      <path
        v-for="m in ridges"
        :key="`m${m.i}`"
        class="ridge"
        :d="m.d"
        :fill="stage.veg2"
        :opacity="m.o"
      />

      <!-- ⑤ 구름 -->
      <g class="clouds" :fill="stage.bloom">
        <g
          v-for="c in scene.clouds"
          :key="`c${c.i}`"
          class="cloud"
          :style="{ '--x': `${c.x}px`, '--dur': `${c.dur}s` }"
          :opacity="c.o"
        >
          <ellipse :cx="0" :cy="c.y" :rx="c.w * 0.5" :ry="c.h" />
          <ellipse :cx="-c.w * 0.28" :cy="c.y + c.h * 0.28" :rx="c.w * 0.3" :ry="c.h * 0.7" />
          <ellipse :cx="c.w * 0.3" :cy="c.y + c.h * 0.22" :rx="c.w * 0.26" :ry="c.h * 0.62" />
        </g>
      </g>

      <!-- ⑥ 새 떼 -->
      <g v-if="scene.birds.length" class="flock" :stroke="stage.veg">
        <path
          v-for="bd in scene.birds"
          :key="`b${bd.i}`"
          :d="`M${bd.x} ${bd.y} q4 -4 8 0 q4 -4 8 0`"
          :transform="`scale(${bd.s})`"
        />
      </g>

      <!-- ⑦ 모티프 — 무대마다 하나 -->
      <g
        class="motif"
        :stroke="stage.lang === 'illustrated' ? stage.motifColor || stage.accent : stage.accent"
        :fill="stage.lang === 'illustrated' ? stage.motifColor || stage.accent : 'none'"
      >
        <g v-if="stage.motif === 'tree'">
          <path d="M596 200V96" />
          <path d="M596 132l-28-22M596 150l30-24M596 114l-20-18" />
          <path d="M548 96a48 36 0 0 1 96 0a48 32 0 0 1-96 0z" />
        </g>
        <g v-else-if="stage.motif === 'gull'">
          <path d="M520 96c22-30 44-34 62-12c18-22 40-18 62 12c-24-10-44-4-62 12c-18-16-38-22-62-12z" />
        </g>
        <g v-else-if="stage.motif === 'moon'">
          <path d="M628 62a38 38 0 1 0 30 60a30 30 0 1 1-30-60z" />
          <path d="M556 128l4-11 4 11 11 4-11 4-4 11-4-11-11-4z" />
        </g>
        <g v-else-if="stage.motif === 'bareTree'">
          <path d="M600 202V74" />
          <path d="M600 116l-32-28M600 140l34-30M600 94l-24-24M600 160l-28-22M600 106l28-26" />
        </g>
        <g v-else-if="stage.motif === 'lamp'">
          <path d="M616 204V76" />
          <path d="M616 76h-36" />
          <path d="M566 76a13 10 0 0 0 26 0z" />
          <path d="M579 96l-9 18M579 96l9 18M579 96v22" class="dim" />
        </g>
        <g v-else-if="stage.motif === 'voyagerInk'">
          <g :stroke="stage.ink" stroke-width="2.4">
            <path d="M600 118v34M566 96L486 40M636 100l84-52M600 84V40" />
            <path d="M584 118h32l4 14h-40z" />
          </g>
          <ellipse cx="600" cy="88" rx="40" ry="34" :stroke="stage.accent" stroke-width="2.6" />
          <ellipse cx="600" cy="88" rx="19" ry="16" :stroke="stage.accent" stroke-width="1.6" />
        </g>
        <g v-else-if="stage.motif === 'dino'">
          <path
            d="M540 168c-4-30 10-52 34-60c6-22 26-32 46-24c18 7 24 26 18 42c14 8 20 22 16 36c-4 10-14 8-18 0c-4 12-16 14-22 4c-8 10-22 8-26-2c-10 12-26 12-30 4c-8 6-16 4-18 0z"
          />
          <circle cx="616" cy="96" r="3.2" fill="#1c1c20" stroke="none" />
        </g>
        <g v-else-if="stage.motif === 'vine'" class="gloss">
          <path d="M470 176c40-6 60-28 66-58c4-22 20-34 40-30" />
          <path d="M536 118a13 13 0 1 0 0-26a13 13 0 0 0 0 26z" />
          <path d="M576 88a11 11 0 1 0 0-22a11 11 0 0 0 0 22z" />
          <path d="M614 108c30-4 46-22 48-46" />
          <path d="M662 62a12 12 0 1 0 0-24a12 12 0 0 0 0 24z" />
          <path d="M500 156c-14-10-16-26-6-38" />
        </g>
        <g v-else-if="stage.motif === 'singularity'">
          <g class="groove">
            <circle v-for="r0 in [30, 48, 66, 84, 102]" :key="r0" cx="600" cy="106" :r="r0" />
          </g>
          <path d="M600 106L742 44" stroke-width="1.2" />
          <circle cx="600" cy="106" r="4.5" :fill="stage.accent" stroke="none" />
        </g>
        <g v-else-if="stage.motif === 'stars'">
          <path d="M576 56c4 22 10 28 32 32c-22 4-28 10-32 32c-4-22-10-28-32-32c22-4 28-10 32-32z" />
          <path d="M648 108c2.6 14 6.4 18 20 20c-13.6 2-17.4 6-20 20c-2.6-14-6.4-18-20-20c13.6-2 17.4-6 20-20z" />
          <circle cx="690" cy="62" r="9" />
          <ellipse cx="690" cy="62" rx="17" ry="5" fill="none" :stroke="stage.accent" stroke-width="1.8" />
        </g>
        <g v-else-if="stage.motif === 'glasses'">
          <g v-for="(x, i) in [536, 600, 664]" :key="i">
            <path :d="`M${x - 22} 62h44l-22 26z`" />
            <path :d="`M${x} 88v30`" />
            <path :d="`M${x - 13} 120h26`" />
          </g>
          <circle cx="600" cy="164" r="11" :fill="stage.seal" :stroke="stage.seal" />
        </g>
        <g v-else-if="stage.motif === 'whale'">
          <path d="M512 112c40-32 110-30 142 2c16 16 8 36-14 40c-46 8-104 0-134-18c-10-6-8-18 6-24z" />
          <path d="M672 116l30-22-8 32z" />
          <path d="M556 88c8-16 18-26 28-28" fill="none" :stroke="stage.accent" stroke-width="2" />
          <circle cx="538" cy="122" r="3" fill="#f4efe5" stroke="none" />
        </g>
        <g v-else-if="stage.motif === 'piano'">
          <path d="M556 130c0-30 26-52 58-52c30 0 50 18 50 40c0 10-8 16-18 16h-90z" />
          <path d="M556 130h90v10h-90z" />
          <path d="M566 140v14M582 140v14M598 140v14M614 140v14M630 140v14" stroke-width="1.2" />
          <path d="M470 96h74M676 96h74M470 112h74M676 112h74" stroke-width="0.9" class="dim" />
        </g>
        <g v-else-if="stage.motif === 'deadBranch'">
          <path d="M598 200c0-46 6-80 18-106" />
          <path d="M608 152c-22-6-34-20-38-38M612 126c20-8 30-22 32-42M618 100c-16-10-22-24-20-40" />
          <path d="M574 112a7 5 0 1 0 0-10a7 5 0 0 0 0 10z" />
          <path d="M646 82a6 4 0 1 0 0-8a6 4 0 0 0 0 8z" />
          <path d="M600 58a6 5 0 1 0 0-10a6 5 0 0 0 0 10z" />
        </g>
        <g v-else-if="stage.motif === 'voyagerFoil'">
          <ellipse cx="600" cy="96" rx="38" ry="33" />
          <ellipse cx="600" cy="96" rx="18" ry="16" />
          <path d="M600 129v28M562 76L508 38M638 76l56-40M600 63V30M570 122l-40 32M630 122l42 30" />
          <circle cx="600" cy="96" r="4.5" :fill="stage.accent" stroke="none" />
        </g>
        <g v-else-if="stage.motif === 'runner'">
          <circle cx="628" cy="56" r="11" />
          <path d="M622 70l-14 34 16 12-6 34" stroke-width="9" stroke-linecap="round" fill="none" />
          <path d="M608 104l-26 6M624 116l26 14" stroke-width="8" stroke-linecap="round" fill="none" />
          <path d="M618 150l-24 22M618 150l16 26" stroke-width="9" stroke-linecap="round" fill="none" />
          <path d="M580 186c8-10 20-10 24 0c-10 8-18 6-24 0z" :fill="stage.accent" stroke="none" />
        </g>
        <g v-else-if="stage.motif === 'gorilla'">
          <path d="M560 128c0-34 22-58 44-58s44 24 44 58c0 26-20 44-44 44s-44-18-44-44z" />
          <path d="M580 122c0-16 10-26 24-26s24 10 24 26c0 14-10 24-24 24s-24-10-24-24z" fill="#3a2a30" stroke="none" />
          <path d="M566 96h76M566 110h76M566 124h76" stroke="#f0d8c4" stroke-width="2.4" class="collage" />
          <circle cx="592" cy="112" r="3" fill="#1c1418" stroke="none" />
          <circle cx="616" cy="112" r="3" fill="#1c1418" stroke="none" />
        </g>
        <g v-else-if="stage.motif === 'wings'">
          <path d="M600 74c-4 26-4 56 0 84" stroke-width="2" />
          <circle cx="600" cy="62" r="9" />
          <path d="M596 88c-30-30-58-34-66-14c-6 18 18 36 62 30z" />
          <path d="M604 88c30-30 58-34 66-14c6 18-18 36-62 30z" />
          <path d="M596 118c-20-10-38-8-42 6c-4 12 14 20 42 6z" />
          <path d="M604 118c20-10 38-8 42 6c4 12-14 20-42 6z" />
        </g>
      </g>

      <!-- ⑧ 원경 언덕 -->
      <path :fill="stage.far" d="M0 168c118-26 196-22 296 4s176 20 270-10 158-18 234 12v86H0z" />

      <!-- ⑨ 안개 띠. 원경과 중경을 갈라 깊이를 만든다 -->
      <rect x="0" y="150" width="800" height="52" :fill="`url(#mist-${uid})`" class="mist" />

      <!-- ⑩ 나무. 중경에 흩어진다 -->
      <g class="trees">
        <g v-for="t in scene.trees" :key="`t${t.i}`" :transform="`translate(${t.x} ${t.base})`">
          <rect :x="-1.6" :y="-t.h * 0.42" width="3.2" :height="t.h * 0.42" :fill="stage.veg" />
          <ellipse cx="0" :cy="-t.h * 0.58" :rx="t.w * 0.5" :ry="t.h * 0.34" :fill="t.dark ? stage.veg : stage.veg2" />
          <ellipse cx="-4" :cy="-t.h * 0.72" :rx="t.w * 0.32" :ry="t.h * 0.24" :fill="stage.veg2" opacity="0.7" />
        </g>
      </g>

      <!-- ⑪ 근경 -->
      <path :fill="stage.near" d="M0 196c140-20 214-12 320 10s186 12 316-14 132-10 164 6v62H0z" />

      <!-- ⑫ 덤불과 꽃 -->
      <g class="flowers">
        <g
          v-for="(f, i) in scene.flowers"
          :key="`f${i}`"
          :style="{ '--sway': `${f.sway}s` }"
          class="bloom"
        >
          <path :d="`M${f.x} ${f.y + 8}v-8`" :stroke="stage.veg" stroke-width="1" />
          <circle :cx="f.x" :cy="f.y" :r="f.r" :fill="stage.bloom" />
        </g>
      </g>

      <!-- ⑬ 지면 -->
      <rect x="0" y="228" width="800" height="32" :fill="stage.ground" />

      <!-- ⑭ 전경 풀. 바람에 흔들린다 -->
      <g class="grass" :stroke="stage.veg">
        <path
          v-for="(g, i) in scene.grass"
          :key="`g${i}`"
          :d="`M${g.x} 260 q${g.lean} ${-g.h * 0.6} ${g.lean * 1.6} ${-g.h}`"
          :style="{ '--sway': `${g.sway}s`, '--delay': `${g.delay}s` }"
        />
      </g>

      <!-- ⑮ 떠다니는 것 -->
      <g class="motes" :class="stage.motes" :fill="stage.bloom">
        <circle
          v-for="(m, i) in scene.motes"
          :key="`o${i}`"
          :cx="m.x"
          :cy="m.y"
          :r="m.r"
          :style="{ '--dur': `${m.dur}s`, '--delay': `${m.delay}s`, '--drift': `${m.drift}px` }"
        />
      </g>

      <!-- ⑯ 비네트 -->
      <rect x="0" y="0" width="800" height="260" :fill="`url(#vig-${uid})`" class="vig" />

      <!-- ⑰ 결 -->
      <rect class="grain" x="0" y="0" width="800" height="260" :filter="`url(#grain-${uid})`" />
    </g>
  </svg>
</template>

<style scoped>
.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/* ── 모티프 ── */
.scene.engraved .motif {
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/*
 * 일러스트형도 선은 그린다.
 * 처음에 stroke-width 를 0 으로 뒀더니 나무의 줄기와 가지가 통째로 사라지고
 * 캐노피만 초록 공으로 떠 있었다. 면으로 그린 부분과 선으로 그린 부분이
 * 한 모티프 안에 섞여 있다는 걸 놓쳤다.
 */
.scene.illustrated .motif {
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.motif {
  opacity: 0;
  transition: opacity var(--dur-enter) var(--ease-out);
}
.scene.open .motif {
  opacity: 0.9;
  transition-delay: 90ms;
}
.dim {
  opacity: 0.5;
}
/* 사랑 — 무광 바탕에 유광 인쇄. 각도를 틀어야 무늬가 보인다 */
.gloss {
  opacity: 0.3;
  stroke-width: 2.2;
}
/* 대폭발 — 레코드판 홈처럼 눌린 동심원 */
.groove {
  opacity: 0.22;
  stroke-width: 1;
  fill: none;
}
.collage {
  opacity: 0.55;
}

/*
 * ── 빛줄기 ──
 * 구름 사이로 내리는 빛. 아주 옅게 깔고 천천히 밝기가 흔들린다.
 * 진하게 두면 빛이 아니라 흰 삼각형으로 보인다.
 */
.rays {
  opacity: 0.11;
  mix-blend-mode: screen;
  animation: breathe 11s ease-in-out infinite;
}
@keyframes breathe {
  50% {
    opacity: 0.19;
  }
}

/* ── 구름 ── */
.cloud {
  transform: translateX(var(--x));
  animation: sail var(--dur) linear infinite;
}
@keyframes sail {
  to {
    transform: translateX(calc(var(--x) + 980px));
  }
}

/* ── 새 떼 ── */
.flock {
  fill: none;
  stroke-width: 1.4;
  stroke-linecap: round;
  opacity: 0.5;
  transform: translate(-120px, 52px);
  animation: fly 74s linear infinite;
}
@keyframes fly {
  to {
    transform: translate(880px, 24px);
  }
}

/* 안개 띠는 아주 느리게 숨 쉰다 */
.mist {
  animation: breathe 17s ease-in-out infinite;
}

/*
 * ── 꽃 ──
 * 줄기 끝을 잡고 흔든다. 밑동이 아니라 위쪽만 움직여야 자라 있는 것처럼 보인다.
 */
.bloom {
  transform-origin: center bottom;
  transform-box: fill-box;
  animation: nod var(--sway) ease-in-out infinite alternate;
}
@keyframes nod {
  to {
    transform: rotate(4deg);
  }
}

/* ── 전경 풀 ── */
.grass path {
  fill: none;
  stroke-width: 2.2;
  stroke-linecap: round;
  opacity: 0.95;
  transform-origin: center bottom;
  transform-box: fill-box;
  animation: bend var(--sway) ease-in-out var(--delay) infinite alternate;
}
@keyframes bend {
  to {
    transform: rotate(6deg) scaleY(0.97);
  }
}

/*
 * ── 떠다니는 것 ──
 * 홀씨는 위로 오르고, 눈은 내려오고, 별은 제자리에서 깜빡인다.
 */
.motes circle {
  opacity: 0;
  animation: float var(--dur) linear var(--delay) infinite;
}
@keyframes float {
  10% {
    opacity: 0.65;
  }
  90% {
    opacity: 0.35;
  }
  100% {
    transform: translate(var(--drift), -70px);
    opacity: 0;
  }
}
.motes.snow circle {
  animation-name: fall;
}
@keyframes fall {
  10% {
    opacity: 0.9;
  }
  100% {
    transform: translate(var(--drift), 110px);
    opacity: 0;
  }
}
.motes.star circle {
  animation-name: twinkle;
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.95;
  }
}
.motes.dust circle {
  opacity: 0.3;
}

.vig {
  pointer-events: none;
}
/* 결. 아주 옅게만 얹는다. 진하면 그림이 지저분해진다 */
.grain {
  opacity: 0.055;
  mix-blend-mode: multiply;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .rays,
  .cloud,
  .flock,
  .mist,
  .bloom,
  .grass path,
  .motes circle {
    animation: none;
  }
  .motes circle {
    opacity: 0.4;
  }
}
</style>
