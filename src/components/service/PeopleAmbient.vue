<script setup>
import { ref, computed, useId } from 'vue'
import { useConfigStore } from '@/stores/configStore'

/*
 * 마당 — 벌룬(Balloon) 라인.
 *
 * ── 이 판만 결이 다른 이유 ──────────────────────────
 * 참고한 다이어리 브랜드는 시각 언어를 둘로 나눠 쓴다.
 *
 *   각인형  저채도 딥톤 · 얇은 선 · 금박 · 질감      → 시즌제 주류
 *   일러스트형  고채도 파스텔 · 두꺼운 흰 테두리 스티커 → 벌룬 만년형
 *
 * 그리고 이 둘을 한 면에 섞지 않는다.
 * 이 화면에서 창문·좌표·에디션 번호는 앞의 것이고, 여기 캐릭터는 뒤의 것이다.
 * 그래서 섞지 않고 '도판' 으로 액자에 넣어 따로 세운다.
 * 결이 다른 게 실수가 아니라 다른 라인이라는 뜻이 되게.
 *
 * ── 표지 문법을 그대로 옮겼다 ───────────────────────
 *  1. 한 무대에 모티프는 하나. 전에는 바닷가에 배·파라솔·가로등·구름·해가
 *     흩어져 있어서 무엇을 보라는 건지 알 수 없었다.
 *  2. 질감이 본체고 그림은 구두점. 면적의 대부분은 결이 도는 빈 면이다.
 *  3. 색은 한 색의 명도 단계로만 흔든다. 무대마다 실측된 표지 색 하나를 받아
 *     하늘부터 지면까지 그 색의 밝기만 바꿔 내려온다.
 *  4. 금박은 선에만. 모티프의 윤곽선과 라벨에만 쓰고 면을 칠하지 않는다.
 *  5. 좌하단에 라벨, 우하단에 서명. 모든 표지에 고정으로 있던 두 가지다.
 *
 * ── 눌러서 넓게 보기 ────────────────────────────────
 * 평소에는 지면 쪽 띠만 보인다. 아침에 판정을 읽으러 온 사람에게
 * 그림이 화면을 다 차지하면 방해가 되기 때문이다.
 * 누르면 하늘까지 열리면서 그제야 모티프가 드러난다.
 * 그림을 늘려서 채우지 않고 큰 화폭의 일부를 잘라 보여주는 방식이라
 * 접혀 있을 때도 비율이 찌그러지지 않는다.
 */
const configStore = useConfigStore()
const uid = useId()

const props = defineProps({
  people: { type: Array, required: true },
})

/*
 * 무대마다 색은 하나뿐이다.
 * 실측된 표지 색을 본색으로 두고 하늘에서 지면까지 명도만 내려온다.
 * 여러 색을 섞지 않는 게 이 브랜드가 표지를 만드는 방식이다.
 */
const STAGES = {
  // 칵테일 · 딥 포레스트
  meadow: {
    sky: '#6F8A73',
    mid: '#4E6855',
    far: '#42594A',
    near: '#374E3C',
    ground: '#2C3F31',
    foil: '#EAC379',
  },
  // 아베베 · 페리윙클
  seaside: {
    sky: '#B7C7E4',
    mid: '#9CB0D6',
    far: '#849CCB',
    near: '#7188B7',
    ground: '#5E749E'.slice(0, 7),
    foil: '#F0DCAE',
  },
  // 골든 레코드 · 차콜 텍스타일
  night: {
    sky: '#4D4B45',
    mid: '#3B3A36',
    far: '#323230',
    near: '#232320',
    ground: '#141416',
    foil: '#EAC379',
  },
  // 보이저 · 쿨 오프화이트
  snow: {
    sky: '#EDF0F5',
    mid: '#E2E6ED',
    far: '#D7DBE3',
    near: '#C4C8D1',
    ground: '#B1B0B4',
    foil: '#918167',
  },
  // 빅뱅 · 콘크리트
  city: {
    sky: '#D2D1CE',
    mid: '#C6C5C2',
    far: '#BBBAB7',
    near: '#A6A5A2',
    ground: '#8E8D8A',
    foil: '#918167',
  },
}

const stage = computed(() => STAGES[configStore.yardTheme] ?? STAGES.meadow)
const themeLabel = computed(
  () => configStore.yardList.find((y) => y.id === configStore.yardTheme)?.label ?? '',
)

