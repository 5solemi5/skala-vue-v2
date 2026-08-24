<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()

const props = defineProps({
  people: { type: Array, required: true },
})

/**
 * 챙기는 사람 수만큼, 판 아래 마당을 걸어다니는 사람들.
 *
 * 값은 사람마다 고정이어야 한다. 다시 그릴 때마다 자리가 바뀌면
 * 걸어가던 사람이 순간이동한 것처럼 보인다.
 * 그래서 난수 대신 id 에서 뽑은 수를 쓴다. 같은 사람은 늘 같은 모습으로 걷는다.
 */
const hash = (text) => {
  let n = 0
  for (let i = 0; i < text.length; i += 1) {
    n = (n * 31 + text.charCodeAt(i)) >>> 0
  }
  /*
   * 마지막에 한 번 섞어 준다.
   * 이걸 빼먹었더니 열두 명이 거의 같은 옷을 입고 나왔다.
   * id 가 p_seed0 ~ p_seed11 처럼 끝 글자만 다르면 상위 비트가 거의 같은데,
   * 값을 뽑을 때 그 상위 비트를 보고 있었다.
   */
  n ^= n >>> 16
  n = Math.imul(n, 2246822507) >>> 0
  n ^= n >>> 13
  n = Math.imul(n, 3266489909) >>> 0
  n ^= n >>> 16
  return n >>> 0
}

// 부호 없는 시프트(>>>)를 쓴다. >> 로 하면 큰 수에서 음수가 나와
// 걸음 시간이 음수가 되고 사람이 화면 밖에 서 버린다.
const pick = (seed, shift, range) => (seed >>> shift) % range

// 옷 색. 판정 색(빨강·주황·초록)과 겹치지 않는 쪽으로 골랐다.
const COATS = ['#3f6f63', '#8a5a7a', '#3d5f8a', '#a8763a', '#6b7f3f', '#4f6d8f']

/** 앞뒤로 한 칸씩. 끝에 닿으면 반대쪽으로 돌아간다 */
const stepTheme = (delta) => {
  const list = configStore.yardList
  const at = list.findIndex((y) => y.id === configStore.yardTheme)
  const next = (at + delta + list.length) % list.length
  configStore.setYardTheme(list[next].id)
}

const walkers = computed(() => {
  const total = props.people.length || 1

  return props.people.map((person, i) => {
    const seed = hash(person.id + i)

    // 산책이라 느긋해야 한다. 빠르면 쫓기는 것처럼 보인다.
    const duration = 74 + pick(seed, 3, 46)

    /*
     * 출발 지점.
     * 처음에는 id 에서 뽑은 수만 썼는데 몇 명 안 될 때 한쪽에 몰려 서 있었다.
     * 자리를 먼저 고르게 나눠 주고 거기에 조금씩만 흔들어 준다.
     */
    const spread = i / total
    const jitter = pick(seed, 7, 100) / 100 / total
    const delay = -(duration * ((spread + jitter) % 1))

    /*
     * 앞뒤 자리.
     * 한 줄로만 걸으면 열두 명이 겹쳐서 몇 명인지 세어지지 않는다.
     * 뒤로 갈수록 작게 그리고 뒤에 둔다.
     */
    const back = pick(seed, 21, 32)

    return {
      id: person.id,
      hat: pick(seed, 9, 4), // 머리에 쓴 것 네 가지
      style: {
        '--dur': `${duration}s`,
        '--delay': `${delay}s`,
        '--scale': String((1.0 - (back / 32) * 0.32).toFixed(2)),
        // 느리게 걸으니 발도 느리게 놀려야 한다
        '--step': `${0.62 + pick(seed, 15, 26) / 100}s`,
        // 순번을 더해 옆 사람과는 늘 다른 색이 되게 한다
        '--coat': COATS[(i + pick(seed, 19, COATS.length)) % COATS.length],
        '--back': `${back}px`,
        zIndex: String(40 - back),
      },
    }
  })
})
</script>

