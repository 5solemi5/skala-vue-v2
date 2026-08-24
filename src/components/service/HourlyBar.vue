<script setup>
import { computed, ref, watch } from 'vue'
import { scoreHour, findBestWindow } from '@/utils/hourlyScore'
import { useConfigStore } from '@/stores/configStore'
import VerdictMark from './VerdictMark.vue'

/*
 * 시간축.
 *
 * ── 전에는 이랬다 ────────────────────────────────
 * 열여덟 칸을 같은 높이의 막대로 세우고 판정 색만 칠했다.
 * 위에 시각, 아래에 기온을 10px 글자로 적고, 추천 시간대는 제목 옆에
 * '15시 ~ 18시가 낫습니다' 한 줄로 적어 뒀다.
 *
 * 직접 쓰면서 걸린 것들.
 *
 *  1. 추천 시간대가 축 위에 없었다.
 *     글로는 15시라고 하는데 그게 열여덟 칸 중 어디인지 눈으로 못 찾는다.
 *     시각을 하나하나 세어 가며 짚어야 했다.
 *
 *  2. 지금이 어디인지 몰랐다.
 *     첫 칸이 지금인데 아무 표시가 없어서 두 시간 뒤가 어느 칸인지 세야 했다.
 *
 *  3. 막대가 색만 나르고 있었다.
 *     높이가 다 같아서 하루의 모양이 안 보였다. 기온은 옆의 작은 숫자였다.
 *     열여덟 개의 작은 숫자는 읽히지 않는다.
 *
 *  4. 강수확률이 없었다.
 *     정작 나갈지 말지를 가르는 값인데 축에 없었다.
 *
 * ── 그래서 이렇게 고쳤다 ──────────────────────────
 *  · 추천 구간을 축 위에 띠로 그리고 그 안에 시각을 적는다
 *  · 첫 칸에 '지금' 을 박고 눈금은 세 시간마다만 적는다
 *  · 막대 높이는 기온, 칠은 판정
 *  · 비 올 확률은 아래 별도 줄에 파랑으로
 *  · 막대를 고르면 그 시각의 값이 제목 줄에 나온다
 */
const configStore = useConfigStore()

const props = defineProps({
  rows: { type: Array, default: () => [] },
  mode: { type: String, required: true },
  modeLabel: { type: String, default: '' },
  compact: { type: Boolean, default: false },
})

const scored = computed(() =>
  props.rows.map((row, i) => ({
    ...row,
    index: i,
    level: scoreHour(row, props.mode),
    displayTemp: configStore.convertTemp(row.temp),
  })),
)

/*
 * 막대 높이.
 *
 * 0 부터 재지 않는다. 오늘 기온이 24~31도면 0 부터 그릴 때
 * 막대 여덟 개가 거의 같은 키로 서서 모양이 안 보인다.
 * 보이는 구간의 가장 낮은 값과 높은 값 사이만 펼친다.
 * 대신 바닥을 22% 남겨 둔다. 가장 추운 시각의 막대가 사라지면
 * 그 칸이 비어 있는 건지 값이 없는 건지 구분이 안 된다.
 */
const span = computed(() => {
  const temps = props.rows.map((r) => r.temp)
  if (!temps.length) return { min: 0, max: 1 }
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  return { min, max: max === min ? min + 1 : max }
})
const heightOf = (temp) => {
  const { min, max } = span.value
  return 22 + ((temp - min) / (max - min)) * 78
}

const best = computed(() => findBestWindow(props.rows, props.mode))

// 추천 구간을 축 위에 놓을 자리. 칸 수로 재야 자정을 넘어도 맞는다
const band = computed(() => {
  const b = best.value
  const n = props.rows.length
  if (!b || !n) return null
  return {
    left: (b.fromIndex / n) * 100,
    width: ((b.toIndex - b.fromIndex + 1) / n) * 100,
    label:
      b.fromIndex === b.toIndex
        ? configStore.t('hourly.bandOne', { from: b.from })
        : configStore.t('hourly.bandRange', { from: b.from, to: b.to }),
  }
})

/*
 * 지금 읽고 있는 칸.
 * 아무것도 안 골랐으면 첫 칸(지금)을 읽는다.
 * 아침에 열었을 때 아무것도 안 눌러도 지금 값이 보여야 한다.
 */
const picked = ref(0)
watch(
  () => props.rows.length,
  (n) => {
    if (picked.value >= n) picked.value = 0
  },
)
const readout = computed(() => scored.value[picked.value] ?? null)

