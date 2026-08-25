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
  /*
   * 한 화면에 판정이 둘이다.
   *
   *   adviceList      그 사람이 하는 일 기준 — 챙기러 들어온 이유
   *   lifeAdviceList  내가 고른 일상 항목 기준 — 같은 날씨로 내 하루도 본다
   *
   * 처음에는 사람을 고르면 일상 탭을 감췄다. 그런데 화면에 들어오면
   * 첫 사람이 자동으로 골라지고, 선택이 풀리는 건 '내 위치' 로 들어올 때뿐이라
   * 일상 여섯 가지가 사실상 닿을 수 없는 자리에 있었다.
   */
  lifeAdviceList: { type: Array, default: () => [] },
  // 창의 지역 줄에 얹을 사람 이름
  personName: { type: String, default: '' },
  // 아래 판정이 무슨 일 기준인지 — '현장 작업'
  jobLabel: { type: String, default: '' },
  /*
   * 판정이 보고 있는 시각. 지금이면 빈 문자열.
   *
   * 이걸 적어 두지 않으면 화면이 시치미를 뗀다. 막대에서 18시를 눌러 놓고
   * 다른 데를 보다 돌아오면, 왜 '지금' 이 아닌 소리를 하는지 알 길이 없다.
   */
  basisHour: { type: String, default: '' },
  // 막대에서 고른 칸. 판정과 같은 값을 봐야 표시가 어긋나지 않는다
  basisIndex: { type: Number, default: 0 },
  /*
   * 판정이 기대고 있는 날씨 한 벌.
   *
   * 판정 바로 위 숫자 줄이 이걸 읽는다. city 를 읽게 두었더니
   * 6시를 골라 놓았을 때 근거는 '습도 99%' 인데 그 위 줄은 '습도 62%' 였다.
   * 붙어 있는 두 줄이 서로 다른 시각을 말하면 어느 쪽도 믿기 어려워진다.
   */
  basisWeather: { type: Object, default: null },
})

defineEmits(['open-detail', 'pick-hour', 'reset-basis'])

/*
 * 창에 크게 적는 기온.
 *
 * city.temp 를 읽고 있었다. 그건 어느 시각을 보고 있든 '지금' 관측값이라,
 * 해질 때를 눌러도 가장 큰 글씨만 낮 기온에 머물렀다.
 * 바로 아래 '비'·'구름' 도, 옆줄 숫자도 이미 그 시각을 따라가는데
 * 제일 먼저 읽히는 숫자 하나만 딴 시각을 가리키고 있었던 셈이다.
 *
 * 창이 보여 주는 시각의 값을 그대로 읽는다.
 * '지금' 일 때 reading.temp 는 관측값 그 자체여서 보이는 건 달라지지 않는다.
 */
const displayTemp = computed(() =>
  props.city ? configStore.convertTemp(skyStore.reading.temp) : 0,
)

// 가장 무거운 판정 하나를 대표로 세운다. 나머지는 아래에 목록으로.
const order = { stop: 0, warn: 1, info: 2, good: 3 }
const sorted = computed(() => [...props.adviceList].sort((a, b) => order[a.level] - order[b.level]))
const lead = computed(() => sorted.value[0] ?? null)
/*
 * 창 오른쪽에 적는 날씨 설명.
 *
 * '지금' 을 볼 때는 관측해서 받은 문구를 그대로 쓴다 ('온흐림' 처럼 결이 살아 있다).
 * 다른 시각을 볼 때는 그 문구가 지금 것이라 맞지 않는다.
 * 오늘 밤을 보고 있는데 낮에 관측한 '온흐림' 이 떠 있으면 창과 설명이 어긋난다.
 * 그때는 그 시각 예보의 상태를 우리 말로 옮겨 쓴다.
 */