<template>
  <!--
    챙기는 사람 수만큼, 판 아래 작은 마당을 천천히 걸어다닌다.

    자리를 여러 군데 놓아 봤다.
    화면 전체 배경은 글을 읽는 내내 시야 구석에서 뭔가 움직여 판정을 읽기 어려웠고,
    제목 옆은 버튼과의 사이가 좁아 열두 명이 비좁았다.
    판 위에 두니 제목과 표 사이가 벌어져 제목 바로 밑에 정보가 아니라 장식이 먼저 왔다.
    판 아래면 제목이 자기 표에 붙어 있고, 읽는 순서도 그대로다.

    끝까지 가면 사라지지 않고 돌아서서 되돌아온다.
    걸어 나가 버리면 챙기는 사람이 몇인지 세어 볼 수 없다.
  -->
  <div class="ambient">
    <div class="yard" :class="configStore.yardTheme" aria-hidden="true">
    <!--
      무대는 다섯 가지. 고른 것은 저장돼서 다음에 들어와도 그대로다.
      언덕과 나무는 움직이지 않는다. 다 움직이면 어지럽다.
    -->
    <svg class="scene" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
      <rect class="sky" x="0" y="0" width="400" height="120" />

      <!-- 들판 -->
      <g v-if="configStore.yardTheme === 'meadow'">
        <path class="hill far" d="M0 78c46-16 78-14 118 2s70 12 108-4 106-12 174 6v38H0z" />
        <path class="hill near" d="M0 90c62-12 96-6 150 6s112 8 250-10v34H0z" />
        <rect class="soil" x="0" y="98" width="400" height="22" />
        <g class="tree">
          <rect x="46" y="76" width="3" height="24" rx="1.5" />
          <circle cx="47.5" cy="70" r="11" />
          <circle cx="40" cy="76" r="7.5" />
          <circle cx="55" cy="76" r="7.5" />
        </g>
        <g class="tree small">
          <rect x="322" y="82" width="2.4" height="18" rx="1.2" />
          <circle cx="323" cy="78" r="8" />
          <circle cx="317" cy="83" r="5.5" />
          <circle cx="329" cy="83" r="5.5" />
        </g>
        <g class="bench">
          <rect x="196" y="88" width="26" height="2.6" rx="1.3" />
          <rect x="196" y="83" width="26" height="2.2" rx="1.1" />
          <rect x="198" y="90" width="2" height="9" rx="1" />
          <rect x="218" y="90" width="2" height="9" rx="1" />
        </g>
      </g>

      <!-- 바닷가 -->
      <g v-else-if="configStore.yardTheme === 'seaside'">
        <!-- 오른쪽 위는 배경 고르는 버튼 자리라 해는 왼쪽에 띄운다 -->
        <circle class="sun" cx="132" cy="24" r="9" />
        <rect class="sea" x="0" y="70" width="400" height="30" />
        <path class="wave" d="M0 78q10-4 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0" />
        <path class="wave two" d="M0 88q12-4 24 0t24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0" />
        <rect class="sand" x="0" y="98" width="400" height="22" />
        <g class="boat">
          <path d="M58 84h26l-4 6H62z" />
          <rect x="70" y="70" width="1.6" height="14" rx="0.8" />
          <path d="M72 71l11 11H72z" />
        </g>
        <g class="parasol">
          <rect x="300" y="82" width="1.8" height="18" rx="0.9" />
          <path d="M288 83a13 13 0 0 1 26 0z" />
        </g>
      </g>

      <!-- 밤하늘 -->
      <g v-else-if="configStore.yardTheme === 'night'">
        <!-- 오른쪽 위는 배경 고르는 버튼 자리라 달도 왼쪽에 띄운다 -->
        <circle class="moon" cx="140" cy="24" r="10" />
        <circle class="moon-cut" cx="134" cy="20" r="9" />
        <path class="hill far" d="M0 78c46-16 78-14 118 2s70 12 108-4 106-12 174 6v38H0z" />
        <path class="hill near" d="M0 90c62-12 96-6 150 6s112 8 250-10v34H0z" />
        <rect class="soil" x="0" y="98" width="400" height="22" />
        <g class="tree">
          <rect x="46" y="76" width="3" height="24" rx="1.5" />
          <circle cx="47.5" cy="70" r="11" />
          <circle cx="40" cy="76" r="7.5" />
          <circle cx="55" cy="76" r="7.5" />
        </g>
      </g>

      <!-- 눈밭 -->
      <g v-else-if="configStore.yardTheme === 'snow'">
        <path class="hill far" d="M0 80c50-14 84-12 124 4s72 10 110-6 104-10 166 8v34H0z" />
        <path class="hill near" d="M0 92c66-10 100-4 154 8s110 6 246-12v32H0z" />
        <rect class="soil" x="0" y="99" width="400" height="21" />
        <g class="bare">
          <rect x="60" y="74" width="2.4" height="26" rx="1.2" />
          <path d="M61 82l-9-7M61 86l9-6M61 78l-6-6" />
        </g>
        <g class="bare small">
          <rect x="330" y="82" width="2" height="18" rx="1" />
          <path d="M331 88l-7-5M331 91l7-4" />
        </g>
        <g class="snowman">
          <circle cx="208" cy="94" r="7" />
          <circle cx="208" cy="84" r="5" />
          <circle class="dot" cx="206" cy="83" r="0.8" />
          <circle class="dot" cx="210" cy="83" r="0.8" />
        </g>
      </g>

      <!-- 골목 -->
      <g v-else>
        <g class="block">
          <rect x="10" y="46" width="34" height="54" rx="2" />
          <rect x="52" y="60" width="26" height="40" rx="2" />
          <rect x="86" y="38" width="30" height="62" rx="2" />
          <rect x="250" y="54" width="30" height="46" rx="2" />
          <rect x="288" y="42" width="36" height="58" rx="2" />
          <rect x="332" y="62" width="26" height="38" rx="2" />
        </g>
        <g class="window">
          <rect x="17" y="54" width="5" height="6" />
          <rect x="27" y="54" width="5" height="6" />
          <rect x="17" y="68" width="5" height="6" />
          <rect x="32" y="68" width="5" height="6" />
          <rect x="93" y="48" width="5" height="6" />
          <rect x="104" y="48" width="5" height="6" />
          <rect x="93" y="62" width="5" height="6" />
          <rect x="295" y="52" width="5" height="6" />
          <rect x="308" y="52" width="5" height="6" />
          <rect x="295" y="66" width="5" height="6" />
        </g>
        <rect class="road" x="0" y="100" width="400" height="20" />
        <path class="lane" d="M0 110h18M34 110h18M68 110h18M102 110h18M136 110h18M170 110h18M204 110h18M238 110h18M272 110h18M306 110h18M340 110h18M374 110h18" />
      </g>

      <line class="edge" x1="0" y1="98" x2="400" y2="98" />

      <!-- 가로등은 어느 무대에나 하나씩 세워 둔다 -->
      <g class="lamp">
        <rect x="278" y="66" width="2" height="34" rx="1" />
        <circle cx="279" cy="64" r="3.4" />
      </g>
    </svg>

    <!-- 하늘에 떠 있는 것. 낮에는 구름, 밤에는 별, 눈밭에는 눈 -->
    <div class="sky-lane" aria-hidden="true">
      <template v-if="configStore.yardTheme === 'night'">
        <span v-for="n in 9" :key="n" class="star" :class="`s${n}`"></span>
      </template>
      <template v-else-if="configStore.yardTheme === 'snow'">
        <span v-for="n in 10" :key="n" class="flake" :class="`f${n}`"></span>
      </template>
      <template v-else>
        <span class="cloud one"></span>
        <span class="cloud two"></span>
        <span class="cloud three"></span>
      </template>
    </div>

    <TransitionGroup name="walker" type="transition">
      <div v-for="w in walkers" :key="w.id" class="walker" :style="w.style">
        <svg class="figure" viewBox="0 0 20 24">
          <!-- 팔은 몸 뒤에 둔다. 앞에 두면 몸을 가로질러 지저분해진다 -->
          <rect class="arm one" x="3.4" y="11.4" width="2.5" height="5.9" rx="1.25" />
          <rect class="arm two" x="14.1" y="11.4" width="2.5" height="5.9" rx="1.25" />

          <rect class="body" x="5.5" y="10.7" width="9" height="7.8" rx="3.5" />

          <!-- 머리를 몸보다 크게 잡으면 귀엽게 읽힌다 -->
          <circle class="head" cx="10" cy="5.9" r="5.6" />

          <!-- 쓴 것 네 가지. 같은 사람은 늘 같은 걸 쓴다 -->
          <g v-if="w.hat === 1" class="gear">
            <path d="M4.6 4.6a5.6 5.6 0 0 1 10.8 0z" />
            <circle cx="10" cy="0.7" r="1.15" />
          </g>
          <g v-else-if="w.hat === 2" class="gear">
            <path d="M4.8 5.2a5.4 5.4 0 0 1 10.4 0z" />
            <rect x="2.2" y="4.9" width="9" height="1.7" rx="0.85" />
          </g>
          <g v-else-if="w.hat === 3" class="gear">
            <circle cx="6.4" cy="2.6" r="1.9" />
            <circle cx="10" cy="1.5" r="2.1" />
            <circle cx="13.6" cy="2.6" r="1.9" />
          </g>

          <circle class="eye" cx="8" cy="6.4" r="0.95" />
          <circle class="eye" cx="12" cy="6.4" r="0.95" />

          <rect class="leg one" x="6.5" y="17.9" width="2.8" height="4.7" rx="1.4" />
          <rect class="leg two" x="10.7" y="17.9" width="2.8" height="4.7" rx="1.4" />
        </svg>
      </div>
    </TransitionGroup>
    </div>

    <!--
      배경 고르기.
      마당 안에 버튼을 넣었더니 휴대폰에서 그 줄이 마당 폭의 절반을 넘게 차지했다.
      무대를 가리지 않게 밖으로 빼고, 다섯 개를 다 늘어놓는 대신
      앞뒤로 한 칸씩 넘기게 했다.
      이름도 뺐다. 무대를 보면 어디인지 알 수 있어서 굳이 적을 필요가 없었다.
    -->
    <div class="switcher" role="group" :aria-label="configStore.t('yard.aria')">
      <button
        type="button"
        class="arrow"
        :aria-label="configStore.t('yard.prev')"
        :title="configStore.t('yard.prev')"
        @click="stepTheme(-1)"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5 4 6l3.5 3.5" /></svg>
      </button>

      <!--
        점 다섯 개.
        화살표만 있으면 누를 수 있는 것도, 바꿀 게 몇 개인지도 알 수 없었다.
        점을 두니 "다섯 중 지금 여기" 가 한눈에 보이고 눌러서 바로 갈 수도 있다.
      -->
      <span class="dots">
        <button
          v-for="item in configStore.yardList"
          :key="item.id"
          type="button"
          class="dot"
          :class="{ on: configStore.yardTheme === item.id }"
          :aria-label="item.label"
          :title="item.label"
          :aria-pressed="configStore.yardTheme === item.id"
          @click="configStore.setYardTheme(item.id)"
        ></button>
      </span>

      <button
        type="button"
        class="arrow"
        :aria-label="configStore.t('yard.next')"
        :title="configStore.t('yard.next')"
        @click="stepTheme(1)"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
