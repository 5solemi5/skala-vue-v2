<script setup>
import { computed, watch } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { useSkyStore } from '@/stores/skyStore'
import { groupOf } from '@/utils/weatherCondition'
import VerdictMark from './VerdictMark.vue'
import HourlyBar from './HourlyBar.vue'
import SkyCanvas from '../sky/SkyCanvas.vue'
import SkyPicker from '../sky/SkyPicker.vue'
import ModeBar from './ModeBar.vue'

const configStore = useConfigStore()
const skyStore = useSkyStore()

const props = defineProps({
  city: { type: Object, default: null },
  adviceList: { type: Array, default: () => [] },
  hourlyRows: { type: Array, default: () => [] },
  statusText: { type: String, default: '' },
})

defineEmits(['open-detail'])

const displayTemp = computed(() => (props.city ? configStore.convertTemp(props.city.temp) : 0))

// 가장 무거운 판정 하나를 대표로 세운다. 나머지는 아래에 목록으로.
const order = { stop: 0, warn: 1, info: 2, good: 3 }
const sorted = computed(() => [...props.adviceList].sort((a, b) => order[a.level] - order[b.level]))
const lead = computed(() => sorted.value[0] ?? null)
// description 이 비어 있을 때만 쓰는 대체 표기
const conditionLabel = computed(() =>
  props.city ? configStore.t(`cond.${groupOf(props.city.condition)}`) : '',
)
const rest = computed(() => sorted.value.slice(1))

/*
 * 창밖은 지금 보고 있는 지역의 하늘이다.
 * 지역을 바꾸면 창도 같이 바뀐다. 서울을 볼 때와 강릉을 볼 때
 * 같은 하늘이 떠 있으면 창이 아니라 벽지다.
 */
watch(
  () => props.city,
  (c) => skyStore.setLiveWeather(c),
  { immediate: true },
)

/*
 * 좌표.
 *
 * 이 화면의 뿌리가 된 다이어리는 표지에 위도·경도를 금박으로 찍는다.
 * 장식으로 넣은 건 아니다. 여기 적힌 좌표가 바로 위 창에 보이는 하늘을
 * 어디서 올려다본 것인지를 밝힌다. 날씨를 어디서 받아 왔는지이기도 하다.
 */
const coord = computed(() => {
  const c = props.city
  if (!c || c.lat === undefined || c.lon === undefined) return ''
  const ns = c.lat >= 0 ? 'N' : 'S'
  const ew = c.lon >= 0 ? 'E' : 'W'
  return `${Math.abs(c.lat).toFixed(4)}° ${ns}  ${Math.abs(c.lon).toFixed(4)}° ${ew}`
})
</script>

<template>
  <section v-if="city" class="hero" :class="lead?.level">
    <!--
      창문.
      판정을 읽는 자리 위에 하늘을 한 칸 잘라 놓았다.
      배경으로 화면 전체에 깔지 않은 건, 글자 뒤에서 계속 움직이는 것이 있으면
      읽는 내내 시야 구석이 시끄럽기 때문이다. 볼 때 보고 읽을 때는 안 본다.
    -->
    <SkyCanvas class="window" :sky="skyStore.sky">
      <!-- 하늘이 밝든 어둡든 글자가 읽히도록 아래쪽을 눌러 둔다 -->
      <div class="pane">
        <!-- 펼친 판. 누르면 다른 판으로 넘길 수 있다 -->
        <div class="ledge">
          <SkyPicker />
        </div>

        <div class="sill">
          <div class="place">
            <p class="region">{{ city.region }}</p>
            <h2>{{ city.name }}</h2>
            <p v-if="coord" class="coord engrave">{{ coord }}</p>
          </div>

          <div class="temp">
            <p class="deg tnum">
              {{ displayTemp }}<span class="unit">{{ configStore.unitSymbol }}</span>
            </p>
            <p class="cond">
              {{ city.description ?? conditionLabel }}
            </p>
          </div>
        </div>
      </div>
    </SkyCanvas>

    <div class="sheet">
      <p class="reading">
        {{ configStore.t('hero.humidity') }} <span class="tnum">{{ city.humidity }}%</span>
        <span class="sep">·</span>
        {{ configStore.t('hero.rainProb') }} <span class="tnum">{{ city.rainProb }}%</span>
        <span class="sep">·</span>
        <span class="tnum">{{ city.wind }}m/s</span>
      </p>

      <!--
        무슨 일을 할 것인가.
        창 바로 아래, 판정 바로 위에 둔다.
        같은 하늘을 보고도 하는 일마다 해야 할 게 달라진다는 게 이 화면의 전부라,
        하늘과 판정 사이가 그 말이 놓일 자리다.
      -->
      <ModeBar class="modes" />

      <div v-if="lead" class="verdict">
        <VerdictMark :level="lead.level" size="lg" />
        <h3>{{ lead.title }}</h3>
        <p class="reason">{{ lead.desc }}</p>
      </div>

      <ul v-if="rest.length" class="rest">
        <li v-for="(advice, i) in rest" :key="i">
          <VerdictMark :level="advice.level" />
          <span class="t">{{ advice.title }}</span>
          <span class="d">{{ advice.desc }}</span>
        </li>
      </ul>

      <HourlyBar
        v-if="hourlyRows.length"
        class="hb"
        :rows="hourlyRows"
        :mode="configStore.currentMode"
      />

      <div class="foot">
        <p class="status" aria-live="polite">{{ statusText }}</p>
        <button type="button" class="more" @click="$emit('open-detail', city)">
          {{ configStore.t('hero.detail') }}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: 6px;
}
/* 판정 등급을 왼쪽 세로선 하나로만 표시한다 */
.hero::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 3;
  width: 3px;
  background: var(--color-line-2);
}
.hero.stop::before {
  background: var(--color-stop);
}
.hero.warn::before {
  background: var(--color-warn);
}
.hero.good::before {
  background: var(--color-good);
}