const conditionLabel = computed(() => {
  if (!props.city) return ''
  if (skyStore.view === 'now') {
    return props.city.description ?? configStore.t(`cond.${groupOf(props.city.condition)}`)
  }
  const c = skyStore.reading.condition ?? props.city.condition
  return configStore.t(`cond.${groupOf(c)}`)
})
const rest = computed(() => sorted.value.slice(1))

// 판정 위 숫자 줄이 읽는 값. 시각을 안 골랐으면 지금 값이다
const said = computed(() => props.basisWeather ?? props.city ?? {})

// 일상 판정도 같은 순서로 세운다
const lifeSorted = computed(() =>
  [...props.lifeAdviceList].sort((a, b) => order[a.level] - order[b.level]),
)
const lifeLead = computed(() => lifeSorted.value[0] ?? null)
const lifeRest = computed(() => lifeSorted.value.slice(1))

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
    <div class="frame">
      <SkyCanvas class="window" :sky="skyStore.sky">
        <!-- 하늘이 밝든 어둡든 글자가 읽히도록 아래쪽을 눌러 둔다 -->
        <div class="pane">
          <div class="sill">
            <div class="place">
              <!--
                누구의 하늘인지.
                줄을 새로 만들지 않고 지역 줄 앞에 얹는다.
                처음에는 지역명 위에 한 줄을 따로 뒀는데, 그만큼 아래가 밀려
                원래 잡아 둔 배치가 흐트러졌다. 이름 하나 때문에 판이 바뀔 일은 아니다.
                금색으로 두면 회색 지역명 사이에서 저절로 먼저 읽힌다.
              -->
              <p class="region">
                <span v-if="personName" class="mine">{{ personName }}</span>
                <span v-if="personName" class="sep" aria-hidden="true">·</span>
                {{ city.region }}
              </p>
              <h2>{{ city.name }}</h2>
              <p v-if="coord" class="coord engrave">{{ coord }}</p>
              <!--
                지금 창에 떠 있는 게 몇 시의 하늘인지.
                '해질 때' 를 골라 놓고 그게 몇 시인지 모르면
                그 사람 하루의 어디쯤인지 가늠할 수가 없다.
              -->
              <!--
                지금 창에 떠 있는 게 몇 시의 하늘인지.
                '지금' 을 보고 있을 때만 '그곳은 지금' 이라고 적는다.
                해질 때를 골라 놓고 '그곳은 지금 19:10' 이라고 쓰면 거짓말이 된다.
              -->
              <p class="when engrave">
                <template v-if="skyStore.view === 'now'">
                  {{ configStore.t('view.there') }} {{ skyStore.atLabel }}
                </template>
                <template v-else>
                  {{ skyStore.atLabel }}
                  <span class="when-view">
                    · {{ skyStore.views.find((v) => v.id === skyStore.view)?.ko }}
                  </span>
                </template>
              </p>
              <!--
                창에 떠 있는 하늘이 어떤 값으로 그려졌는지.
                구름을 고르게 하지 않는 대신 숫자를 밝혀 둔다.
                그림이 데이터라는 걸 확인할 수 있어야 창밖이 창밖으로 읽힌다.
              -->
              <p class="figures tnum">
                {{ configStore.t('hero.cloud') }} {{ skyStore.reading.clouds }}%
                <span class="dot" aria-hidden="true">·</span>
                {{ configStore.t('hero.rainProb') }} {{ skyStore.reading.rainProb }}%
                <span class="dot" aria-hidden="true">·</span>
                {{ skyStore.reading.wind }}m/s
              </p>
            </div>

            <div class="temp">
              <p class="deg tnum">
                {{ displayTemp }}<span class="unit">{{ configStore.unitSymbol }}</span>
              </p>
              <p class="cond">{{ conditionLabel }}</p>
            </div>
          </div>
        </div>
      </SkyCanvas>
    </div>

    <!--
      펼친 판을 넘기는 손잡이.

      창 안에 두었더니 눌러도 목록이 안 보였다.
      창은 캔버스를 둥근 모서리에 맞춰 자르려고 overflow: hidden 이 걸려 있는데,
      그 안에서 아래로 펼쳐지는 서랍까지 같이 잘려 나갔다.
      자르는 칸은 창에만 두고 손잡이는 그 위에 따로 얹는다.
    -->
    <div class="ledge">
      <SkyPicker />
    </div>

    <div class="sheet">
      <p class="reading">
        {{ configStore.t('hero.humidity') }} <span class="tnum">{{ said.humidity }}%</span>
        <span class="sep">·</span>
        {{ configStore.t('hero.rainProb') }} <span class="tnum">{{ said.rainProb }}%</span>
        <span class="sep">·</span>
        <span class="tnum">{{ said.wind }}m/s</span>
      </p>

      <!--
        무슨 일을 할 것인가.
        창 바로 아래, 판정 바로 위에 둔다.
        같은 하늘을 보고도 하는 일마다 해야 할 게 달라진다는 게 이 화면의 전부라,
        하늘과 판정 사이가 그 말이 놓일 자리다.
      -->
      <!--
        무엇을 볼까요 — 일상 항목.
        사람을 고르고 있을 때는 감춘다. 그때 판정은 그 사람이 하는 일을 따르므로
        여기서 빨래·산책을 고를 수 있게 두면 위아래가 어긋난다.
      -->
      <!--
        판정이 지금이 아닌 시각을 보고 있을 때만 뜬다.
        평소에는 없는 편이 낫다. 늘 '지금 기준' 이라고 적혀 있으면
        읽히지 않는 글자가 하나 늘 뿐이다.
      -->
      <p v-if="basisHour" class="basis">
        <span class="bh tnum">{{ basisHour }}</span>
        <span class="bt">{{ configStore.t('hero.basis') }}</span>
        <button type="button" class="bnow" @click="$emit('reset-basis')">
          {{ configStore.t('hero.basisNow') }}
        </button>
      </p>

      <!-- ① 그 사람이 하는 일. 이 화면에 들어온 이유다 -->
      <section v-if="lead" class="block">
        <!-- 아래 판정이 무슨 일 기준인지. 누구인지는 창 위에 이미 있다 -->
        <p v-if="jobLabel" class="who-job">{{ jobLabel }}</p>
        <div class="verdict">
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
      </section>

      <!--
        ② 같은 날씨로 내 하루도 본다.
        그 사람을 챙기러 왔지만 날씨는 나에게도 같으니,
        빨래를 널지 산책을 갈지는 여기서 고른다.
      -->
      <section class="block life">
        <ModeBar class="modes" />

        <div v-if="lifeLead" class="verdict small">
          <VerdictMark :level="lifeLead.level" />
          <h3>{{ lifeLead.title }}</h3>
          <p class="reason">{{ lifeLead.desc }}</p>
        </div>

        <ul v-if="lifeRest.length" class="rest">
          <li v-for="(advice, i) in lifeRest" :key="i">
            <VerdictMark :level="advice.level" />
            <span class="t">{{ advice.title }}</span>
            <span class="d">{{ advice.desc }}</span>
          </li>
        </ul>
      </section>

      <HourlyBar
        v-if="hourlyRows.length"
        class="hb"
        :rows="hourlyRows"
        :mode="configStore.currentMode"
        :basis="basisIndex"
        @pick="$emit('pick-hour', $event)"
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
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: 6px;
}