/*
 * 판 아래 이어지는 작은 마당.
 * 바닥선 하나만 그었을 때는 캐릭터가 허공에 떠 보였다.
 * 언덕과 나무를 몇 개 놓으니 비로소 '어딘가' 가 되었다.
 */
.yard {
  position: relative;
  height: 120px;
  margin-top: 10px;
  border: 1px solid var(--color-line);
  border-radius: 12px;
  overflow: hidden;
  pointer-events: none;
}

.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/*
 * 무대 색.
 * 무대마다 색이 다르지만 판정 색(빨강·주황·초록)과는 겹치지 않게 골랐다.
 * 색을 변수로 두고 무대 클래스에서만 값을 바꾼다.
 */
.yard {
  --sky: #eef3f5;
  --far: #dbe6dd;
  --near: #cddcd0;
  --floor: #c3d4c6;
  --edge: #b2c6b6;
  --trunk: #8a7050;
  --leaf: #7e9c72;
  --leaf-2: #8dab80;
  --wood: #9b7f5c;
  --post: #8a949b;
  --bulb: #e8d9a8;
}
.yard.seaside {
  --sky: #e7f1f6;
  --floor: #ecdfc4;
  --edge: #dbc9a6;
  --post: #9aa6ad;
}
.yard.night {
  --sky: #2c3651;
  --far: #35415e;
  --near: #3d4a6b;
  --floor: #46536f;
  --edge: #566385;
  --trunk: #4a4436;
  --leaf: #40584a;
  --post: #6b7690;
  --bulb: #f2e2a6;
}
.yard.snow {
  --sky: #e9f0f6;
  --far: #f2f6fa;
  --near: #e6edf3;
  --floor: #f4f8fb;
  --edge: #d6e0e8;
  --trunk: #7d7266;
}
.yard.city {
  --sky: #e9eef2;
  --floor: #b9c2ca;
  --edge: #a7b2bb;
}