// 좌우 화살표로 칸을 옮긴다. 열여덟 개를 탭으로 지나가게 두지 않는다
const move = (delta) => {
  const n = scored.value.length
  if (!n) return
  picked.value = Math.min(n - 1, Math.max(0, picked.value + delta))
}

// 눈금은 세 시간마다. 열여덟 개를 다 적으면 글자가 서로 붙어 안 읽힌다
const isTick = (row) => row.index === 0 || row.hour % 3 === 0
</script>

<template>
  <figure class="hourly" :class="{ compact }">
    <figcaption class="cap">
      <span class="label">{{ configStore.t('hourly.label') }}</span>

      <!-- 고른 시각의 값. 아무것도 안 골랐으면 지금 값 -->
      <span v-if="readout && !compact" class="readout">
        <span class="hh tnum">{{
          readout.index === 0 ? configStore.t('hourly.now') : `${readout.hour}시`
        }}</span>
        <span class="dot" aria-hidden="true">·</span>
        <span class="tnum">{{ readout.displayTemp }}{{ configStore.unitSymbol }}</span>
        <template v-if="readout.rainProb > 0">
          <span class="dot" aria-hidden="true">·</span>
          <span class="rainv tnum">
            {{ configStore.t('hourly.rainShort') }} {{ readout.rainProb }}%
          </span>
        </template>
        <VerdictMark :level="readout.level" />
      </span>
      <span v-else-if="!compact" class="best">{{ configStore.t('hourly.span') }}</span>
    </figcaption>

    <div
      class="chart"
      role="group"
      :aria-label="configStore.t('hourly.aria')"
      @keydown.left.prevent="move(-1)"
      @keydown.right.prevent="move(1)"
      @keydown.home.prevent="picked = 0"
      @keydown.end.prevent="picked = scored.length - 1"
    >
      <!--
        이 사이가 낫습니다.
        마땅한 구간이 없는 날도 있다. 그때는 띠를 그리지 않고
        아래에 그 사실을 한 줄로 적는다. 빈 축만 남기면
        추천이 없는 건지 아직 안 불러온 건지 알 수 없다.
      -->
      <div
        v-if="band && !compact"
        class="band"
        :style="{ left: `${band.left}%`, width: `${band.width}%` }"
      >
        <span class="band-label">{{ band.label }}</span>
      </div>

      <!-- 기온 막대. 칠은 판정 -->
      <div class="temps">
        <button
          v-for="row in scored"
          :key="row.time"
          type="button"
          class="slot"
          :class="[row.level, { on: row.index === picked, now: row.index === 0 }]"
          :tabindex="row.index === picked ? 0 : -1"
          :aria-current="row.index === picked ? 'true' : undefined"
          :aria-label="
            configStore.t('hourly.slotAria', {
              hour: row.hour,
              temp: row.displayTemp,
              rain: row.rainProb,
            })
          "
          @click="picked = row.index"
          @mouseenter="picked = row.index"
          @focus="picked = row.index"
        >
          <span class="bar" :style="{ height: `${heightOf(row.temp)}%` }"></span>
        </button>
      </div>

      <!-- 비 올 확률 -->
      <div v-if="!compact" class="rains" :aria-hidden="true">
        <span v-for="row in scored" :key="`r${row.time}`" class="rslot">
          <span
            v-if="row.rainProb > 0"
            class="rbar"
            :class="{ on: row.index === picked }"
            :style="{ height: `${Math.max(8, row.rainProb)}%` }"
          ></span>
        </span>
      </div>

      <!-- 눈금 -->
      <div v-if="!compact" class="axis" aria-hidden="true">
        <span v-for="row in scored" :key="`a${row.time}`" class="aslot">
          <span v-if="isTick(row)" class="tick tnum" :class="{ first: row.index === 0 }">
            {{ row.index === 0 ? configStore.t('hourly.now') : row.hour }}
          </span>
        </span>
      </div>
    </div>

    <p v-if="!compact" class="foot">
      <span class="rkey">{{ configStore.t('hourly.rain') }}</span>
      <span v-if="!band" class="none">{{ configStore.t('hourly.none') }}</span>
      <span v-else class="hint">{{ configStore.t('hourly.pick') }}</span>
    </p>
  </figure>
</template>

<style scoped>
.hourly {
  margin: 0;
}

/* ── 제목 줄 ── */
.cap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}
.label {
  font-size: var(--fs-2xs);
  letter-spacing: 0.12em;
  color: var(--color-ink-3);
}
.best {
  font-size: var(--fs-xs);
  color: var(--color-ink-3);
}