/*
 * 창을 자르는 칸.
 * 자르기를 카드 전체가 아니라 여기에만 걸어야
 * 카드 위에 얹히는 것들(판 고르기 서랍)이 살아남는다.
 */
.frame {
  overflow: hidden;
  border-radius: 5px 5px 0 0;
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
  border-radius: 6px 0 0 6px;
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
  /* 원근이 생기고 나니 높이가 있어야 깊이가 읽힌다 */
  height: 264px;
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
  justify-content: flex-end;
  /*
   * 처음에는 아래쪽을 0.72 까지 눌렀다. 글자는 잘 읽혔지만
   * 하늘 색이 같이 죽어서 한낮의 파랑도 노을의 주황도 갈색으로 탁해졌다.
   * 가림막을 걷고 글자 쪽에 그림자를 주는 편이 낫다.
   * 색을 지우지 않고 글자만 띄운다.
   */
  background: linear-gradient(
    180deg,
    rgba(6, 10, 16, 0.26) 0%,
    rgba(6, 10, 16, 0.02) 30%,
    rgba(6, 10, 16, 0.26) 68%,
    rgba(6, 10, 16, 0.54) 100%
  );
  color: #fff;
}

/* 창 위에 얹히는 손잡이. 잘리는 칸 밖이라 서랍이 아래로 펼쳐질 수 있다 */
.ledge {
  position: absolute;
  top: 16px;
  left: 26px;
  z-index: 5;
}