/*
 * ── 어두운 화면에서의 마당 ─────────────────────────
 *
 * 마당은 이 화면에서 유일하게 색을 마음껏 쓴 곳이고 그건 그대로 뒀다.
 * 다만 어두운 화면에서 낮 마당(들판·바닷가·눈밭·골목)을 그대로 깔면
 * 가로로 긴 흰 판이 되어, 어두운 지면에 구멍이 뚫린 것처럼 보였다.
 * 판정을 읽으려고 내려가는 길에 이 판이 눈을 한 번 때린다.
 *
 * 색을 다시 고르지는 않았다. 여기 색은 무대의 성격이라 밤이라고 다른 곳이 되면 안 된다.
 * 대신 무대의 불을 조금 줄였다. 같은 마당을 저녁에 보는 정도다.
 *
 * 밤 마당은 건드리지 않는다. 이미 밤이라 더 줄이면 아무것도 안 보인다.
 */
:root[data-theme='dark'] .yard:not(.night) {
  filter: brightness(0.74) saturate(0.88);
}

/* 어두운 화면에서는 테두리도 한 단 진하게. 옅으면 판의 끝이 어디인지 안 보인다 */
:root[data-theme='dark'] .yard {
  border-color: var(--color-line-2);
}

.sky {
  fill: var(--sky);
}
.hill.far {
  fill: var(--far);
}
.hill.near {
  fill: var(--near);
}
.soil,
.sand,
.road {
  fill: var(--floor);
}
.edge {
  stroke: var(--edge);
  stroke-width: 1;
}