/** 앞뒤로 한 칸씩. 끝에 닿으면 반대쪽으로 돌아간다 */
const stepTheme = (delta) => {
  const list = configStore.yardList
  const at = list.findIndex((y) => y.id === configStore.yardTheme)
  const next = (at + delta + list.length) % list.length
  configStore.setYardTheme(list[next].id)
}

/*
 * 넓게 볼까 접어 둘까.
 * 저장하지 않는다. 설정이 아니라 잠깐 들여다보는 일이라
 * 다음에 들어왔을 때는 다시 얇은 띠로 시작하는 게 맞다.
 */
const open = ref(false)

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

/*
 * 옷 색.
 * 벌룬 라인에서 실측된 색들이다 — 페리윙클, 로즈 코럴, 모브,
 * 네버랜드 핑크, 고래 잉크블루, 그리고 잎사귀 초록.
 * 판정에 쓰는 빨강·주황·초록과는 겹치지 않는 쪽으로만 골랐다.
 */
const COATS = ['#849CCB', '#EB7187', '#C69FC0', '#CF89C3', '#464F64', '#5FA98C']

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
      hat: pick(seed, 9, 5), // 머리에 쓴 것 다섯 가지
      hold: pick(seed, 13, 4), // 손에 든 것 네 가지
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
  <div class="ambient">
    <!--
      도판 제목 줄.
      여기는 손으로 그린 그림이고 위쪽 창은 계산해서 그리는 판이라 결이 아주 다른데,
      아무 표시 없이 나란히 두면 둘 중 하나가 덜 만든 것처럼 보인다.
      '도판' 이라고 이름을 달면 결이 다른 게 실수가 아니라 종류가 다른 것이 된다.
    -->
    <p class="plate-cap">
      <span class="plate-no">PL.</span>
      <span class="plate-name">{{ configStore.t('yard.plate') }}</span>
      <span class="plate-rule" aria-hidden="true"></span>
      <span class="plate-theme">{{ themeLabel }}</span>
    </p>

    <!--
      눌러서 넓게 보는 판.
      button 이 아니라 div 에 역할을 준 건, 안에 무대를 넘기는 버튼이 또 있어서
      버튼 안에 버튼이 들어가는 짜임이 되기 때문이다.
    -->
    <div
      class="stage"
      :class="[configStore.yardTheme, { open }]"
      role="button"
      tabindex="0"
      :aria-expanded="open"
      :aria-label="configStore.t(open ? 'yard.collapse' : 'yard.expand')"
      @click="open = !open"
      @keydown.enter.prevent="open = !open"
      @keydown.space.prevent="open = !open"
    >
      <!--
        큰 화폭에 그려 두고 접혀 있을 때는 아래쪽만 잘라 보여준다.
        늘려서 채우면(preserveAspectRatio="none") 해가 타원이 되고 구름이 납작해진다.
        전에 그랬다.
      -->
      <svg
        class="scene"
        viewBox="0 0 800 260"
        :preserveAspectRatio="open ? 'xMidYMid meet' : 'xMidYMax slice'"
        aria-hidden="true"
      >
        <defs>
          <!--
            결.
            이 브랜드의 표지는 색을 여러 개 쓰는 게 아니라 한 색을 질감으로 흔든다.
            그래서 그라디언트가 아니라 아주 고운 잡음을 얹는다.
          -->
          <filter :id="`grain-${uid}`" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <linearGradient :id="`sky-${uid}`" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="stage.sky" />
            <stop offset="100%" :stop-color="stage.mid" />
          </linearGradient>
        </defs>

        <!-- 하늘 -->
        <rect x="0" y="0" width="800" height="260" :fill="`url(#sky-${uid})`" />

        <!-- 모티프. 무대마다 하나뿐이고 금박 선으로만 그린다 -->
        <g class="motif" :stroke="stage.foil">
          <!-- 들판 — 나무 한 그루 -->
          <g v-if="configStore.yardTheme === 'meadow'">
            <path d="M596 196V96" />
            <path d="M596 128l-26-20M596 146l28-22M596 112l-18-16" />
            <path d="M552 96a44 34 0 0 1 88 0a44 30 0 0 1-88 0z" />
          </g>
          <!-- 바닷가 — 고래 -->
          <g v-else-if="configStore.yardTheme === 'seaside'">
            <path d="M528 104c34-26 92-24 118 2c14 14 8 30-10 34c-38 8-88 2-112-14c-8-6-6-16 4-22z" />
            <path d="M646 106l24-18-6 26z" />
            <path d="M566 84c6-14 14-22 22-24" />
            <circle cx="552" cy="112" r="2.6" :fill="stage.foil" stroke="none" />
          </g>
          <!-- 밤하늘 — 보이저 탐사선 -->
          <g v-else-if="configStore.yardTheme === 'night'">
            <ellipse cx="600" cy="96" rx="34" ry="30" />
            <ellipse cx="600" cy="96" rx="17" ry="15" />
            <path d="M600 126v26M566 78L520 44M634 78l48-30M600 66V34M572 122l-34 30M628 122l36 28" />
            <circle cx="600" cy="96" r="4" :fill="stage.foil" stroke="none" />
          </g>
          <!-- 눈밭 — 앙상한 나무 -->
          <g v-else-if="configStore.yardTheme === 'snow'">
            <path d="M600 198V78" />
            <path d="M600 118l-30-26M600 140l32-28M600 96l-22-22M600 158l-26-20M600 108l26-24" />
          </g>
          <!-- 골목 — 가로등 -->
          <g v-else>
            <path d="M612 200V78" />
            <path d="M612 78h-34" />
            <path d="M566 78a12 9 0 0 0 24 0z" />
            <path d="M578 96l-8 16M578 96l8 16M578 96v20" opacity="0.55" />
          </g>
        </g>

        <!-- 지면. 한 색의 명도 단계로만 내려온다 -->
        <path :fill="stage.far" d="M0 168c118-26 196-22 296 4s176 20 270-10 158-18 234 12v86H0z" />
        <path :fill="stage.near" d="M0 196c140-20 214-12 320 10s186 12 316-14 132-10 164 6v62H0z" />
        <rect x="0" y="228" width="800" height="32" :fill="stage.ground" />

        <!-- 결을 맨 위에 아주 옅게 -->
        <rect
          class="grain"
          x="0"
          y="0"
          width="800"
          height="260"
          :filter="`url(#grain-${uid})`"
        />
      </svg>

      <!-- 걸어다니는 사람들 -->
      <TransitionGroup name="walker" type="transition" tag="div" class="walkers">
        <div v-for="w in walkers" :key="w.id" class="walker" :style="w.style">
          <svg class="figure" viewBox="0 0 24 28">
            <!--
              스티커 컷아웃.
              같은 그림을 두 번 그린다. 아래 것은 흰색으로 두껍게 둘러 오려낸 자국을 만들고
              위에 진짜 그림을 얹는다. 벌룬 라인의 핵심 장치가 이 흰 테두리다.
            -->
            <g v-for="layer in ['cut', 'ink']" :key="layer" :class="layer">
              <!-- 팔은 몸 뒤에 둔다. 앞에 두면 몸을 가로질러 지저분해진다 -->
              <rect class="arm one" x="4.4" y="13.4" width="2.8" height="6.4" rx="1.4" />
              <rect class="arm two" x="16.8" y="13.4" width="2.8" height="6.4" rx="1.4" />

              <!-- 손에 든 것 -->
              <g v-if="w.hold === 1" class="gear">
                <path d="M18.2 13.6v-6" />
                <path d="M14.2 8.4a4 3.4 0 0 1 8 0z" />
              </g>
              <g v-else-if="w.hold === 2" class="gear">
                <circle cx="18.2" cy="18.6" r="2.4" />
              </g>
              <g v-else-if="w.hold === 3" class="gear">
                <path d="M18.2 14.2v5.6" />
                <path d="M16.2 19.8h4" />
              </g>

              <rect class="body" x="6.6" y="12.6" width="10.8" height="9" rx="4.2" />

              <!-- 머리를 몸보다 크게 잡으면 귀엽게 읽힌다 -->
              <circle class="head" cx="12" cy="7" r="6.6" />

              <!-- 쓴 것 다섯 가지. 같은 사람은 늘 같은 걸 쓴다 -->
              <g v-if="w.hat === 1" class="gear">
                <path d="M5.6 5.4a6.6 6.6 0 0 1 12.8 0z" />
                <circle cx="12" cy="0.6" r="1.35" />
              </g>
              <g v-else-if="w.hat === 2" class="gear">
                <path d="M5.8 6.1a6.4 6.4 0 0 1 12.4 0z" />
                <rect x="2.6" y="5.8" width="10.6" height="2" rx="1" />
              </g>
              <g v-else-if="w.hat === 3" class="gear">
                <circle cx="7.6" cy="3" r="2.2" />
                <circle cx="12" cy="1.7" r="2.5" />
                <circle cx="16.4" cy="3" r="2.2" />
              </g>
              <g v-else-if="w.hat === 4" class="gear">
                <path d="M5.4 4.8h13.2" />
                <path d="M8 4.8c0-3 8-3 8 0" />
              </g>

              <circle class="eye" cx="9.6" cy="7.6" r="1.1" />
              <circle class="eye" cx="14.4" cy="7.6" r="1.1" />

              <rect class="leg one" x="7.8" y="21" width="3.2" height="5.6" rx="1.6" />
              <rect class="leg two" x="13" y="21" width="3.2" height="5.6" rx="1.6" />
            </g>
          </svg>
        </div>
      </TransitionGroup>

      <!--
        고정 프레임.
        참고한 표지 열세 장 모두 좌하단에 초소형 대문자 라벨,
        우하단에 손글씨 서명이 예외 없이 들어가 있었다.
      -->
      <p class="frame-label">
        BALLOON · {{ configStore.t('yard.plate') }} · {{ themeLabel }}
      </p>
      <p class="frame-sign">{{ configStore.t('yard.sign') }}</p>

      <!-- 넓게 볼 수 있다는 표시 -->
      <span class="hint" aria-hidden="true">
        {{ configStore.t(open ? 'yard.collapse' : 'yard.expand') }}
        <svg viewBox="0 0 10 6"><path d="M1 1.5 5 4.8 9 1.5" /></svg>
      </span>
    </div>

    <!-- 무대 고르기 -->
    <div class="picker" role="group" :aria-label="configStore.t('yard.aria')">
      <button
        type="button"
        class="arrow"
        :aria-label="configStore.t('yard.prev')"
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
        @click="stepTheme(1)"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