/* ── 창문 ────────────────────────────────────────── */
.window {
  height: 232px;
}
/*
 * 가림막.
 * 창밖이 한낮이면 하얗고 밤이면 검다. 어느 쪽이든 흰 글자가 읽혀야 하므로
 * 글자가 놓이는 아래쪽만 눌러 둔다. 위쪽은 하늘을 그대로 보여 준다.
 */
.pane {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 16px 26px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(
    180deg,
    rgba(8, 12, 18, 0.34) 0%,
    rgba(8, 12, 18, 0.08) 32%,
    rgba(8, 12, 18, 0.52) 76%,
    rgba(8, 12, 18, 0.72) 100%
  );
  color: #fff;
}

/* 펼친 판을 넘기는 자리. 창 위쪽 끝에 얹는다 */
.ledge {
  display: flex;
  justify-content: flex-start;
}

.modes {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--color-line);
}

.sill {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}
.region {
  margin: 0;
  font-size: var(--fs-2xs);
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.72);
}
h2 {
  margin: 3px 0 0;
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: var(--display-weight);
  letter-spacing: var(--display-spacing);
  line-height: 1.05;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
}
.coord {
  margin: 7px 0 0;
  color: var(--color-gold-lit);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
}

.temp {
  flex: none;
  text-align: right;
}
.deg {
  margin: 0;
  font-size: 56px;
  font-weight: 600;
  letter-spacing: -0.045em;
  line-height: 0.9;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.5);
}
.unit {
  margin-left: 2px;
  font-size: 20px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
}
.cond {
  margin: 7px 0 0;
  font-size: var(--fs-xs);
  color: rgba(255, 255, 255, 0.82);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

/* ── 종이 ───────────────────────────────────────── */
.sheet {
  padding: 20px 30px 22px;
}
.reading {
  margin: 0;
  font-size: var(--fs-sm);
  color: var(--color-ink-2);
}
.sep {
  margin: 0 6px;
  color: var(--color-ink-4);
}

.verdict {
  margin-top: 18px;
}
.verdict h3 {
  margin: 10px 0 0;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: var(--display-weight);
  letter-spacing: var(--display-spacing);
}
.reason {
  margin: 5px 0 0;
  font-size: 14px;
  color: var(--color-ink-2);
  line-height: 1.65;
}

.rest {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.rest li {
  display: flex;
  align-items: baseline;
  gap: 9px;
  flex-wrap: wrap;
  font-size: var(--fs-sm);
}
.rest .t {
  font-weight: 500;
}
.rest .d {
  color: var(--color-ink-3);
  font-size: var(--fs-xs);
}

.hb {
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid var(--color-line);
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid var(--color-line);
}
.status {
  margin: 0;
  font-size: var(--fs-xs);
  color: var(--color-ink-3);
}
.more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 0 2px;
  font-family: inherit;
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--color-ink);
  background: none;
  border: 0;
  /* 펼친 판의 색이 여기까지 온다 */
  border-bottom: 1px solid var(--color-accent);
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--dur-state) var(--ease-out);
}
.more:hover {
  color: var(--color-accent);
}

@media (max-width: 640px) {
  .window {
    height: 190px;
  }
  .pane {
    padding: 13px 18px 15px;
  }
  .sheet {
    padding: 16px 20px 18px;
  }
  .sill {
    gap: 12px;
  }
  h2 {
    font-size: 26px;
  }
  .deg {
    font-size: 42px;
  }
  .verdict h3 {
    font-size: 19px;
  }
  .edition .en {
    letter-spacing: 0.12em;
  }
}
</style>