.tree rect,
.bare rect {
  fill: var(--trunk);
}
.tree circle {
  fill: var(--leaf);
}
.tree.small circle {
  fill: var(--leaf-2);
}
.bare path {
  stroke: var(--trunk);
  stroke-width: 1.6;
  stroke-linecap: round;
  fill: none;
}
.bench rect,
.boat path,
.boat rect {
  fill: var(--wood);
}
.lamp rect,
.parasol rect {
  fill: var(--post);
}
.lamp circle {
  fill: var(--bulb);
}

/* ── 바닷가 ── */
.sun {
  fill: #f0d9a4;
}
.sea {
  fill: #a9cfdf;
}
.wave {
  stroke: #c3dfea;
  stroke-width: 1.6;
  fill: none;
}
.wave.two {
  stroke: #bcd9e6;
}
.parasol path {
  fill: #c98b7a;
}

/* ── 밤하늘 ── */
.moon {
  fill: #f2e2a6;
}
/* 하늘색으로 한 겹 덮어 초승달을 만든다 */
.moon-cut {
  fill: var(--sky);
}

/* ── 눈밭 ── */
.snowman circle {
  fill: #ffffff;
  stroke: #dbe4ea;
  stroke-width: 1;
}
.snowman .dot {
  fill: #55606a;
  stroke: none;
}

/* ── 골목 ── */
.block rect {
  fill: #ccd5dc;
}
.window rect {
  fill: #eef3f6;
}
.lane {
  stroke: #d9e0e6;
  stroke-width: 1.6;
  fill: none;
}

