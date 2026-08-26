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

  /*
   * ── 물속 ────────────────────────────────────────
   * 물고기 떼 · 해파리 · 해초 · 산호.
   *
   * 뭍의 것들과 규칙이 다르다. 나무는 땅에 박혀 있지만
   * 물고기와 해파리는 물기둥 어디에나 있을 수 있고, 늘 움직인다.
   */
  const fish = Array.from({ length: (s.fish ?? 0) * 6 }, (_, i) => ({
    i,
    // 한 떼가 비슷한 높이에서 함께 흐른다
    band: Math.floor(i / 6),
    x: pick(-60, 820),
    y: 44 + Math.floor(i / 6) * 52 + pick(-14, 14),
    sc: pick(0.55, 1.15),
    dur: pick(26, 54),
    delay: pick(-40, 0),
    // 절반은 반대로 헤엄친다
    back: r() > 0.55,
  }))

  const jellies = Array.from({ length: s.jellies ?? 0 }, (_, i) => ({
    i,
    x: pick(40, 760),
    y: pick(40, 200),
    sc: pick(0.5, 1.25),
    dur: pick(7, 13),
    delay: pick(-10, 0),
    rise: pick(16, 44),
  }))

  // 해초. 바닥에 뿌리를 두고 물살에 눕는다
  const kelp = s.kelp
    ? Array.from({ length: 22 }, () => ({
        x: pick(-20, 820),
        h: pick(70, 190),
        lean: pick(-26, 26),
        sway: pick(4.5, 9),
        delay: pick(0, 5),
        w: pick(2.4, 6),
      }))
    : []

  // 산호. 바닥에 앉은 덩어리들
  const corals = s.corals
    ? Array.from({ length: 14 }, () => ({
        x: pick(0, 800),
        y: pick(226, 248),
        r: pick(6, 20),
        arms: 3 + Math.floor(r() * 3),
        lit: r() > 0.62,
      }))
    : []

  /*
   * 암초.
   *
   * 산 능선을 색만 바꿔 쓰면 물속에서도 산으로 보인다. 능선은 하늘과
   * 맞닿은 선이라 위가 뾰족하고 아래가 넓은데, 물속 바위는 그렇지 않다 —
   * 물이 깎아서 위가 둥글고 옆으로 퍼진다.
   * 그래서 꺾인 선이 아니라 둥근 덩어리를 겹쳐 세운다.
   */
  const reef = s.reef
    ? Array.from({ length: 3 }, (_, band) => ({
        band,
        o: 0.32 + band * 0.3,
        rocks: Array.from({ length: 5 - band }, () => {
          const w = pick(120, 300) * (1 - band * 0.16)
          return { x: pick(-80, 820), w, h: pick(46, 128) * (1 - band * 0.2) }
        }),
        base: 236 - band * 30,
      }))
    : []

  /*
   * 마린 스노우.
   *
   * 위에서 끊임없이 내려오는 부유물. 심해를 심해로 보이게 하는 것은
   * 사실 이것 하나다 — 물이 맑으면 그냥 파란 방이고,
   * 무언가가 천천히 가라앉고 있어야 깊이가 생긴다.
   * 아주 느리게, 아주 작게. 눈처럼 흩날리면 눈이 된다.
   */
  const marine = s.marine
    ? Array.from({ length: 54 }, () => ({
        x: pick(0, 800),
        y: pick(-30, 260),
        r: pick(0.5, 1.7),
        dur: pick(30, 80),
        delay: pick(-70, 0),
        drift: pick(-16, 16),
        o: pick(0.18, 0.5),
      }))
    : []

  // 스스로 빛나는 것들. 깊을수록 빛은 위에서 오지 않는다
  const glows = Array.from({ length: s.glows ?? 0 }, () => ({
    x: pick(16, 784),
    y: pick(46, 244),
    r: pick(1.4, 3.6),
    dur: pick(3, 8),
    delay: pick(-8, 0),
  }))

  /*
   * ── 바닷가 ──────────────────────────────────────
   *
   * 물이 뭍에 닿는 자리를 y 206 으로 잡았다. 그 위는 바다, 아래는 모래다.
   * 사람은 지면(y 228)에서 걸으니 모래가 스물두 칸쯤 남는다 —
   * 걸을 자리는 있고 바다는 충분히 넓다.
   */
  const SHORE = 206

  // 파도. 해안선까지 밀려왔다가 빠진다. 저마다 다른 박자로
  const waves = Array.from({ length: s.waves ?? 0 }, (_, i) => ({
    i,
    y: SHORE - 26 + i * 5.5,
    dur: pick(5.5, 9),
    delay: pick(-9, 0),
    // 뒤쪽 파도일수록 옅고 얇다
    o: 0.25 + i * 0.13,
    w: 1.1 + i * 0.35,
  }))

  /*
   * 나는 갈매기.
   *
   * 새 떼(birds)는 한 무리가 대열을 지어 지나간다. 바닷가 갈매기는
   * 그렇게 날지 않는다 — 저마다 다른 높이에서 각자 원을 그린다.
   * 그래서 한 마리씩 다른 궤도와 박자를 준다.
   */
  const gulls = Array.from({ length: s.gulls ?? 0 }, (_, i) => ({
    i,
    /*
     * 바다 위를 낮게 난다.
     *
     * 처음에는 하늘 높이(y 28~128)에 띄웠다. 그런데 판은 접혀 있을 때가
     * 대부분이고, 접히면 아래쪽 절반만 보인다. 갈매기가 통째로 잘려서
     * 판을 펼치기 전에는 한 마리도 없는 바닷가였다.
     *
     * 접히면 화폭 아래쪽 y 137~260 만 보인다. 그 안에서 날아야 한다.
     * 실제 갈매기도 하늘 높이 떠 있지 않다. 물 위를 낮게 훑는다.
     */
    y: pick(146, 196),
    sc: pick(0.6, 1.25),
    dur: pick(26, 52),
    delay: pick(-50, 0),
    // 오르내리는 폭. 갈매기는 곧게 날지 않는다
    rise: pick(10, 30),
    bob: pick(3.5, 7),
    back: r() > 0.5,
  }))

  /*
   * 돌고래.
   *
   * 물 밖으로 솟았다 들어간다. 뛰는 순간만 보이고 나머지는 물속이라,
   * 한 번 뛰는 데 쓰는 시간이 전체의 십 분의 일도 안 된다.
   * 자주 뛰면 놀랍지 않다.
   */
  const dolphins = Array.from({ length: s.dolphins ?? 0 }, (_, i) => ({
    i,
    x: pick(120, 660),
    y: pick(184, 197),
    sc: pick(0.72, 1),
    dur: pick(19, 33),
    delay: pick(-30, 0),
    back: r() > 0.5,
  }))

  /*
   * ── 공룡 판 ─────────────────────────────────────
   *
   * 이 무대만 어린이 스티커북처럼 그린다. 그래서 모든 것에 굵은 외곽선을
   * 두르고, 판 전체가 파스텔 모브인데 테두리만 시안이다.
   * 참조한 표지에서 시안은 0.5% 밖에 안 쓰였는데, 그 0.5% 가 이 표지를
   * 나머지 열둘과 갈라 놓는다.
   */

  // 먼 화산. 연기가 오래 피어오른다
  const volcanoes = Array.from({ length: s.volcanoes ?? 0 }, (_, i) => ({
    i,
    x: 150 + i * 380 + pick(-50, 50),
    base: 176 - i * 6,
    w: pick(120, 190),
    h: pick(48, 78),
    dur: pick(16, 26),
    delay: pick(-20, 0),
    /*
     * 터지는 주기. 아주 길다.
     * 한 바퀴의 96% 는 아무 일도 없고 연기만 오른다. 자주 터지면
     * 놀랍지 않을뿐더러, 이 판이 조용히 지나가는 배경이 아니게 된다.
     * 둘이 같이 터지지 않도록 주기와 시작을 어긋뜨린다.
     */
    blastDur: pick(34, 52),
    blastDelay: pick(-48, 0),
    // 튀어 오르는 용암 방울. 각도와 세기를 미리 정해 둔다
    lava: Array.from({ length: 7 }, () => ({
      dx: pick(-26, 26),
      dy: pick(-34, -16),
      r: pick(1.4, 3),
      d: pick(0, 0.28),
    })),
  }))

  // 소철. 굵은 줄기에 잎이 부챗살처럼 퍼진다
  const cycads = Array.from({ length: s.cycads ?? 0 }, (_, i) => ({
    i,
    x: pick(20, 780),
    y: pick(196, 214),
    sc: pick(0.7, 1.25),
    fronds: 6 + Math.floor(r() * 3),
    sway: pick(5, 9),
    delay: pick(0, 5),
  }))

  // 고사리. 전경에 낮게 깔린다
  const ferns = Array.from({ length: s.ferns ?? 0 }, () => ({
    x: pick(-10, 810),
    y: pick(226, 252),
    sc: pick(0.6, 1.2),
    lean: pick(-1, 1) > 0 ? 1 : -1,
    sway: pick(3.4, 6),
    delay: pick(0, 4),
  }))

  /*
   * 알 둥지.
   * 하나만 둔다. 여럿 두면 알 가게가 된다.
   * 가운데 알만 아주 가끔 흔들린다 — 안에 무언가 있다는 뜻이다.
   */
  const nest = s.eggs ? { x: pick(120, 660), y: pick(238, 248), sc: pick(0.9, 1.2) } : null

  // 아기 공룡. 알 근처를 종종거린다
  const hatchlings = Array.from({ length: s.hatchlings ?? 0 }, (_, i) => ({
    i,
    x: pick(60, 720),
    y: pick(232, 250),
    sc: pick(0.95, 1.4),
    dur: pick(16, 30),
    delay: pick(-26, 0),
    span: pick(50, 130),
    step: pick(0.42, 0.66),
    back: r() > 0.5,
  }))

  // 익룡. 하늘을 가로지른다
  const pterosaurs = Array.from({ length: s.pterosaurs ?? 0 }, (_, i) => ({
    i,
    y: pick(40, 132),
    sc: pick(0.55, 1),
    dur: pick(34, 62),
    delay: pick(-58, 0),
    rise: pick(10, 26),
    flap: pick(1.6, 2.6),
    back: r() > 0.5,
  }))

  // 모래 위를 걷는 갈매기. 물가를 따라 종종거린다
  const strollers = Array.from({ length: s.walkers ?? 0 }, (_, i) => ({
    i,
    x: pick(60, 720),
    y: SHORE + pick(6, 18),
    sc: pick(0.55, 0.8),
    dur: pick(22, 40),
    delay: pick(-30, 0),
    span: pick(40, 110),
    step: pick(0.5, 0.8),
    back: r() > 0.5,
  }))

  // 꽃게. 옆으로만 걷는다
  const crabs = Array.from({ length: s.crabs ?? 0 }, (_, i) => ({
    i,
    x: pick(40, 740),
    y: SHORE + pick(14, 30),
    sc: pick(0.6, 1),
    dur: pick(14, 26),
    delay: pick(-24, 0),
    span: pick(50, 130),
    step: pick(0.34, 0.5),
    back: r() > 0.5,
  }))

  // 소라 · 조개 · 불가사리. 모래 위에 흩어져 가만히 있는 것들
  const shells = Array.from({ length: s.shells ?? 0 }, () => ({
    x: pick(10, 790),
    y: SHORE + pick(8, 44),
    sc: pick(0.7, 1.3),
    kind: Math.floor(r() * 3),
    tilt: pick(-24, 24),
  }))

  return {
    volcanoes,
    cycads,
    ferns,
    nest,
    hatchlings,
    pterosaurs,
    waves,
    gulls,
    dolphins,
    strollers,
    crabs,
    shells,
    clouds,
    birds,
    trees,
    flowers,
    grass,
    motes,
    fish,
    jellies,
    kelp,
    corals,
    reef,
    marine,
    glows,
  }
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
  <!--
    접혀 있을 때와 펼쳤을 때 그림을 다루는 방식이 다르다.

    slice  가로를 꽉 채우고 넘치는 위쪽을 잘라낸다.
           지면 쪽 띠만 보이고 하늘과 모티프는 화면 밖에 있다.
    meet   전체가 다 들어오게 맞춘다. 그제야 모티프가 드러난다.

    이걸 빼먹으면 기본값(meet)이 접힌 상태에서도 전체를 높이에 맞춰 줄여서,
    860px 폭 판에 그림이 471px 만 그려지고 좌우에 193px 씩 빈칸이 생긴다.
    실제로 한 번 그렇게 됐다.
  -->
  <svg
    class="scene"
    viewBox="0 0 800 260"
    :preserveAspectRatio="open ? 'xMidYMid meet' : 'xMidYMax slice'"
    :class="[stage.lang, { open }]"
    aria-hidden="true"
  >
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
        <path
          v-for="k in 5"
          :key="k"
          :d="`M${520 + k * 26} 8 L${430 + k * 34} 260 L${470 + k * 34} 260Z`"
        />
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
      <g v-if="!stage.under" class="clouds" :fill="stage.bloom">
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
      <g v-if="!stage.under && scene.birds.length" class="flock" :stroke="stage.veg">
        <path
          v-for="bd in scene.birds"
          :key="`b${bd.i}`"
          :d="`M${bd.x} ${bd.y} q4 -4 8 0 q4 -4 8 0`"
          :transform="`scale(${bd.s})`"
        />
      </g>

      <!--
        ⑤' 수면. 물속에서만 보인다.

        위에서 들어온 빛이 물결에 흔들려 아래로 어른거린다.
        이 한 겹이 있고 없고가 '파란 배경' 과 '물속' 을 가른다 —
        물은 투명해서 그 자체로는 안 보이고, 빛이 지나갈 때만 보인다.
      -->
      <g v-if="stage.under" class="surface" :stroke="stage.bloom">
        <path
          v-for="k in 6"
          :key="`w${k}`"
          :d="`M-60 ${7 + k * 10} q64 ${k % 2 ? 8 : -8} 128 0 q64 ${k % 2 ? -8 : 8} 128 0 q64 ${k % 2 ? 8 : -8} 128 0 q64 ${k % 2 ? -8 : 8} 128 0 q64 ${k % 2 ? 8 : -8} 128 0 q64 ${k % 2 ? -8 : 8} 128 0 q64 ${k % 2 ? 8 : -8} 128 0`"
          :style="{
            '--dur': `${6 + (k % 4) * 2.2}s`,
            '--delay': `${k * -1.1}s`,
            '--o': 0.34 - k * 0.045,
          }"
        />
      </g>

      <!--
        암초. 능선 대신 둥근 덩어리를 세 겹 세운다.
        능선은 하늘과 맞닿은 선이라 위가 뾰족한데,
        물이 깎은 바위는 위가 둥글고 옆으로 퍼진다.
      -->
      <g v-if="stage.under" class="reef">
        <g v-for="b in scene.reef" :key="`rf${b.band}`" :opacity="b.o" :fill="stage.veg">
          <path
            v-for="(k, i) in b.rocks"
            :key="`rk${i}`"
            :d="`M${k.x} 260 L${k.x} ${b.base} q${k.w * 0.16} ${-k.h} ${k.w * 0.5} ${-k.h * 0.94} q${k.w * 0.34} ${-0.06 * k.h} ${k.w * 0.5} ${k.h * 0.94} L${k.x + k.w} 260Z`"
          />
        </g>
      </g>

      <!-- ⑥' 먼 물고기 떼. 모티프보다 뒤라 작고 흐리다 -->
      <g v-if="stage.under" class="school far" :fill="stage.veg2">
        <g
          v-for="f in scene.fish.filter((x) => x.band === 0)"
          :key="`ff${f.i}`"
          class="fish"
          :style="{
            '--dur': `${f.dur}s`,
            '--delay': `${f.delay}s`,
            '--dir': f.back ? -1 : 1,
          }"
        >
          <g :transform="`translate(${f.x} ${f.y}) scale(${f.sc * 0.7})`">
            <path d="M0 0 q7 -4.4 14 0 q-7 4.4 -14 0Z" />
            <path d="M14 0 l5 -3.4 v6.8Z" />
          </g>
        </g>
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
        <path
          d="M648 108c2.6 14 6.4 18 20 20c-13.6 2-17.4 6-20 20c-2.6-14-6.4-18-20-20c13.6-2 17.4-6 20-20z"
        />
        <circle cx="690" cy="62" r="9" />
        <ellipse
          cx="690"
          cy="62"
          rx="17"
          ry="5"
          fill="none"
          :stroke="stage.accent"
          stroke-width="1.8"
        />
      </g>
      <g v-else-if="stage.motif === 'glasses'">
        <g v-for="(x, i) in [536, 600, 664]" :key="i">
          <path :d="`M${x - 22} 62h44l-22 26z`" />
          <path :d="`M${x} 88v30`" />
          <path :d="`M${x - 13} 120h26`" />
        </g>
        <circle cx="600" cy="164" r="11" :fill="stage.seal" :stroke="stage.seal" />
      </g>
      <!--
          심해의 주인공. 커다란 해파리 하나.

          갓은 반원 아래에 물결을 물려 닫는다. 그냥 반원이면 버섯이다.
          촉수는 길이를 다 다르게 둔다 — 같으면 빗자루로 보인다.
        -->
      <g v-else-if="stage.motif === 'jelly'" class="bigjelly">
        <path
          class="bell"
          d="M512 128 A72 62 0 0 1 656 128 q-18 14 -36 0 q-18 14 -36 0 q-18 14 -36 0 q-18 14 -36 0Z"
        />
        <g
          class="arms"
          fill="none"
          :stroke="stage.motifColor"
          stroke-width="3"
          stroke-linecap="round"
        >
          <path d="M534 132 q-14 52 4 96" />
          <path d="M556 136 q10 60 -8 106" />
          <path d="M584 138 q-6 66 6 112" />
          <path d="M612 136 q-10 58 8 100" />
          <path d="M634 132 q14 50 -4 92" />
        </g>
        <g class="veil" fill="none" :stroke="stage.bloom" stroke-width="1.6" opacity="0.6">
          <path d="M528 122 A60 50 0 0 1 640 122" />
          <path d="M546 116 A44 36 0 0 1 622 116" />
        </g>
      </g>
      <g v-else-if="stage.motif === 'whale'">
        <path
          d="M512 112c40-32 110-30 142 2c16 16 8 36-14 40c-46 8-104 0-134-18c-10-6-8-18 6-24z"
        />
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
        <path
          d="M608 104l-26 6M624 116l26 14"
          stroke-width="8"
          stroke-linecap="round"
          fill="none"
        />
        <path
          d="M618 150l-24 22M618 150l16 26"
          stroke-width="9"
          stroke-linecap="round"
          fill="none"
        />
        <path d="M580 186c8-10 20-10 24 0c-10 8-18 6-24 0z" :fill="stage.accent" stroke="none" />
      </g>
      <g v-else-if="stage.motif === 'gorilla'">
        <path d="M560 128c0-34 22-58 44-58s44 24 44 58c0 26-20 44-44 44s-44-18-44-44z" />
        <path
          d="M580 122c0-16 10-26 24-26s24 10 24 26c0 14-10 24-24 24s-24-10-24-24z"
          fill="#3a2a30"
          stroke="none"
        />
        <path
          d="M566 96h76M566 110h76M566 124h76"
          stroke="#f0d8c4"
          stroke-width="2.4"
          class="collage"
        />
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

    <!--
        ⑧' 바다.

        수평선(y 150)에서 물가(y 206)까지 네 겹으로 내려온다.
        먼 물은 짙고 가까운 물은 옅다 — 얕아질수록 바닥이 비쳐서다.
        겹마다 윗선을 다르게 굽혀 두면 한 장의 파란 판이 아니라
        깊이가 다른 물로 읽힌다.
      -->
    <g v-if="stage.beach" class="sea">
      <!-- 먼 물. 수평선 쪽은 하늘빛을 받아 밝다 -->
      <rect x="0" y="150" width="800" height="58" :fill="stage.near" />
      <rect x="0" y="150" width="800" height="9" :fill="stage.mid" opacity="0.5" />
      <!-- 깊은 골. 가운데가 가장 짙다 -->
      <path fill="#0b3a57" opacity="0.2" d="M0 164 q100 -6 200 2 t200 1 t200 -4 t200 4 v22H0z" />
      <!-- 얕아지는 물. 바닥이 비쳐 밝아진다 -->
      <path
        :fill="stage.mid"
        opacity="0.78"
        d="M0 186 q110 7 210 -2 t190 -1 t200 5 t200 -3 v26H0z"
      />
      <path :fill="stage.sky" opacity="0.5" d="M0 198 q120 5 220 -1 t180 0 t200 3 t200 -2 v14H0z" />
    </g>

    <!-- ⑧ 원경 언덕 -->
    <path
      v-if="!stage.beach"
      :fill="stage.far"
      d="M0 168c118-26 196-22 296 4s176 20 270-10 158-18 234 12v86H0z"
    />

    <!-- ⑨ 안개 띠. 원경과 중경을 갈라 깊이를 만든다 -->
    <rect
      v-if="!stage.beach"
      x="0"
      y="150"
      width="800"
      height="52"
      :fill="`url(#mist-${uid})`"
      class="mist"
    />

    <!-- ⑩ 나무. 중경에 흩어진다 -->
    <g v-if="!stage.under" class="trees">
      <g v-for="t in scene.trees" :key="`t${t.i}`" :transform="`translate(${t.x} ${t.base})`">
        <rect :x="-1.6" :y="-t.h * 0.42" width="3.2" :height="t.h * 0.42" :fill="stage.veg" />
        <ellipse
          cx="0"
          :cy="-t.h * 0.58"
          :rx="t.w * 0.5"
          :ry="t.h * 0.34"
          :fill="t.dark ? stage.veg : stage.veg2"
        />
        <ellipse
          cx="-4"
          :cy="-t.h * 0.72"
          :rx="t.w * 0.32"
          :ry="t.h * 0.24"
          :fill="stage.veg2"
          opacity="0.7"
        />
      </g>
    </g>

    <!-- ⑪ 근경 -->
    <path
      v-if="!stage.beach"
      :fill="stage.near"
      d="M0 196c140-20 214-12 320 10s186 12 316-14 132-10 164 6v62H0z"
    />

    <!--
        ⑪' 젖은 모래.

        물이 닿았다 간 자리. 마른 모래보다 어둡고 조금 반짝인다.
        이 띠가 없으면 바다와 모래가 자로 그은 듯 갈려서,
        물이 밀려온 적 없는 해변이 된다.
      -->
    <path
      v-if="stage.beach"
      :fill="stage.veg"
      opacity="0.55"
      d="M0 206 q110 7 210 1 t190 -2 t200 5 t200 -3 v54H0z"
    />

    <!-- ⑫ 덤불과 꽃 -->
    <g v-if="!stage.under" class="flowers">
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

    <!--
        ⑪' 가까운 물고기 떼와 해파리.

        해파리는 갓을 오므렸다 펴며 위로 밀려 올라갔다가 다시 가라앉는다.
        박자를 다 다르게 둬야 한 무리가 아니라 각자 떠 있는 것으로 보인다.
      -->
    <g v-if="stage.under" class="school near" :fill="stage.motifColor">
      <g
        v-for="f in scene.fish.filter((x) => x.band > 0)"
        :key="`fn${f.i}`"
        class="fish"
        :style="{
          '--dur': `${f.dur}s`,
          '--delay': `${f.delay}s`,
          '--dir': f.back ? -1 : 1,
        }"
      >
        <g :transform="`translate(${f.x} ${f.y}) scale(${f.sc})`">
          <path d="M0 0 q7 -4.4 14 0 q-7 4.4 -14 0Z" />
          <path d="M14 0 l5 -3.4 v6.8Z" />
        </g>
      </g>
    </g>

    <g v-if="stage.under" class="jellies">
      <g
        v-for="j in scene.jellies"
        :key="`j${j.i}`"
        class="jelly"
        :style="{
          '--dur': `${j.dur}s`,
          '--delay': `${j.delay}s`,
          '--rise': `${j.rise}px`,
        }"
      >
        <g :transform="`translate(${j.x} ${j.y}) scale(${j.sc})`">
          <path
            class="bell"
            :fill="stage.bloom"
            d="M-11 2 A11 10 0 0 1 11 2 q-5.5 3.4 -11 0 q-5.5 3.4 -11 0Z"
          />
          <g class="arms" :stroke="stage.bloom">
            <path d="M-6 3 q-2.5 11 0.6 21" />
            <path d="M-2 4 q1.6 12 -1 22" />
            <path d="M2 4 q-1.6 12 1 22" />
            <path d="M6 3 q2.5 11 -0.6 21" />
          </g>
        </g>
      </g>
    </g>

    <!--
      ⑪''' 돌고래.

      물 밖으로 솟았다 들어간다. 뛰는 순간만 보이고 나머지는 물속이라,
      한 번 뛰는 데 쓰는 시간이 전체의 십 분의 일도 안 된다.
      자주 뛰면 놀랍지 않다.

      ── 모양 ────────────────────────────────────
      돌고래는 매끈한 방추형이다. 주둥이가 뾰족하게 나오고, 이마(멜론)가
      둥글게 솟았다가, 등지느러미를 지나 꼬리자루로 갈수록 가늘어진다.
      이 세 마디가 없으면 돌고래가 아니라 물고기다.

      지느러미는 다 뒤로 젖혀져 있다. 앞으로 뻗은 지느러미를 그리면
      헤엄치는 것이 아니라 서 있는 것으로 보인다.
      꼬리는 가로로 눕고 가운데가 파여 두 갈래다 — 물고기와 갈리는 자리다.

      배는 등보다 밝다. 물속에서 위아래 어디서 봐도 눈에 덜 띄게 하는
      생김새인데, 그림에서는 그 대비가 몸을 둥글어 보이게 한다.
    -->
    <g v-if="stage.beach" class="dolphins">
      <g
        v-for="d in scene.dolphins"
        :key="`dp${d.i}`"
        class="dolphin"
        :style="{ '--dur': `${d.dur}s`, '--delay': `${d.delay}s` }"
      >
        <!-- 물보라. 솟을 때와 들어갈 때만 잠깐 -->
        <g
          class="splash"
          :transform="`translate(${d.x} ${d.y + 6}) scale(${d.sc})`"
          stroke="#ffffff"
          fill="none"
          stroke-linecap="round"
          stroke-width="1.4"
        >
          <path d="M-13 0 q4 -7 7 -9" />
          <path d="M-6 0 q1 -8 2 -11" />
          <path d="M2 0 q2 -7 5 -10" />
          <path d="M9 0 q4 -5 8 -7" />
          <ellipse cx="-1" cy="1" rx="15" ry="2.6" opacity="0.55" />
        </g>

        <g
          class="body"
          :transform="`translate(${d.x} ${d.y}) scale(${d.back ? -d.sc : d.sc} ${d.sc})`"
        >
          <!--
            몸.

            돌고래를 돌고래로 만드는 건 부리다.
            가는 부리가 앞으로 쭉 나오고, 그 뒤에서 이마(멜론)가 둥글게
            솟는다. 둘 사이에 접힌 자국이 있다.
            이 마디 없이 앞을 뾰족하게만 만들면 아무리 다듬어도 참치다.

            그다음이 길이다. 가장 두꺼운 곳의 네 배는 되어야 한다.
            짧고 깊으면 역시 물고기다.

            꼬리는 가로로 눕고 가운데가 파인다. 물고기 꼬리는 세로다.
          -->
          <path
            fill="#3a5c73"
            d="M20.5 0.9 C18.6 0.1 17 -0.2 15.2 -0.4
               C13.4 -1.6 12.4 -2.8 11.4 -3.6
               C7.6 -5 3.4 -5.4 -0.8 -5.1
               C-6 -4.7 -11 -3.4 -15.2 -1.1
               C-14.8 -0.3 -14.8 0.1 -15.2 0.8
               C-11 1.9 -6 2.9 -0.8 3.3
               C4.4 3.6 10 3.2 14.6 2.2
               C16.6 1.8 19 1.4 20.5 0.9 Z"
          />
          <!-- 배와 아래턱. 등보다 밝다. 그 대비가 몸을 둥글어 보이게 한다 -->
          <path
            fill="#dceaf2"
            opacity="0.92"
            d="M19.6 1.2 C15 2.5 9 3.3 3 3.2
               C-2.6 3.1 -8.6 2.4 -14.6 1
               C-9 0.8 -3 0.7 3 0.6 C9 0.5 15 0.7 19.6 1.2 Z"
          />
          <!-- 부리와 이마 사이의 접힌 자국 -->
          <path
            stroke="#24404f"
            stroke-width="0.55"
            fill="none"
            stroke-linecap="round"
            opacity="0.75"
            d="M15.1 -0.5 C14.6 0.2 14.6 0.9 14.9 1.6"
          />
          <!-- 입 -->
          <path
            stroke="#24404f"
            stroke-width="0.55"
            fill="none"
            stroke-linecap="round"
            d="M20.2 1.1 C17.6 1.7 15.8 1.9 14.7 1.9"
          />
          <!-- 등지느러미. 낫처럼 뒤로 휘고 뒷선이 오목하다 -->
          <path
            fill="#2f4f65"
            d="M2.6 -5.3 C1.6 -8.6 -0.8 -11.4 -5.4 -12.4
               C-4.5 -9.5 -3.4 -7 -2.6 -4.9 Z"
          />
          <!-- 가슴지느러미. 뒤아래로 젖혀진다 -->
          <path
            fill="#2a4759"
            d="M6.6 3 C4.8 5.2 2.2 6.5 -0.4 6.9
               C0.6 4.8 2.2 3.3 3.6 2.5 Z"
          />
          <!-- 꼬리. 가로로 눕고 가운데가 파여 두 갈래다 -->
          <path
            fill="#2f4f65"
            d="M-15 -0.5 C-17.8 -2.2 -20.6 -3.2 -23.2 -3.4
               C-21.2 -1.6 -19.8 -0.5 -19.2 0.3
               C-19.8 1.1 -21.2 2.4 -23.2 4.4
               C-20.4 4 -17.6 2.4 -15 0.6 Z"
          />
          <circle cx="12.6" cy="-1.5" r="0.8" fill="#12232f" />
        </g>
      </g>
    </g>

    <!--
      ⑫' 파도.

      밀려왔다 빠진다. 다가올수록 굵어지고 진해지다가 물가에 닿는 순간
      스러진다 — 부서지는 게 아니라 얇아지며 사라진다.
      저마다 다른 박자라야 바다가 숨 쉬는 것으로 보인다.
      다 같이 밀려오면 그건 파도가 아니라 줄무늬다.
    -->
    <g v-if="stage.beach" class="surf" stroke="#ffffff" fill="none" stroke-linecap="round">
      <path
        v-for="w in scene.waves"
        :key="`sf${w.i}`"
        :d="`M-20 ${w.y} q100 -4 200 0 t200 0 t200 0 t240 0`"
        :stroke-width="w.w"
        :style="{ '--dur': `${w.dur}s`, '--delay': `${w.delay}s`, '--o': w.o }"
      />
    </g>

    <!-- ⑬ 지면 -->
    <rect x="0" y="228" width="800" height="32" :fill="stage.ground" />

    <!--
      ⑬''''''' 소철.

      공룡이 살던 때의 식물은 꽃이 아니라 잎이다. 굵은 줄기 하나에
      잎이 부챗살처럼 퍼진다. 잎마다 각도를 조금씩 어긋뜨려야
      한 그루로 보인다 — 고르게 두면 우산이 된다.
    -->
    <g v-if="stage.dinoland" class="cycads">
      <g
        v-for="c in scene.cycads"
        :key="`cy${c.i}`"
        class="cycad"
        :style="{ '--sway': `${c.sway}s`, '--delay': `${c.delay}s` }"
        :transform="`translate(${c.x} ${c.y}) scale(${c.sc})`"
      >
        <!-- 줄기. 야자보다 짧고 굵다. 소철은 키가 크지 않다 -->
        <path :stroke="stage.veg" stroke-width="4.2" stroke-linecap="round" d="M0 0 v-11" />
        <path
          v-for="k in c.fronds"
          :key="`fr${k}`"
          :fill="stage.veg2"
          :stroke="stage.ink"
          stroke-width="0.6"
          :transform="`rotate(${(k - (c.fronds + 1) / 2) * 46} 0 -12)`"
          d="M0 -12 C7 -17 14 -15 20 -6 C13 -11 6 -12 0 -9 Z"
        />
      </g>
    </g>

    <!--
      ⑬'''''''' 알 둥지.

      하나만 둔다. 여럿 두면 알 가게가 된다.
      가운데 알만 아주 가끔 흔들린다 — 안에 무언가 있다는 뜻이다.
    -->
    <g v-if="stage.dinoland && scene.nest" class="nest">
      <g :transform="`translate(${scene.nest.x} ${scene.nest.y}) scale(${scene.nest.sc})`">
        <path
          :fill="stage.veg"
          :stroke="stage.ink"
          stroke-width="0.8"
          d="M-14 2 q4 -6 14 -6 q10 0 14 6 q-6 3 -14 3 q-8 0 -14 -3 z"
        />
        <ellipse
          :fill="stage.sky"
          :stroke="stage.ink"
          stroke-width="0.9"
          cx="-6.5"
          cy="-3"
          rx="3.6"
          ry="4.6"
        />
        <ellipse
          :fill="stage.sky"
          :stroke="stage.ink"
          stroke-width="0.9"
          cx="6.5"
          cy="-3"
          rx="3.6"
          ry="4.6"
        />
        <ellipse
          class="hatching"
          :fill="stage.sky"
          :stroke="stage.ink"
          stroke-width="0.9"
          cx="0"
          cy="-5"
          rx="4"
          ry="5.2"
        />
      </g>
    </g>

    <!--
      ⑬''''''''' 아기 공룡.

      알 근처를 종종거린다. 어른 공룡은 판 가운데의 모티프 하나로 족하고,
      바닥에는 작은 것들만 둔다 — 큰 것이 여럿이면 눈이 갈 곳을 잃는다.
    -->
    <g v-if="stage.dinoland" class="hatchlings">
      <g
        v-for="h in scene.hatchlings"
        :key="`ht${h.i}`"
        class="hatchling"
        :style="{
          '--dur': `${h.dur}s`,
          '--delay': `${h.delay}s`,
          '--span': `${h.span}px`,
          '--step': `${h.step}s`,
          '--dir': h.back ? -1 : 1,
        }"
      >
        <g :transform="`translate(${h.x} ${h.y}) scale(${h.sc})`">
          <g class="legs" :stroke="stage.ink" stroke-width="1.5" stroke-linecap="round">
            <path class="leg a" d="M-1.6 3.4 v3.4" />
            <path class="leg b" d="M1.8 3.4 v3.4" />
          </g>
          <!-- 꼬리 -->
          <path
            :fill="stage.motifColor"
            :stroke="stage.ink"
            stroke-width="0.9"
            d="M-4.6 1.6 q-6 0 -9 -4 q5 -0.6 9 1.4 z"
          />
          <!-- 몸과 머리를 한 덩이로. 아기는 목이 짧다 -->
          <path
            :fill="stage.motifColor"
            :stroke="stage.ink"
            stroke-width="0.9"
            d="M-5 1.6 q-1 -6 4 -8 q2 -5 7 -4 q4 1 4 5 q3 1 3 4 q0 4 -6 4 q-8 1 -12 -1 z"
          />
          <!-- 등의 골판 -->
          <path
            :fill="stage.veg2"
            :stroke="stage.ink"
            stroke-width="0.6"
            d="M-3.4 -4 l1.6 -3 l1.6 3 z M0.4 -6 l1.6 -3 l1.6 3 z"
          />
          <circle :fill="stage.ink" cx="7.4" cy="-4.6" r="0.9" />
        </g>
      </g>
    </g>

    <!--
      ⑭'' 전경 고사리.

      풀 대신 고사리다. 잎이 한쪽으로만 갈라져 나가는 깃 모양이라
      풀보다 낮고 넓게 깔린다.
    -->
    <g v-if="stage.dinoland" class="ferns">
      <g
        v-for="(f, i) in scene.ferns"
        :key="`fn${i}`"
        class="fern"
        :style="{ '--sway': `${f.sway}s`, '--delay': `${f.delay}s` }"
        :transform="`translate(${f.x} ${f.y}) scale(${f.lean * f.sc} ${f.sc})`"
      >
        <path
          :stroke="stage.veg"
          stroke-width="1.5"
          fill="none"
          stroke-linecap="round"
          d="M0 0 q2 -8 8 -13"
        />
        <path
          :stroke="stage.veg2"
          stroke-width="1.1"
          fill="none"
          stroke-linecap="round"
          d="M1.4 -4 l-3.6 -2.6 M3 -7 l-3.4 -3 M5 -9.6 l-3 -3.4 M7 -11.6 l-2.4 -3.6"
        />
      </g>
    </g>

    <!--
        ⑬'' 소라 · 조개 · 불가사리.

        가만히 있는 것들이라 자리만 정해 주면 된다.
        기울기를 조금씩 달리 두는 게 전부인데, 그것만으로도
        누가 늘어놓은 게 아니라 파도가 밀어 놓은 것으로 보인다.
      -->
    <g v-if="stage.beach" class="shells">
      <g
        v-for="(h, i) in scene.shells"
        :key="`sh${i}`"
        :transform="`translate(${h.x} ${h.y}) rotate(${h.tilt}) scale(${h.sc})`"
      >
        <!-- 소라 -->
        <template v-if="h.kind === 0">
          <path
            :fill="stage.bloom"
            d="M0 3 C-4.4 3 -5.4 -1.4 -2.6 -3.4 C-0.4 -5 3.2 -4 4.4 -1 C5.2 1 3.2 3 0 3 Z"
          />
          <path
            :stroke="stage.veg"
            fill="none"
            stroke-width="0.7"
            d="M-2.4 2.4 q1.6 -3.6 4.4 -4.6 M-0.4 3 q0.6 -4 3.4 -5"
          />
        </template>
        <!-- 조개 -->
        <path
          v-else-if="h.kind === 1"
          :fill="stage.veg2"
          :stroke="stage.veg"
          stroke-width="0.6"
          d="M-4.6 2.4 A4.6 4.2 0 0 1 4.6 2.4 Z M-2.4 2.4 L-1 -1.6 M0 2.4 L0 -1.9 M2.4 2.4 L1 -1.6"
        />
        <!-- 불가사리 -->
        <path
          v-else
          :fill="stage.motifColor"
          opacity="0.72"
          d="M0 -4.6 L1.4 -1.4 L4.6 -1.1 L2.1 1.1 L2.8 4.3 L0 2.6 L-2.8 4.3 L-2.1 1.1 L-4.6 -1.1 L-1.4 -1.4 Z"
        />
      </g>
    </g>

    <!--
        ⑬''' 꽃게.

        옆으로만 걷는다. 앞으로 걷는 꽃게는 꽃게가 아니다.
        집게발을 번갈아 들었다 놓으면 종종거리는 것으로 보인다.
      -->
    <g v-if="stage.beach" class="crabs">
      <g
        v-for="c in scene.crabs"
        :key="`cr${c.i}`"
        class="crab"
        :style="{
          '--dur': `${c.dur}s`,
          '--delay': `${c.delay}s`,
          '--span': `${c.span}px`,
          '--step': `${c.step}s`,
          '--dir': c.back ? -1 : 1,
        }"
      >
        <g :transform="`translate(${c.x} ${c.y}) scale(${c.sc})`" :fill="stage.motifColor">
          <!-- 다리 여섯 -->
          <g :stroke="stage.motifColor" stroke-width="0.85" fill="none" stroke-linecap="round">
            <path d="M-3.4 1.6 l-2.6 2.4 M-1.2 2.1 l-1.4 2.8 M1.2 2.1 l1.4 2.8 M3.4 1.6 l2.6 2.4" />
          </g>
          <!-- 집게발 -->
          <g class="claw one">
            <path
              d="M-4.2 -0.6 q-2.8 -0.6 -3.6 -2.6 q1.6 -0.6 2.8 0.2 q-1.2 -1.4 -0.4 -2.4 q1.8 1 2.4 3z"
            />
          </g>
          <g class="claw two">
            <path
              d="M4.2 -0.6 q2.8 -0.6 3.6 -2.6 q-1.6 -0.6 -2.8 0.2 q1.2 -1.4 0.4 -2.4 q-1.8 1 -2.4 3z"
            />
          </g>
          <!-- 등딱지 -->
          <ellipse cx="0" cy="0" rx="4.6" ry="3" />
          <circle cx="-1.7" cy="-2.4" r="0.75" fill="#2b2b2f" />
          <circle cx="1.7" cy="-2.4" r="0.75" fill="#2b2b2f" />
        </g>
      </g>
    </g>

    <!--
        ⑬''''' 파라솔.

        모티프 자리(⑦)에 두었더니 바다에 잠겼다. 그 자리는 하늘 다음이라
        뒤에 오는 바다가 기둥을 덮어, 파라솔만 수평선에 떠 있었다.
        모래를 다 그린 다음에 꽂아야 모래에 꽂힌 것이 된다.

        비스듬히 꽂는다. 곧게 세우면 심어 놓은 것 같다.
      -->
    <g v-if="stage.beach" class="parasol">
      <g transform="rotate(-9 640 214)">
        <!-- 자루. 갓 꼭대기까지 올라가야 갓이 얹힌 것으로 보인다 -->
        <path :stroke="stage.veg" stroke-width="2.6" stroke-linecap="round" d="M640 214 V118" />
        <!--
          갓. 아래 가장자리는 물결, 위 테두리는 호.
          중심 (640, 154) 에 반지름 56 × 40 인 반타원이고 꼭짓점은 (640, 114) 다.
        -->
        <path
          :fill="stage.motifColor"
          d="M584 154 q11.2 8 22.4 0 q11.2 8 22.4 0 q11.2 8 22.4 0 q11.2 8 22.4 0 q11.2 8 22.4 0 A56 40 0 0 0 584 154 Z"
        />
        <!--
          흰 널 세 장.

          두 번 어긋났다.
          처음에는 꼭짓점까지 곧은 선으로만 잘랐다. 갓의 바깥 테두리는
          호라서 맨 왼쪽 널의 직선 바깥에 빨간 초승달이 남았다.
          그다음엔 양 끝 널만 호로 닫았더니, 그 둘이 초승달까지 삼켜서
          가운데 널이 얇은 쐐기가 됐다. 널 폭이 들쭉날쭉했다.

          이음선을 갓의 곡면을 따라 휘게 긋는다. 실제 파라솔의 이음선도
          곧지 않다 — 돔을 옆에서 보면 바깥쪽 이음선일수록 크게 휜다.
          그러면 널 다섯이 고르게 갈리고 남는 자리도 없다.

          다섯으로 나눈 건 양 끝이 다 흰색이 되게 하려는 것이다.
          짝수로 나누면 한쪽 끝이 빨강으로 끝나 무늬가 어긋나 보인다.
        -->
        <path fill="#fdfaf2" d="M584 154 q11.2 8 22.4 0 Q619.8 126 640 114 Q606.4 126 584 154 Z" />
        <path
          fill="#fdfaf2"
          d="M628.8 154 q11.2 8 22.4 0 Q646.7 126 640 114 Q633.3 126 628.8 154 Z"
        />
        <path
          fill="#fdfaf2"
          d="M673.6 154 q11.2 8 22.4 0 Q673.6 126 640 114 Q660.2 126 673.6 154 Z"
        />
        <circle :fill="stage.veg" cx="640" cy="114" r="2.6" />
      </g>
    </g>

    <!--
        ⑬'''' 모래 위를 걷는 갈매기.

        갈매기는 나는 시간보다 서 있는 시간이 길다. 물가를 따라
        종종거리다 멈춰 서서 모래를 쪼는 게 실제 해변의 모습이다.
        나는 것만 두면 해변이 아니라 하늘이 된다.
      -->
    <g v-if="stage.beach" class="strollers">
      <g
        v-for="g in scene.strollers"
        :key="`st${g.i}`"
        class="stroller"
        :style="{
          '--dur': `${g.dur}s`,
          '--delay': `${g.delay}s`,
          '--span': `${g.span}px`,
          '--step': `${g.step}s`,
          '--dir': g.back ? -1 : 1,
        }"
      >
        <g :transform="`translate(${g.x} ${g.y}) scale(${g.sc})`">
          <g class="legs" :stroke="stage.motifColor" stroke-width="0.8" stroke-linecap="round">
            <path class="leg a" d="M-0.8 3.2 v3" />
            <path class="leg b" d="M1 3.2 v3" />
          </g>
          <path
            fill="#fdfdfb"
            d="M-5.4 1.6 C-5.4 -1.6 -2.6 -3.4 0.4 -3.4 C3.6 -3.4 5.6 -1.4 5.6 0.6 C5.6 2.6 3 3.8 0 3.8 C-3 3.8 -5.4 3.2 -5.4 1.6 Z"
          />
          <path :fill="stage.veg" opacity="0.5" d="M-5.2 1.4 q3 1.6 6.4 1.2 q-2.6 1.2 -6.4 0.4 z" />
          <circle cx="3.4" cy="-2.6" r="2.5" fill="#fdfdfb" />
          <circle cx="4.2" cy="-3.1" r="0.62" fill="#2b2b2f" />
          <path :fill="stage.bloom" d="M5.6 -2.6 l3 0.8 l-3 0.9z" />
        </g>
      </g>
    </g>

    <!-- ⑬' 산호. 지면 다음에 얹는다 — 먼저 그렸더니 바닥에 덮여 하나도 안 보였다 -->
    <g v-if="stage.under" class="corals">
      <g v-for="(c, i) in scene.corals" :key="`c${i}`">
        <path
          v-for="a in c.arms"
          :key="`ca${a}`"
          :d="`M${c.x} ${c.y + 8} q${(a - c.arms / 2) * 5} ${-c.r * 0.7} ${(a - c.arms / 2) * 8} ${-c.r}`"
          :stroke="c.lit ? stage.bloom : stage.veg"
          :opacity="c.lit ? 0.75 : 1"
        />
      </g>
    </g>

    <!--
        ⑭' 해초. 바닥에 뿌리를 두고 물살에 눕는다.

        풀은 바람에 떨듯 흔들리지만 해초는 물에 밀려 천천히 눕는다.
        같은 흔들림을 두 배 느리게, 두 배 크게 준다. 그 차이가 물이다.
      -->
    <g v-if="stage.under" class="kelp" :stroke="stage.veg2">
      <path
        v-for="(k, i) in scene.kelp"
        :key="`k${i}`"
        :d="`M${k.x} 262 c${k.lean * 0.5} ${-k.h * 0.32} ${k.lean * 1.7} ${-k.h * 0.44} ${k.lean * 1.05} ${-k.h * 0.72} c${-k.lean * 1.1} ${-k.h * 0.2} ${k.lean * 0.5} ${-k.h * 0.2} ${k.lean * 1.7} ${-k.h * 0.3}`"
        :style="{
          '--sway': `${k.sway}s`,
          '--delay': `${k.delay}s`,
          '--w': `${k.w}`,
        }"
      />
    </g>

    <!-- ⑭ 전경 풀. 바람에 흔들린다 -->
    <g v-if="!stage.under" class="grass" :stroke="stage.veg">
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

    <!--
        ⑮' 마린 스노우.
        심해를 심해로 보이게 하는 건 사실 이것 하나다.
        물이 맑으면 그냥 파란 방이고, 무언가 천천히 가라앉고 있어야 깊이가 생긴다.
      -->
    <g v-if="stage.under" class="marine" fill="#dff3f0">
      <circle
        v-for="(m, i) in scene.marine"
        :key="`ms${i}`"
        :cx="m.x"
        :cy="m.y"
        :r="m.r"
        :style="{
          '--dur': `${m.dur}s`,
          '--delay': `${m.delay}s`,
          '--drift': `${m.drift}px`,
          '--o': m.o,
        }"
      />
    </g>

    <!-- ⑮'' 스스로 빛나는 것들. 깊은 곳의 빛은 위에서 오지 않는다 -->
    <g v-if="stage.under" class="glows" :fill="stage.bloom">
      <circle
        v-for="(g, i) in scene.glows"
        :key="`gl${i}`"
        :cx="g.x"
        :cy="g.y"
        :r="g.r"
        :style="{ '--dur': `${g.dur}s`, '--delay': `${g.delay}s` }"
      />
    </g>

    <!--
        ⑬'''''' 나는 갈매기.

        새 떼(birds)는 한 무리가 대열을 지어 지나간다. 갈매기는 그렇게
        날지 않는다 — 저마다 다른 높이에서 각자 오르내린다.
        그래서 한 마리씩 다른 궤도와 박자를 준다.

        바다보다 나중에 그린다. 하늘 다음 자리(⑥)에 두었더니 뒤에 오는
        바다가 갈매기를 덮어서, 물 위를 나는 동안에는 통째로 사라졌다.
        하늘을 나는 것은 하늘보다 앞이지만 바다보다도 앞이다.

        날개는 갈매기의 전부다. 몸통을 그리지 않고 획 하나로 그린다.
        멀리서 보는 갈매기는 실제로 그렇게만 보인다.
      -->
    <g v-if="stage.beach" class="gulls" fill="none" stroke-linecap="round">
      <g
        v-for="g in scene.gulls"
        :key="`gl${g.i}`"
        class="gull"
        :class="{ back: g.back }"
        :style="{
          '--dur': `${g.dur}s`,
          '--delay': `${g.delay}s`,
          '--rise': `${g.rise}px`,
        }"
      >
        <g :transform="`translate(0 ${g.y}) scale(${g.back ? -g.sc : g.sc} ${g.sc})`">
          <!--
              날개는 갈매기의 전부다. 몸통을 그리지 않고 획 하나로 그린다.
              멀리서 보는 갈매기는 실제로 그렇게만 보인다.

              희게 그린다. 바다색(near)으로 그렸더니 물 위를 날 때
              바다에 묻혀 한 마리도 안 보였다. 갈매기는 원래 희다.
            -->
          <path
            class="wing"
            stroke="#fbfcfd"
            :stroke-width="2.1 / g.sc"
            d="M-9 0 q4.6 -5.2 9 -0.6 q4.4 -4.6 9 0.6"
          />
          <path
            class="wing tip"
            :stroke="stage.near"
            :stroke-width="0.8 / g.sc"
            opacity="0.5"
            d="M-9 0 q4.6 -5.2 9 -0.6 q4.4 -4.6 9 0.6"
          />
        </g>
      </g>
    </g>

    <!--
      ⑥'''' 먼 화산.

      공룡 판을 공룡 판으로 만드는 건 화산이다. 산 두 개를 세우고
      꼭대기에서 연기가 천천히 오른다. 터지지는 않는다 —
      터지면 사건이 되고, 사건이 있으면 판이 아니라 장면이 된다.
    -->
    <g v-if="stage.dinoland" class="volcanoes">
      <g v-for="v in scene.volcanoes" :key="`vc${v.i}`">
        <path
          :fill="stage.far"
          :d="`M${v.x - v.w / 2} ${v.base} L${v.x - v.w * 0.16} ${v.base - v.h}
               q${v.w * 0.16} ${-6} ${v.w * 0.32} 0 L${v.x + v.w / 2} ${v.base} Z`"
        />
        <!--
          분화구.

          두 번 고쳤다. 산 위에 시안 호를 그었더니 산에 얹힌 띠였고,
          정상 폭만큼 넓은 그릇을 그렸더니 산 위에 접시를 올려 둔 꼴이었다.

          분화구는 정상에 난 구멍이라 정상보다 훨씬 좁다.
          좁게 파고 그 안이 달아오르게 한다.
        -->
        <ellipse :fill="stage.near" :cx="v.x" :cy="v.base - v.h + 1" :rx="v.w * 0.115" ry="3.4" />
        <ellipse
          class="ember"
          :fill="stage.accent"
          :cx="v.x"
          :cy="v.base - v.h + 1"
          :rx="v.w * 0.075"
          ry="2"
          :style="{ '--dur': `${v.dur * 0.4}s`, '--delay': `${v.delay}s` }"
        />

        <!--
          연기.

          자리는 바깥 묶음이 잡고 움직임은 안쪽 묶음이 맡는다.
          한 묶음에 둘 다 두었더니 CSS transform 이 SVG transform 속성을
          덮어써서, 연기가 화산 꼭대기가 아니라 화폭 왼쪽 끝에 피어올랐다.
        -->
        <g :transform="`translate(${v.x} ${v.base - v.h - 4})`">
          <g class="fume" :style="{ '--dur': `${v.dur}s`, '--delay': `${v.delay}s` }">
            <circle :fill="stage.haze" cx="0" cy="0" r="7" opacity="0.75" />
            <circle :fill="stage.haze" cx="5" cy="-11" r="9" opacity="0.6" />
            <circle :fill="stage.haze" cx="-3" cy="-24" r="11" opacity="0.44" />
            <circle :fill="stage.haze" cx="6" cy="-38" r="13" opacity="0.3" />
          </g>

          <!--
            분출. 한 바퀴의 대부분은 아무 일도 없다.

            터질 때는 세 가지가 한꺼번에 일어난다 —
            분화구가 밝아지고, 용암이 튀어 오르고, 재가 크게 부푼다.
            셋이 조금씩 어긋난 박자로 와야 터지는 것으로 보인다.
            동시에 나타났다 사라지면 그건 깜빡임이다.
          -->
          <g class="blast" :style="{ '--dur': `${v.blastDur}s`, '--delay': `${v.blastDelay}s` }">
            <g class="ash">
              <circle :fill="stage.haze" cx="0" cy="-6" r="13" opacity="0.7" />
              <circle :fill="stage.haze" cx="11" cy="-20" r="15" opacity="0.55" />
              <circle :fill="stage.haze" cx="-9" cy="-34" r="17" opacity="0.4" />
            </g>
            <g class="lava" :fill="stage.accent">
              <circle
                v-for="(l, k) in v.lava"
                :key="`lv${k}`"
                :r="l.r"
                :style="{ '--dx': `${l.dx}px`, '--dy': `${l.dy}px`, '--ld': l.d }"
              />
            </g>
            <ellipse class="flare" :fill="stage.accent" cx="0" cy="2" :rx="v.w * 0.16" ry="4" />
          </g>
        </g>
      </g>
    </g>

    <!--
      ⑥''''' 익룡.

      새와 다르게 그린다. 날개가 몸보다 훨씬 길고, 끝이 뾰족하고,
      뒤통수에 볏이 하나 솟는다. 그 볏 하나가 새와 익룡을 가른다.
    -->
    <g v-if="stage.dinoland" class="pteros">
      <g
        v-for="p in scene.pterosaurs"
        :key="`pt${p.i}`"
        class="ptero"
        :class="{ back: p.back }"
        :style="{ '--dur': `${p.dur}s`, '--delay': `${p.delay}s`, '--rise': `${p.rise}px` }"
      >
        <g :transform="`translate(0 ${p.y}) scale(${p.back ? -p.sc : p.sc} ${p.sc})`">
          <g class="wings" :fill="stage.near" :stroke="stage.ink" stroke-width="0.9">
            <path d="M0 0 C-6 -5 -14 -7 -21 -5 C-14 -1 -7 1 0 1 Z" />
            <path d="M0 0 C6 -5 14 -7 21 -5 C14 -1 7 1 0 1 Z" />
          </g>
          <path :fill="stage.ink" d="M-2 -1 q2 -3 5 -3 q3 0 4 2 l4 -1 l-4 3 q-4 2 -9 1 z" />
        </g>
      </g>
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
        <path
          d="M520 96c22-30 44-34 62-12c18-22 40-18 62 12c-24-10-44-4-62 12c-18-16-38-22-62-12z"
        />
      </g>

      <!--
      ⑬'''''''''' 공룡 무리.

      큰 공룡 하나와 아기 둘이 함께 판을 가로질러 간다.
      아주 느리다 — 판 하나 건너는 데 이 분 반이 걸린다.
      빨리 가면 지나가는 것이 되고, 지나가는 것은 배경이 아니라 사건이다.

      셋을 한 묶음으로 옮긴다. 따로 움직이면 앞서거니 뒤서거니 하다가
      결국 흩어져서, 어미와 새끼가 아니라 우연히 같은 방향으로 가는
      남남이 된다. 무리는 간격이 유지되어야 무리다.

      땅을 다 그린 뒤에 세운다. 모티프 자리(⑦)에 두었더니 뒤에 오는
      언덕과 지면이 몸통을 덮어 머리와 목만 하늘에 떠 있었다.
    -->
      <g v-if="stage.dinoland" class="herd">
        <g class="pace">
          <g transform="translate(0 216)">
            <!--
            어미. 목이 길고 등에 골판이 서고 배가 밝다.

            참조한 표지의 공룡은 실루엣이 아니라 만화체 캐릭터다 —
            굵은 외곽선이 있고, 눈이 있고, 웃는다.
            열세 장 중 유일하게 '귀여운' 표지라고 적힌 이유가 그것이다.
          -->
            <!--
              어미.

              부위마다 선을 두르니 조립한 것처럼 보였다. 목과 몸 사이,
              다리와 배 사이에 선이 그어져서 한 마리가 아니라
              여러 조각을 붙여 놓은 그림이 됐다.

              그래서 두 번 그린다.
                edge  모든 부위를 외곽색으로 채우고 굵게 두른다.
                      겹친 자리가 하나로 뭉쳐 실루엣이 된다
                fill  같은 부위를 제 색으로 다시 덮는다. 선은 없다

              바깥에는 선이 남고 안쪽에는 남지 않는다.
              캐릭터의 흰 테두리와 같은 방식이다.

              얼굴선과 골판의 시안선은 fill 겹에만 있다.
              그 둘은 조립선이 아니라 그리려던 무늬다.
            -->
            <g class="bigdino" :style="{ '--ink': stage.ink }">
              <g v-for="pass in ['edge', 'fill']" :key="pass" :class="pass">
                <!-- 꼬리. 몸 뒤로 눕고 끝으로 갈수록 가늘어진다 -->
                <path
                  class="tail"
                  :fill="stage.motifColor"
                  d="M-30 -32 C-54 -32 -78 -22 -98 -6 C-74 -12 -50 -14 -30 -14 Z"
                />
                <!-- 뒷다리. 몸에 가려 반만 보이지만 있어야 걷는 것으로 보인다 -->
                <path
                  class="leg back"
                  :fill="stage.veg"
                  d="M-16 -28 q12 0 14 14 l-1 16 h-16 l1 -16 z"
                />
                <path
                  :fill="stage.motifColor"
                  d="M-36 -22 q-6 -28 20 -38 q22 -8 40 2 q14 8 14 22 q0 16 -18 20 q-30 6 -56 -6 z"
                />
                <!-- 앞다리. 뒷다리보다 조금 앞이고 조금 짧다 -->
                <path
                  class="leg fore"
                  :fill="stage.veg"
                  d="M18 -26 q12 0 13 13 l-1 15 h-15 l1 -15 z"
                />
                <!--
                  배. 아래쪽에 붙인다.
                  가운데에 두었더니 몸을 가로지르는 밝은 얼룩이 됐다.
                  배는 배가 있을 자리에 있어야 배로 보인다.
                -->
                <path :fill="stage.veg2" d="M-30 -14 q28 10 54 0 q-26 10 -54 0 z" />
                <g class="neck">
                  <path
                    :fill="stage.motifColor"
                    d="M24 -52 q6 -30 26 -44 q16 -11 30 -2 q12 8 8 22 q-4 13 -20 15 q-14 2 -20 14 z"
                  />
                  <path
                    :fill="stage.motifColor"
                    d="M54 -96 q-4 -14 10 -20 q16 -6 26 4 q9 8 4 18 q-6 11 -20 11 q-16 0 -20 -13 z"
                  />
                  <!-- 얼굴. edge 겹에서는 실루엣에 묻히고 fill 겹에서만 드러난다 -->
                  <g class="face">
                    <!--
                      눈. 흰자를 키우고 눈동자를 가운데로 옮겼다.
                      전에는 눈동자가 흰자를 거의 덮어서, 남은 흰자가
                      한쪽에 초승달로 걸려 눈을 감은 것처럼 보였다.
                    -->
                    <circle fill="#ffffff" cx="72" cy="-92.5" r="8.4" />
                    <circle :fill="stage.ink" cx="73" cy="-92" r="4.2" />
                    <circle fill="#ffffff" cx="75" cy="-94.5" r="1.6" />
                    <path
                      :stroke="stage.ink"
                      stroke-width="2.2"
                      fill="none"
                      stroke-linecap="round"
                      d="M86 -84 q-8 6 -16 2"
                    />
                    <circle :fill="stage.ink" cx="88" cy="-96" r="1.6" />
                  </g>
                </g>
                <!-- 등의 골판. 이 판의 보색이 여기서 한 번 더 나온다 -->
                <g class="plates" :fill="stage.veg2" :stroke="stage.accent" stroke-width="2">
                  <path d="M-18 -58 l6 -16 l9 14 z" />
                  <path d="M2 -64 l6 -17 l9 15 z" />
                  <path d="M22 -64 l5 -15 l9 13 z" />
                </g>
              </g>
            </g>

            <!-- 따라가는 아기 둘. 어미보다 반 박자 빠르게 종종거린다 -->
            <!--
            따라가는 아기 둘. 어미와 같은 방식으로 실루엣에만 선을 두른다.
            어미만 매끈하고 아기는 조각조각이면 같은 종으로 안 보인다.
          -->
            <g
              v-for="t in [
                { x: -104, y: 4, sc: 0.9, step: 0.5 },
                { x: -150, y: 2, sc: 0.74, step: 0.42 },
              ]"
              :key="`tot${t.x}`"
              class="tot"
              :style="{ '--step': `${t.step}s`, '--ink': stage.ink }"
              :transform="`translate(${t.x} ${t.y}) scale(${t.sc})`"
            >
              <g v-for="pass in ['edge', 'fill']" :key="pass" :class="pass">
                <g class="legs" :stroke="stage.ink" stroke-width="1.6" stroke-linecap="round">
                  <path class="leg a" d="M-2 4 v4.4" />
                  <path class="leg b" d="M2.4 4 v4.4" />
                </g>
                <path :fill="stage.motifColor" d="M-6 2 q-8 0 -12 -5 q7 -1 12 2 z" />
                <path
                  :fill="stage.motifColor"
                  d="M-6.5 2 q-1.4 -8 5 -10.6 q2.6 -6.4 9 -5 q5 1.2 5 6.4 q4 1.4 4 5.2 q0 5 -8 5.2 q-10.4 1.2 -15 -1.2 z"
                />
                <g class="plates" :fill="stage.veg2" :stroke="stage.accent" stroke-width="0.8">
                  <path d="M-4.4 -5.4 l2 -3.8 l2 3.8 z" />
                  <path d="M0.6 -8 l2 -3.8 l2 3.8 z" />
                </g>
                <g class="face">
                  <circle fill="#ffffff" cx="9.2" cy="-6" r="2.2" />
                  <circle :fill="stage.ink" cx="9.8" cy="-5.8" r="1.1" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>

      <!--
      ⑮''' 토성.

      참조한 표지 우하단에 작은 토성 아이콘이 하나 있다.
      공룡과 아무 상관이 없는데 거기 있고, 그 뜬금없음이 이 표지를
      어린이 스티커북처럼 보이게 하는 데 한몫한다. 그대로 둔다.

      좌하단 라벨과 우하단 서명이 쓰는 자리를 피해 조금 위에 앉힌다.
    -->
      <g v-if="stage.saturn" class="saturn">
        <circle
          :fill="stage.accent"
          :stroke="stage.ink"
          stroke-width="1.6"
          cx="742"
          cy="52"
          r="11"
        />
        <ellipse
          :stroke="stage.ink"
          stroke-width="1.6"
          fill="none"
          cx="742"
          cy="52"
          rx="19"
          ry="5.4"
          transform="rotate(-18 742 52)"
        />
        <circle :fill="stage.sky" stroke="none" cx="738" cy="48" r="2.6" opacity="0.7" />
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
/* 기포는 위로만 간다. 물속에서 아래로 떠다니는 것은 없다 */
.motes.bubble circle {
  animation-name: rise;
  fill: none;
  stroke: currentColor;
  stroke-width: 0.8;
}

/* ── 바닷가 ───────────────────────────────────────── */

/*
 * 파도.
 *
 * 밀려오면서 굵어지고 진해지다가 물가에서 스러진다.
 * 부서지는 게 아니라 얇아지며 사라진다 — 실제로 잔파도는 그렇다.
 * 저마다 다른 박자라야 바다가 숨 쉬는 것으로 보인다.
 * 다 같이 밀려오면 그건 파도가 아니라 줄무늬다.
 */
.surf path {
  opacity: 0;
  animation: roll var(--dur) ease-out var(--delay) infinite;
}
@keyframes roll {
  0% {
    opacity: 0;
    transform: translateY(-10px) scaleX(0.96);
  }
  18% {
    opacity: calc(var(--o) * 0.7);
  }
  62% {
    opacity: var(--o);
    transform: translateY(6px) scaleX(1);
  }
  100% {
    opacity: 0;
    transform: translateY(15px) scaleX(1.04);
  }
}

/*
 * 나는 갈매기.
 * 가로로 지나가면서 오르내리고, 그러면서 날개를 접었다 편다.
 * 셋이 따로 놀아야 한 마리가 제 뜻대로 나는 것으로 보인다.
 */
/*
 * 방향은 되감기로 뒤집는다.
 *
 * 처음에는 시작점과 끝점에 --dir 을 곱했다. 그랬더니 반대로 나는
 * 갈매기는 +120 에서 시작해 -920 으로 가서, 한 바퀴의 대부분을
 * 화면 밖에서 보냈다. 넷 중 둘이 사실상 없는 셈이었다.
 *
 * 궤도는 하나로 두고 재생만 거꾸로 돌린다. 몸은 scaleX 로 뒤집어
 * 가는 쪽을 보게 한다.
 */
.gull {
  animation:
    glide var(--dur) linear var(--delay) infinite,
    lift calc(var(--dur) / 7) ease-in-out var(--delay) infinite alternate;
}
.gull.back {
  animation-direction: reverse, alternate;
}
.gull .wing {
  animation: flap 1.15s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}
@keyframes glide {
  from {
    transform: translateX(-120px);
  }
  to {
    transform: translateX(920px);
  }
}
@keyframes lift {
  from {
    translate: 0 calc(var(--rise) * -0.5);
  }
  to {
    translate: 0 calc(var(--rise) * 0.5);
  }
}
@keyframes flap {
  0%,
  100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.4);
  }
}

/*
 * 돌고래.
 *
 * 한 번 뛰는 데 전체의 십 분의 일도 안 쓴다. 자주 뛰면 놀랍지 않다.
 *
 * 포물선은 각도로 만든다. 솟을 때 주둥이가 하늘을 보고, 꼭대기에서
 * 수평이 되었다가, 내려올 때 주둥이가 물을 향한다.
 * 각도 없이 위아래로만 움직이면 뛰는 게 아니라 떠오르는 것이 된다.
 *
 * 몸과 물보라는 같은 시계를 쓰되 서로 다른 순간에 나타난다.
 * 물보라는 물을 뚫는 두 순간 — 나올 때와 들어갈 때 — 에만 있다.
 * 공중에 떠 있는 동안에도 물이 튀면 물이 따라 올라간 꼴이 된다.
 */
.dolphin .body {
  animation: leap var(--dur) ease-in-out var(--delay) infinite;
  transform-box: view-box;
}
.dolphin .splash {
  animation: burst var(--dur) linear var(--delay) infinite;
  transform-box: view-box;
}
@keyframes leap {
  0%,
  84%,
  100% {
    translate: 0 18px;
    rotate: 0deg;
    opacity: 0;
  }
  86% {
    translate: 0 6px;
    rotate: -34deg;
    opacity: 1;
  }
  89% {
    translate: 6px -10px;
    rotate: -18deg;
    opacity: 1;
  }
  92% {
    translate: 12px -17px;
    rotate: 2deg;
    opacity: 1;
  }
  95% {
    translate: 18px -10px;
    rotate: 24deg;
    opacity: 1;
  }
  97.5% {
    translate: 22px 6px;
    rotate: 42deg;
    opacity: 1;
  }
  99% {
    translate: 24px 16px;
    rotate: 48deg;
    opacity: 0;
  }
}
@keyframes burst {
  0%,
  83%,
  100% {
    opacity: 0;
    scale: 0.6 0.4;
  }
  85.5% {
    opacity: 0.85;
    scale: 1 1;
  }
  88% {
    opacity: 0;
    scale: 1.25 1.15;
  }
  96.5% {
    opacity: 0;
    scale: 0.6 0.4;
    translate: 22px 0;
  }
  98% {
    opacity: 0.85;
    scale: 1 1;
    translate: 22px 0;
  }
  100% {
    opacity: 0;
    scale: 1.3 1.2;
    translate: 22px 0;
  }
}

/* ── 공룡 판 ─────────────────────────────────────── */

/* 화산 연기. 오르면서 퍼지고 옅어진다 */
.fume {
  animation: fume var(--dur) linear var(--delay) infinite;
}
@keyframes fume {
  0% {
    opacity: 0;
    transform: translateY(6px) scale(0.7);
  }
  20% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translateY(-46px) scale(1.5);
  }
}

/*
 * 분화구가 달아오르는 것.
 * 늘 조금씩 밝아졌다 사그라든다. 터지지 않는 동안에도 아래에서
 * 무언가 끓고 있다는 표시라, 이게 있어야 산이 살아 있는 산이 된다.
 */
.ember {
  animation: simmer var(--dur) ease-in-out var(--delay) infinite;
}
@keyframes simmer {
  0%,
  100% {
    opacity: 0.25;
    transform: scaleY(0.7);
  }
  50% {
    opacity: 0.75;
    transform: scaleY(1.15);
  }
}

/*
 * 분출.
 *
 * 한 바퀴의 90% 는 아무 일도 없다. 자주 터지면 놀랍지 않을뿐더러
 * 이 판이 조용히 지나가는 배경이 아니게 된다.
 *
 * 터질 때는 세 가지가 조금씩 어긋난 박자로 온다 —
 * 분화구가 번쩍하고, 용암이 튀어 오르고, 재가 크게 부푼다.
 * 동시에 나타났다 사라지면 그건 터지는 게 아니라 깜빡임이다.
 */
.blast .flare {
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: flare var(--dur) ease-out var(--delay) infinite;
}
.blast .lava circle {
  opacity: 0;
  animation: fling var(--dur) ease-out calc(var(--delay) + var(--ld) * 1s) infinite;
}
.blast .ash {
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: ash var(--dur) ease-out var(--delay) infinite;
}
@keyframes flare {
  0%,
  90%,
  100% {
    opacity: 0;
    transform: scaleY(0.4);
  }
  91.5% {
    opacity: 0.95;
    transform: scaleY(2.6);
  }
  94% {
    opacity: 0;
    transform: scaleY(1);
  }
}
@keyframes fling {
  0%,
  91%,
  100% {
    opacity: 0;
    transform: translate(0, 0);
  }
  92% {
    opacity: 1;
    transform: translate(calc(var(--dx) * 0.4), calc(var(--dy) * 0.7));
  }
  95% {
    opacity: 1;
    transform: translate(var(--dx), var(--dy));
  }
  98% {
    opacity: 0;
    transform: translate(calc(var(--dx) * 1.3), 10px);
  }
}
@keyframes ash {
  0%,
  91%,
  100% {
    opacity: 0;
    transform: translateY(8px) scale(0.4);
  }
  93% {
    opacity: 0.85;
    transform: translateY(-4px) scale(0.9);
  }
  100% {
    opacity: 0;
    transform: translateY(-54px) scale(1.9);
  }
}

/*
 * 익룡.
 * 갈매기보다 훨씬 느리게 난다. 날개가 길어서 한 번 젓는 데도 오래 걸린다.
 */
.ptero {
  animation:
    soar var(--dur) linear var(--delay) infinite,
    lift calc(var(--dur) / 6) ease-in-out var(--delay) infinite alternate;
}
.ptero.back {
  animation-direction: reverse, alternate;
}
.ptero .wings {
  animation: beat 2.1s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}
@keyframes soar {
  from {
    transform: translateX(-140px);
  }
  to {
    transform: translateX(940px);
  }
}
@keyframes beat {
  0%,
  100% {
    transform: scaleY(1) translateY(0);
  }
  50% {
    transform: scaleY(0.35) translateY(1.5px);
  }
}

/* 소철과 고사리. 바람에 아주 천천히 눕는다 */
.cycad,
.fern {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: frond var(--sway) ease-in-out var(--delay) infinite alternate;
}
@keyframes frond {
  from {
    rotate: -2.5deg;
  }
  to {
    rotate: 2.5deg;
  }
}

/*
 * 알 하나만 아주 가끔 흔들린다.
 * 한 바퀴의 대부분은 가만히 있다. 계속 흔들리면 안에 있는 것이
 * 나오려는 게 아니라 그냥 흔들리는 알이 된다.
 */
.nest .hatching {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: stir 9s ease-in-out infinite;
}
@keyframes stir {
  0%,
  72%,
  100% {
    rotate: 0deg;
  }
  76% {
    rotate: -7deg;
  }
  80% {
    rotate: 6deg;
  }
  84% {
    rotate: -4deg;
  }
  88% {
    rotate: 2deg;
  }
}

/*
 * 공룡 무리.
 *
 * 판 하나 건너는 데 이 분 반. 빨리 가면 지나가는 것이 되고,
 * 지나가는 것은 배경이 아니라 사건이다.
 * 끝까지 가면 반대쪽에서 다시 들어온다 — 한 무리가 계속 도는 셈인데,
 * 이 분 반이면 같은 무리가 두 번 지나가는 걸 알아채기 어렵다.
 */
.herd .pace {
  /*
   * 음수 지연으로 중간부터 시작한다.
   * 0 초부터 돌리면 무리가 화면 밖 왼쪽에서 출발해서, 판을 처음 열었을 때
   * 이십 초 넘게 아무도 없는 벌판만 보인다.
   */
  animation: trek 150s linear -46s infinite;
}
@keyframes trek {
  from {
    transform: translateX(-190px);
  }
  to {
    transform: translateX(990px);
  }
}

/*
 * 실루엣에만 선을 두른다.
 *
 * edge 겹은 모든 부위를 외곽색으로 채우고 굵게 두른다. 부위끼리
 * 겹친 자리가 하나로 뭉쳐 한 덩이 실루엣이 된다.
 * fill 겹은 같은 부위를 제 색으로 덮는다. 선은 없다.
 * 그러면 바깥에는 선이 남고 안쪽에는 남지 않는다.
 *
 * 두 겹은 같은 클래스를 달고 있어서 걸음 애니메이션도 똑같이 받는다.
 * 따로 맞출 필요가 없다.
 */
.bigdino .edge :is(path, circle, ellipse) {
  fill: var(--ink);
  stroke: var(--ink);
  stroke-width: 5.4;
  stroke-linejoin: round;
  stroke-linecap: round;
}
/* 얼굴은 실루엣에 아무것도 더하지 않는다. edge 에서는 없는 셈 친다 */
.bigdino .edge .face,
.tot .edge .face {
  display: none;
}

/* 아기도 같은 방식. 몸이 작으니 테두리도 얇다 */
.tot .edge :is(path, circle) {
  fill: var(--ink);
  stroke: var(--ink);
  stroke-width: 2.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}

/*
 * 어미의 걸음.
 *
 * 다리 둘이 번갈아 앞뒤로 흔들리고, 그에 맞춰 몸이 아주 조금 오르내린다.
 * 꼬리는 다리와 반대로 흔들린다 — 그래야 균형을 잡는 것으로 보인다.
 * 목은 한 박자 늦게 따라온다. 큰 짐승은 목이 몸을 따라 흔들린다.
 */
.bigdino .leg {
  transform-box: fill-box;
  transform-origin: top center;
}
.bigdino .leg.back {
  animation: stride 2.4s ease-in-out infinite;
}
.bigdino .leg.fore {
  animation: stride 2.4s ease-in-out -1.2s infinite;
}
.bigdino .tail {
  transform-box: fill-box;
  transform-origin: right center;
  animation: tailsway 2.4s ease-in-out -1.2s infinite;
}
.bigdino .neck {
  transform-box: fill-box;
  transform-origin: left bottom;
  animation: neckbob 2.4s ease-in-out -0.6s infinite;
}
.bigdino {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: lumber 2.4s ease-in-out infinite;
}
@keyframes stride {
  0%,
  100% {
    rotate: 13deg;
  }
  50% {
    rotate: -13deg;
  }
}
@keyframes tailsway {
  0%,
  100% {
    rotate: -4deg;
  }
  50% {
    rotate: 4deg;
  }
}
@keyframes neckbob {
  0%,
  100% {
    rotate: -1.6deg;
  }
  50% {
    rotate: 1.6deg;
  }
}
@keyframes lumber {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -2px;
  }
}

/* 따라가는 아기. 어미보다 반 박자 빠르게 종종거린다 */
.tot .leg {
  transform-origin: top center;
  transform-box: fill-box;
}
.tot .leg.a {
  animation: peg var(--step) ease-in-out infinite;
}
.tot .leg.b {
  animation: peg var(--step) ease-in-out calc(var(--step) / -2) infinite;
}
.tot {
  animation: toddle calc(var(--step) * 2) ease-in-out infinite;
}
@keyframes toddle {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -1.2px;
  }
}

/* 아기 공룡. 좁은 자리를 종종거린다 */
.hatchling {
  animation: patrol var(--dur) ease-in-out var(--delay) infinite alternate;
}
.hatchling .leg {
  transform-origin: top center;
  transform-box: fill-box;
}
.hatchling .leg.a {
  animation: peg var(--step) ease-in-out infinite;
}
.hatchling .leg.b {
  animation: peg var(--step) ease-in-out calc(var(--step) / -2) infinite;
}

/* 토성은 아주 느리게 기운다. 아이콘이 살아 있다는 표시만 */
.saturn {
  transform-box: view-box;
  transform-origin: 742px 52px;
  animation: tilt 14s ease-in-out infinite;
}
@keyframes tilt {
  0%,
  100% {
    rotate: -3deg;
  }
  50% {
    rotate: 3deg;
  }
}

/*
 * 모래를 걷는 갈매기와 꽃게.
 *
 * 둘 다 좁은 자리를 오간다. 판을 가로지르게 두면 물가를 따라
 * 산책하는 게 아니라 화면을 건너가는 것이 된다.
 */
.stroller,
.crab {
  animation: patrol var(--dur) ease-in-out var(--delay) infinite alternate;
}
@keyframes patrol {
  from {
    transform: translateX(calc(var(--span) * -0.5 * var(--dir))) scaleX(var(--dir));
  }
  to {
    transform: translateX(calc(var(--span) * 0.5 * var(--dir))) scaleX(var(--dir));
  }
}

/* 갈매기 다리는 번갈아. 종종거리는 박자가 몸보다 빨라야 걷는 것으로 보인다 */
.stroller .leg.a {
  animation: peg var(--step) ease-in-out infinite;
}
.stroller .leg.b {
  animation: peg var(--step) ease-in-out calc(var(--step) / -2) infinite;
}
@keyframes peg {
  0%,
  100% {
    transform: rotate(-13deg);
  }
  50% {
    transform: rotate(13deg);
  }
}
.stroller .leg {
  transform-origin: top center;
  transform-box: fill-box;
}

/* 꽃게는 집게발을 번갈아 든다 */
.crab .claw {
  transform-origin: center;
  transform-box: fill-box;
}
.crab .claw.one {
  animation: pinch var(--step) ease-in-out infinite;
}
.crab .claw.two {
  animation: pinch var(--step) ease-in-out calc(var(--step) / -2) infinite;
}
@keyframes pinch {
  0%,
  100% {
    transform: rotate(-9deg) translateY(0.3px);
  }
  50% {
    transform: rotate(9deg) translateY(-0.4px);
  }
}

/* 파라솔은 바람에 아주 조금 흔들린다 */
.parasol {
  animation: sunshade 6.5s ease-in-out infinite;
  transform-origin: 640px 214px;
  transform-box: view-box;
}
@keyframes sunshade {
  0%,
  100% {
    transform: rotate(-0.8deg);
  }
  50% {
    transform: rotate(0.8deg);
  }
}

/* ── 물속 ─────────────────────────────────────────── */

/*
 * 수면의 일렁임.
 * 물은 투명해서 그 자체로는 안 보이고 빛이 지나갈 때만 보인다.
 * 세로로 늘어진 빛의 결이 좌우로 아주 느리게 미끄러진다.
 */
.surface path {
  fill: none;
  stroke-width: 2.3;
  stroke-linecap: round;
  opacity: var(--o);
  animation: slide var(--dur) ease-in-out var(--delay) infinite alternate;
}
@keyframes slide {
  from {
    transform: translateX(-46px) scaleY(0.88);
  }
  to {
    transform: translateX(46px) scaleY(1.12);
  }
}

/* 물고기 떼. 한 방향으로 천천히 흐르다 판을 벗어나면 되돌아온다 */
.fish {
  animation: swimBy var(--dur) linear var(--delay) infinite;
}
.school.far .fish {
  opacity: 0.5;
}
@keyframes swimBy {
  from {
    transform: translateX(calc(-260px * var(--dir)));
  }
  to {
    transform: translateX(calc(260px * var(--dir)));
  }
}

/*
 * 해파리.
 * 갓을 오므리면 위로 밀리고, 펴면서 가라앉는다.
 * 미는 순간과 뜨는 순간을 어긋나게 둬야 헤엄치는 것으로 보인다.
 */
.jelly {
  animation: pulse var(--dur) ease-in-out var(--delay) infinite;
}
.jelly .bell {
  opacity: 0.5;
}
.jelly .arms {
  fill: none;
  stroke-width: 1.2;
  stroke-linecap: round;
  opacity: 0.45;
}
@keyframes pulse {
  0%,
  100% {
    transform: translateY(0) scale(1, 1);
  }
  22% {
    transform: translateY(calc(var(--rise) * -0.55)) scale(0.86, 1.14);
  }
  46% {
    transform: translateY(calc(var(--rise) * -1)) scale(1.1, 0.9);
  }
  75% {
    transform: translateY(calc(var(--rise) * -0.4)) scale(1, 1);
  }
}

/* 큰 해파리도 같은 박자로 숨 쉰다. 다만 훨씬 느리다 */
.bigjelly {
  animation: pulse 11s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
  --rise: 16px;
}
.bigjelly .bell {
  opacity: 0.42;
}

/* 산호 */
.corals path {
  fill: none;
  stroke-width: 3.2;
  stroke-linecap: round;
}

/* 해초. 풀보다 두껍고 두 배 느리게 눕는다 */
.kelp path {
  fill: none;
  stroke-width: calc(var(--w) * 1px);
  stroke-linecap: round;
  opacity: 0.8;
  transform-origin: center bottom;
  transform-box: fill-box;
  animation: lean var(--sway) ease-in-out var(--delay) infinite alternate;
}
/* 풀은 바람에 떨듯 흔들리지만 해초는 물에 밀려 뿌리부터 눕는다 */
@keyframes lean {
  from {
    transform: rotate(-5deg) scaleY(0.97);
  }
  to {
    transform: rotate(5deg) scaleY(1.03);
  }
}

/* 마린 스노우. 아주 느리게 내려앉는다 */
.marine circle {
  opacity: 0;
  animation: sink var(--dur) linear var(--delay) infinite;
}
@keyframes sink {
  0% {
    opacity: 0;
    transform: translateY(-40px);
  }
  10%,
  86% {
    opacity: var(--o);
  }
  100% {
    opacity: 0;
    transform: translateY(300px) translateX(var(--drift));
  }
}

/* 발광. 숨 쉬듯 밝아졌다 사그라든다 */
.glows circle {
  animation: bio var(--dur) ease-in-out var(--delay) infinite;
}
@keyframes bio {
  0%,
  100% {
    opacity: 0.12;
    transform: scale(0.7);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.25);
  }
}

@keyframes rise {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  12% {
    opacity: 0.55;
  }
  88% {
    opacity: 0.4;
  }
  100% {
    opacity: 0;
    transform: translateY(-180px) translateX(var(--drift));
  }
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