/*
 * 도판 제목 줄.
 * 도판 번호와 이름, 그 사이를 금색 실선이 잇는다.
 * 도감이나 화보의 도판 캡션에서 가져온 형식이다.
 */
.plate-cap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 0;
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  letter-spacing: 0.1em;
  color: var(--color-ink-3);
}
.plate-no {
  color: var(--color-gold);
}
.plate-name {
  letter-spacing: 0.04em;
  color: var(--color-ink-2);
}
.plate-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-gold) 55%, transparent),
    color-mix(in srgb, var(--color-gold) 18%, transparent)
  );
}
.plate-theme {
  color: var(--color-ink-3);
}

/* ── 판 ── */
.stage {
  position: relative;
  margin-top: 8px;
  height: 132px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-gold) 30%, var(--color-line));
  border-radius: 4px;
  cursor: pointer;
  /*
   * 접혔다 펼쳐질 때 높이가 흐르게 한다.
   * 툭 열리면 아래 있던 것들이 순간이동한 것처럼 보인다.
   */
  transition: height var(--dur-move) var(--ease-out);
}
.stage.open {
  /* 화폭이 800x260 이라 이 비로 열어야 그림이 비율 그대로 다 들어온다 */
  height: clamp(200px, 32.5vw, 279px);
}
.stage:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 2px;
}