/* ── 하늘에 떠 있는 것 ── */
.sky-lane {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.cloud {
  position: absolute;
  width: 34px;
  height: 11px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  box-shadow:
    9px -5px 0 -1px rgba(255, 255, 255, 0.85),
    -9px -3px 0 -3px rgba(255, 255, 255, 0.85);
}
.cloud.one {
  top: 14px;
  animation: drift 210s linear infinite;
}
.cloud.two {
  top: 30px;
  scale: 0.8;
  animation: drift 280s linear -90s infinite;
}
.cloud.three {
  top: 8px;
  scale: 1.15;
  animation: drift 340s linear -200s infinite;
}
@keyframes drift {
  from {
    transform: translateX(-60px);
  }
  to {
    transform: translateX(calc(100vw + 60px));
  }
}

/* 별은 자리마다 다른 박자로 아주 천천히 깜빡인다 */
.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #f4f0dc;
  border-radius: 50%;
  animation: twinkle 5s ease-in-out infinite;
}
.star.s1 { top: 12px; left: 8%; }
.star.s2 { top: 26px; left: 17%; animation-delay: -1.2s; }
.star.s3 { top: 9px; left: 29%; animation-delay: -2.4s; }
.star.s4 { top: 33px; left: 38%; animation-delay: -0.6s; }
.star.s5 { top: 17px; left: 47%; animation-delay: -3.1s; }
.star.s6 { top: 28px; left: 56%; animation-delay: -1.8s; }
.star.s7 { top: 11px; left: 66%; animation-delay: -4.2s; }
.star.s8 { top: 31px; left: 76%; animation-delay: -2.7s; }
.star.s9 { top: 20px; left: 90%; animation-delay: -3.6s; }
@keyframes twinkle {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}

/* 눈은 위에서 아래로 천천히 */
.flake {
  position: absolute;
  top: -6px;
  width: 3px;
  height: 3px;
  background: #ffffff;
  border-radius: 50%;
  animation: fall 14s linear infinite;
}
.flake.f1 { left: 6%; }
.flake.f2 { left: 15%; animation-delay: -3s; animation-duration: 18s; }
.flake.f3 { left: 24%; animation-delay: -7s; }
.flake.f4 { left: 33%; animation-delay: -11s; animation-duration: 20s; }
.flake.f5 { left: 45%; animation-delay: -5s; }
.flake.f6 { left: 55%; animation-delay: -9s; animation-duration: 17s; }
.flake.f7 { left: 66%; animation-delay: -2s; }
.flake.f8 { left: 75%; animation-delay: -13s; animation-duration: 21s; }
.flake.f9 { left: 85%; animation-delay: -6s; }
.flake.f10 { left: 94%; animation-delay: -10s; animation-duration: 16s; }
@keyframes fall {
  to {
    transform: translateY(126px);
  }
}

/*
 * 배경 고르기.
 *
 * 처음엔 마당 안에 이름 다섯 개를 늘어놓았는데 휴대폰에서 마당 폭의
 * 절반을 넘게 차지해 무대를 가렸다. 밖으로 빼고 화살표만 남겼더니
 * 이번엔 누를 수 있는 것인지조차 알 수 없었다.
 * 테두리를 둘러 버튼처럼 보이게 하고, 가운데에 점을 놓아
 * 바꿀 게 다섯 개라는 것과 지금 어디인지를 함께 보이게 했다.
 */
.switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--color-ink-3);
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: 50%;
  cursor: pointer;
  transition:
    color 0.12s ease,
    border-color 0.12s ease;
}
.arrow:hover {
  color: var(--color-ink);
  border-color: var(--color-line-2);
}
.arrow:active {
  background: var(--color-paper-2);
}
.arrow svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.dots {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.dot {
  width: 5px;
  height: 5px;
  padding: 0;
  background: var(--color-line-2);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition:
    background 0.14s ease,
    transform 0.14s ease;
}
.dot:hover {
  background: var(--color-ink-3);
}
.dot.on {
  background: var(--color-ink);
  transform: scale(1.35);
}

/* ── 걸어다니는 사람들 ── */

/*
 * 폭을 마당 전체로 잡아 둔다.
 * transform 의 100% 는 컨테이너가 아니라 자기 자신의 폭을 뜻한다.
 * 처음에 이걸 몰라서 사람이 제자리에서 20px 만 오갔다.
 */
.walker {
  position: absolute;
  pointer-events: none;
  bottom: calc(4px + var(--back));
  left: 0;
  width: 100%;
  /*
   * 걸음은 일정한 속도로.
   * ease-in-out 으로 뒀더니 양 끝에서 느려져 거기에 여럿이 뭉쳐 서 있었다.
   * 도는 동작은 keyframes 안에 멈추는 구간으로 따로 넣었다.
   */
  animation: patrol var(--dur) linear var(--delay) infinite;
}

.figure {
  display: block;
  width: 26px;
  height: 31px;
  /*
   * 크기와 좌우 뒤집기는 transform 이 아니라 scale 속성으로 준다.
   * transform 은 위아래로 흔들리는 데 써야 해서 비워 뒀다.
   */
  scale: var(--scale) var(--scale);
  transform-origin: bottom center;
  animation:
    bob var(--step) ease-in-out infinite alternate,
    face var(--dur) step-end var(--delay) infinite;
}

.body,
.arm,
.leg,
.gear {
  fill: var(--coat);
}
/* 얼굴은 옷보다 밝게. 표정이 보이려면 대비가 있어야 한다 */
.head {
  fill: #f4ede4;
}
.eye {
  fill: #2b3138;
}

.leg {
  transform-origin: 50% 12%;
  animation: step var(--step) ease-in-out infinite alternate;
}
.leg.two,
.arm.two {
  animation-direction: alternate-reverse;
}

/* 팔은 다리와 반대로 흔들린다. 같은 쪽으로 가면 걷는 것처럼 안 보인다 */
.arm {
  transform-origin: 50% 10%;
  animation: swing var(--step) ease-in-out infinite alternate-reverse;
}
.arm.two {
  animation-direction: alternate;
}

/*
 * 끝까지 가면 잠깐 멈췄다가 돌아온다.
 * 멈추는 구간이 있어야 몸을 돌리는 것처럼 보인다.
 */
@keyframes patrol {
  0% {
    transform: translateX(6px);
  }
  46% {
    transform: translateX(calc(100% - 32px));
  }
  54% {
    transform: translateX(calc(100% - 32px));
  }
  96% {
    transform: translateX(6px);
  }
  100% {
    transform: translateX(6px);
  }
}
/* 돌아서는 순간에 맞춰 몸도 뒤집는다 */
@keyframes face {
  0% {
    scale: var(--scale) var(--scale);
  }
  50% {
    scale: calc(var(--scale) * -1) var(--scale);
  }
  98% {
    scale: var(--scale) var(--scale);
  }
}
@keyframes bob {
  to {
    transform: translateY(-1.5px);
  }
}
@keyframes step {
  from {
    transform: rotate(-14deg);
  }
  to {
    transform: rotate(14deg);
  }
}
@keyframes swing {
  from {
    transform: rotate(-10deg);
  }
  to {
    transform: rotate(10deg);
  }
}

/* 사람이 늘거나 줄면 함께 나타나고 사라진다 */
.walker-enter-active,
.walker-leave-active {
  transition: opacity 0.6s ease;
}
.walker-enter-from,
.walker-leave-to {
  opacity: 0;
}

@media (max-width: 560px) {
  .yard {
    height: 100px;
  }
}

/*
 * 움직임을 끈 사람에게는 걷지 않는다.
 * 다만 지우지는 않는다. 마당에 챙기는 수만큼 서 있는 것으로 뜻은 남는다.
 */
@media (prefers-reduced-motion: reduce) {
  .dot {
    transition: none;
  }
  .walker,
  .figure,
  .leg,
  .arm,
  .cloud {
    animation: none;
  }
  .walker {
    /* 걷지 않으니 고르게 세워 둔다 */
    left: calc((var(--back) * 3%) + 6%);
    width: auto;
  }
}
</style>