/*
 * 판정 두 덩이.
 * 사이를 선으로 가른다. 붙여 두면 아래 문장이 위 판정의 딸린 설명처럼 읽힌다.
 */
.block + .block {
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid var(--color-line);
}

.modes {
  margin: 0 0 4px;
}

.sill {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}
/*
 * 지역 줄에 얹은 사람 이름.
 * 줄을 새로 만들지 않는다. 이름 하나 때문에 아래 배치가 밀릴 일은 아니다.
 * 금색으로 두면 회색 지역명 사이에서 저절로 먼저 읽힌다.
 */
.mine {
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--color-gold-lit);
}
.region .sep {
  margin: 0 5px;
  color: rgba(255, 255, 255, 0.42);
}

/*
 * 판정이 기대고 있는 시각.
 * 판정 바로 위, 창 바로 아래. 이 줄 아래로는 전부 이 시각 이야기라는 뜻이다.
 */
.basis {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  padding: 7px 12px;
  background: var(--color-gold-wash, rgba(214, 178, 96, 0.12));
  border-left: 2px solid var(--color-gold-lit);
  border-radius: 0 var(--r-sm, 6px) var(--r-sm, 6px) 0;
}
.bh {
  font-weight: 700;
  font-size: var(--fs-sm);
  color: var(--color-ink);
}
.bt {
  flex: 1;
  font-size: var(--fs-xs);
  color: var(--color-ink-2);
}
.bnow {
  padding: 3px 9px;
  font-family: inherit;
  font-size: var(--fs-2xs);
  color: var(--color-ink-2);
  background: none;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  cursor: pointer;
}
.bnow:hover {
  color: var(--color-ink);
  border-color: var(--color-ink-3);
}

/* 아래 판정이 무슨 일 기준인지. 누구인지는 창 위에 이미 있다 */
.who-job {
  margin: 0 0 12px;
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  letter-spacing: 0.12em;
  color: var(--color-ink-3);
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
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 3px 16px rgba(0, 0, 0, 0.5);
}
.figures {
  margin: 6px 0 0;
  font-size: var(--fs-2xs);
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.74);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
}
.figures .dot {
  margin: 0 5px;
  color: rgba(255, 255, 255, 0.42);
}

.when {
  margin: 4px 0 0;
  color: rgba(242, 234, 217, 0.72);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
}
.when-view {
  color: var(--color-gold-lit);
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
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.5),
    0 3px 18px rgba(0, 0, 0, 0.55);
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
/*
 * 내 일상은 그 사람의 일보다 한 급 작게 둔다.
 * 여기 온 이유는 그 사람이지 내 빨래가 아니다.
 */
.verdict.small h3 {
  font-size: var(--fs-lg);
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
    height: 210px;
  }
  .pane {
    padding: 13px 18px 15px;
  }
  .ledge {
    top: 12px;
    left: 18px;
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