.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/* 모티프는 금박 선으로만. 면을 칠하지 않는다 */
.motif {
  fill: none;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transition: opacity var(--dur-enter) var(--ease-out);
}
/*
 * 접혀 있을 때는 모티프가 화면 밖(하늘 쪽)이라 어차피 안 보이지만,
 * 열릴 때 그림이 잘려 올라오는 대신 배어 나오게 해서
 * '접혀 있던 게 드러난다' 는 느낌을 준다.
 */
.stage.open .motif {
  opacity: 0.85;
  transition-delay: 90ms;
}

/* 결. 아주 옅게만 얹는다. 진하면 그림이 지저분해진다 */
.grain {
  opacity: 0.055;
  mix-blend-mode: multiply;
  pointer-events: none;
}

/* ── 걸어다니는 사람들 ── */
.walkers {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.walker {
  position: absolute;
  /*
   * 지면은 접혀 있든 펼쳐져 있든 늘 판의 아래쪽이다.
   * 다만 맨 아래 22px 은 좌하단 라벨과 우하단 서명이 쓰는 자리라 비켜 선다.
   * 처음엔 그 위를 걷게 했더니 사람이 '들판' 글자를 밟고 지나갔다.
   */
  bottom: calc(24px + var(--back) * 0.42);
  left: 0;
  transform: scale(var(--scale));
  transform-origin: bottom center;
  animation: stroll var(--dur) linear var(--delay) infinite alternate;
}
@keyframes stroll {
  from {
    left: 2%;
  }
  to {
    left: 94%;
  }
}

.figure {
  width: 30px;
  height: 35px;
  display: block;
  overflow: visible;
}

/*
 * 스티커 컷아웃.
 * 아래 층은 흰색으로 두껍게 둘러 오려낸 자국을 만들고 위에 진짜 색을 얹는다.
 * 표지에 스티커를 붙인 것처럼 보이는 게 이 라인의 핵심 장치다.
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

/* 걸음. 다리만 번갈아 움직인다 */
.ink .leg.one,
.cut .leg.one {
  animation: stepA var(--step) ease-in-out infinite;
}
.ink .leg.two,
.cut .leg.two {
  animation: stepB var(--step) ease-in-out infinite;
}
.ink .arm.one,
.cut .arm.one {
  animation: stepB var(--step) ease-in-out infinite;
}
.ink .arm.two,
.cut .arm.two {
  animation: stepA var(--step) ease-in-out infinite;
}
@keyframes stepA {
  50% {
    transform: translateY(-1.1px) rotate(7deg);
  }
}
@keyframes stepB {
  50% {
    transform: translateY(-1.1px) rotate(-7deg);
  }
}
.leg,
.arm {
  transform-origin: center top;
  transform-box: fill-box;
}

/* 사람이 늘고 줄 때 */
.walker-enter-active,
.walker-leave-active {
  transition:
    opacity var(--dur-move) var(--ease-out),
    transform var(--dur-move) var(--ease-out);
}
.walker-enter-from,
.walker-leave-to {
  opacity: 0;
  transform: scale(calc(var(--scale) * 0.6));
}

/* ── 고정 프레임 ── */
.frame-label,
.frame-sign {
  position: absolute;
  bottom: 7px;
  margin: 0;
  font-size: 8.5px;
  pointer-events: none;
  /* 어두운 무대든 밝은 무대든 읽히게 */
  mix-blend-mode: difference;
  color: #d8d4cc;
}
.frame-label {
  left: 10px;
  font-family: var(--font-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.frame-sign {
  right: 10px;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 11px;
  letter-spacing: 0.02em;
}

/* 넓게 볼 수 있다는 표시 */
.hint {
  position: absolute;
  top: 8px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  font-size: 9.5px;
  letter-spacing: 0.08em;
  color: #f2ead9;
  background: rgba(12, 14, 18, 0.34);
  border: 1px solid rgba(242, 234, 217, 0.28);
  border-radius: 999px;
  backdrop-filter: blur(4px);
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--dur-state) var(--ease-out);
}
.stage:hover .hint,
.stage:focus-visible .hint,
.stage.open .hint {
  opacity: 1;
}
.hint svg {
  width: 9px;
  height: 6px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  transition: transform var(--dur-move) var(--ease-out);
}
.stage.open .hint svg {
  transform: rotate(180deg);
}

/* ── 무대 고르기 ── */
.picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
}
.arrow {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  color: var(--color-ink-3);
  background: none;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  cursor: pointer;
  transition:
    color var(--dur-state) var(--ease-out),
    border-color var(--dur-state) var(--ease-out);
}
.arrow:hover {
  color: var(--color-ink);
  border-color: var(--color-line-2);
}
.arrow svg {
  width: 11px;
  height: 11px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.dots {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dot {
  width: 5px;
  height: 5px;
  padding: 0;
  background: var(--color-line-2);
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background-color var(--dur-state) var(--ease-out),
    transform var(--dur-state) var(--ease-out);
}
.dot:hover {
  background: var(--color-ink-3);
}
.dot.on {
  background: var(--color-gold);
  transform: scale(1.5);
}

@media (max-width: 560px) {
  .stage {
    height: 116px;
  }
  .figure {
    width: 26px;
    height: 30px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .walker,
  .ink .leg,
  .ink .arm,
  .cut .leg,
  .cut .arm {
    animation: none;
  }
  .walker {
    left: calc(6% + var(--back) * 2.4%);
  }
}
</style>