/* 고른 시각의 값을 읽는 자리 */
.readout {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-sm);
  color: var(--color-ink-2);
}
.readout .hh {
  font-weight: 600;
  color: var(--color-ink);
}
.dot {
  color: var(--color-ink-4);
}
.rainv {
  color: var(--color-rain);
}

/* ── 그림 ── */
.chart {
  position: relative;
}

/*
 * 이 사이가 낫습니다.
 * 막대 뒤에 깔아 두고 테두리만 둘러서, 막대를 가리지 않게 한다.
 */
.band {
  position: absolute;
  top: -2px;
  bottom: 20px;
  z-index: 0;
  border: 1px solid color-mix(in srgb, var(--color-good) 45%, transparent);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-good) 8%, transparent);
  pointer-events: none;
}
.band-label {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  padding: 1px 6px;
  font-size: var(--fs-2xs);
  font-weight: 600;
  white-space: nowrap;
  color: var(--color-good);
  background: var(--color-paper);
  border-radius: 999px;
}

/* ── 기온 막대 ── */
.temps {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 62px;
}
.slot {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding: 0;
  background: none;
  border: 0;
  cursor: pointer;
}
.bar {
  width: 100%;
  border-radius: 2px 2px 0 0;
  background: var(--color-paper-3);
  transition:
    height var(--dur-move) var(--ease-out),
    filter var(--dur-state) var(--ease-out);
}
.slot.good .bar {
  background: var(--color-good);
}
.slot.warn .bar {
  background: var(--color-warn);
}
.slot.stop .bar {
  background: var(--color-stop);
}

/*
 * 고른 칸.
 * 색을 바꾸지 않고 밝기만 올린다. 색을 바꾸면 판정이 바뀐 것처럼 보인다.
 */
.slot:hover .bar,
.slot.on .bar {
  filter: brightness(1.18) saturate(1.1);
}
.slot.on .bar {
  outline: 1.5px solid var(--color-ink);
  outline-offset: 1px;
}

/* 지금. 첫 칸 왼쪽에 선을 세워 시작점을 못 박는다 */
.slot.now {
  box-shadow: inset 1.5px 0 0 var(--color-ink-2);
}

/* ── 비 올 확률 ── */
/*
 * 비 올 확률.
 *
 * 여기 align-items: flex-start 를 두었더니 칸이 내용만큼만 높아졌다.
 * 칸 높이가 0 이 되니 그 안의 막대가 '0 의 70%' 가 되어 아무것도 안 보였다.
 * 칸은 줄 높이만큼 늘어나야 하고(stretch), 막대를 위에서 매다는 건
 * 칸 안에서 할 일이다.
 */
.rains {
  display: flex;
  gap: 2px;
  height: 14px;
  margin-top: 3px;
}
.rslot {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: flex-start;
}
.rbar {
  width: 100%;
  border-radius: 0 0 2px 2px;
  background: var(--color-rain);
  opacity: 0.5;
  transition: opacity var(--dur-state) var(--ease-out);
}
.rbar.on {
  opacity: 1;
}

/* ── 눈금 ── */
.axis {
  display: flex;
  gap: 2px;
  margin-top: 5px;
}
.aslot {
  flex: 1;
  min-width: 0;
  position: relative;
}
.tick {
  position: absolute;
  left: 0;
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  color: var(--color-ink-4);
  white-space: nowrap;
}
.tick.first {
  font-family: var(--font-sans);
  font-weight: 600;
  color: var(--color-ink-2);
}

/* ── 발주 ── */
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin: var(--sp-4) 0 0;
  font-size: var(--fs-2xs);
  color: var(--color-ink-4);
}
.rkey {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-ink-3);
}
.rkey::before {
  content: '';
  width: 9px;
  height: 9px;
  border-radius: 2px;
  background: var(--color-rain);
  opacity: 0.5;
}

/* 오늘은 마땅한 때가 없다는 말. 판정이 아니라 사실이라 색을 쓰지 않는다 */
.none {
  color: var(--color-ink-2);
}

/* ── 카드 안에 작게 들어갈 때 ── */
.compact .temps {
  height: 26px;
}
.compact .cap {
  margin-bottom: var(--sp-2);
}

@media (max-width: 560px) {
  .temps {
    height: 52px;
  }
  /* 좁을 때는 눈금을 여섯 시간마다. 세 시간마다면 숫자가 서로 붙는다 */
  .tick:not(.first) {
    display: none;
  }
  .readout {
    font-size: var(--fs-xs);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar {
    transition: none;
  }
}
</style>
