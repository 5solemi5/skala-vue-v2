<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { buildAdvice } from '../utils/adviceRules'
import { groupOf } from '../utils/weatherCondition'
import { fetchCityWeather, fetchHourly } from '../api/weatherApi'
import { useConfigStore } from '@/stores/configStore'
import { useCityStore } from '@/stores/cityStore'
import VerdictMark from '../components/service/VerdictMark.vue'
import HourlyBar from '../components/service/HourlyBar.vue'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const cityStore = useCityStore()

const cityData = ref(null)
const hourlyRows = ref([])
const isLoading = ref(false)

// 목록에서 해당 지역을 찾아 실시간 날씨와 시간대별 예보를 받는다
const loadCity = async (id) => {
  const city = cityStore.cities.find((c) => c.id === id)
  if (!city) {
    cityData.value = null
    hourlyRows.value = []
    return
  }

  isLoading.value = true
  try {
    const [current, hourly] = await Promise.all([
      fetchCityWeather(city, configStore.lang),
      fetchHourly(city),
    ])
    cityData.value = current
    // 시간축은 앞날치만 쓴다
    hourlyRows.value = hourly.ahead
  } catch (error) {
    console.error('상세 정보를 불러오지 못했습니다:', error)  // 개발용 로그
    cityData.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadCity(route.params.cityId)
  if (route.query.mode) configStore.setMode(route.query.mode)
})

// 파라미터만 바뀌면 Vue Router 가 같은 컴포넌트를 재사용해서
// onMounted 가 다시 실행되지 않는다. 그래서 따로 감시한다.
watch(
  () => route.params.cityId,
  (newId) => {
    if (newId) loadCity(newId)
  },
)

// 날씨 설명은 API 가 언어에 맞춰 주는 값이라 언어가 바뀌면 다시 받아야 한다
watch(
  () => configStore.lang,
  () => loadCity(route.params.cityId),
)

const order = { stop: 0, warn: 1, info: 2, good: 3 }

// 상세 화면에서만 네 가지 일을 한 번에 비교해 볼 수 있다
const byMode = computed(() => {
  if (!cityData.value) return []
  return configStore.modeList.map((mode) => ({
    id: mode.id,
    label: mode.label,
    advices: [
      ...buildAdvice(cityData.value, mode.id, {
        lang: configStore.lang,
        unit: configStore.unit,
      }),
    ].sort((a, b) => order[a.level] - order[b.level]),
  }))
})

const displayTemp = computed(() =>
  cityData.value ? configStore.convertTemp(cityData.value.temp) : 0,
)
const displayMin = computed(() =>
  cityData.value ? configStore.convertTemp(cityData.value.minTemp) : 0,
)
</script>

<template>
  <div class="detail">
    <button type="button" class="back" @click="router.push('/')">
      <span aria-hidden="true">←</span> {{ configStore.t('detail.back') }}
    </button>

    <div v-if="isLoading" class="state">{{ configStore.t('detail.loading') }}</div>

    <template v-else-if="cityData">
      <header class="head">
        <div>
          <p class="region">{{ cityData.region }}</p>
          <h2>{{ cityData.name }}</h2>
        </div>
        <div class="now">
          <img
            v-if="cityData.icon"
            :src="`https://openweathermap.org/img/wn/${cityData.icon}@2x.png`"
            :alt="cityData.description"
          />
          <p class="deg tnum">
            {{ displayTemp }}<span>{{ configStore.unitSymbol }}</span>
          </p>
        </div>
      </header>

      <dl class="obs">
        <div>
          <dt>{{ configStore.t('detail.weather') }}</dt>
          <dd>{{ cityData.description ?? configStore.t(`cond.${groupOf(cityData.condition)}`) }}</dd>
        </div>
        <div>
          <dt>{{ configStore.t('detail.humidity') }}</dt>
          <dd class="tnum">{{ cityData.humidity }}%</dd>
        </div>
        <div>
          <dt>{{ configStore.t('detail.rainProb') }}</dt>
          <dd class="tnum">{{ cityData.rainProb }}%</dd>
        </div>
        <div>
          <dt>{{ configStore.t('detail.minTemp') }}</dt>
          <dd class="tnum">{{ displayMin }}{{ configStore.unitSymbol }}</dd>
        </div>
        <div>
          <dt>{{ configStore.t('detail.wind') }}</dt>
          <dd class="tnum">{{ cityData.wind }}m/s</dd>
        </div>
        <div>
          <dt>{{ configStore.t('detail.feelsLike') }}</dt>
          <dd class="tnum">
            {{ configStore.convertTemp(cityData.feelsLike) }}{{ configStore.unitSymbol }}
          </dd>
        </div>
      </dl>

      <section v-if="hourlyRows.length" class="block">
        <HourlyBar :rows="hourlyRows" :mode="configStore.currentMode" />
      </section>

      <section class="block">
        <h3>{{ configStore.t('detail.byMode') }}</h3>
        <p class="lead">{{ configStore.t('detail.byModeHint') }}</p>

        <div class="modes">
          <article
            v-for="mode in byMode"
            :key="mode.id"
            class="mode"
            :class="{ on: mode.id === configStore.currentMode }"
          >
            <h4>{{ mode.label }}</h4>
            <ul>
              <li v-for="(advice, i) in mode.advices" :key="i">
                <VerdictMark :level="advice.level" />
                <span class="t">{{ advice.title }}</span>
                <span class="d">{{ advice.desc }}</span>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </template>

    <div v-else class="state">
      <p>{{ configStore.t('detail.notInList') }}</p>
      <p class="dim">{{ configStore.t('detail.notInListHint') }}</p>
    </div>
  </div>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 22px;
  padding: 0;
  font-family: inherit;
  font-size: 12.5px;
  color: var(--color-ink-3);
  background: none;
  border: 0;
  cursor: pointer;
}
.back:hover {
  color: var(--color-ink);
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-line);
}
.region {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--color-ink-3);
}
h2 {
  margin: 4px 0 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.1;
}
.now {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: none;
}
.now img {
  width: 54px;
  height: 54px;
  opacity: 0.85;
}
.deg {
  margin: 0;
  font-size: 46px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1;
}
.deg span {
  margin-left: 2px;
  font-size: 18px;
  font-weight: 500;
  color: var(--color-ink-3);
}

.obs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(120px, 100%), 1fr));
  gap: 0;
  margin: 0;
  border-bottom: 1px solid var(--color-line);
}
.obs > div {
  padding: 16px 14px 16px 0;
}
.obs dt {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--color-ink-3);
}
.obs dd {
  margin: 5px 0 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.block {
  padding: 26px 0;
  border-bottom: 1px solid var(--color-line);
}
.block:last-child {
  border-bottom: 0;
}
.block h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.lead {
  margin: 6px 0 18px;
  font-size: 12.5px;
  color: var(--color-ink-3);
}

.modes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 1px;
  background: var(--color-line);
  border: 1px solid var(--color-line);
  border-radius: 4px;
  overflow: hidden;
}
.mode {
  padding: 16px 16px 18px;
  background: var(--color-paper);
}
.mode.on {
  background: var(--color-paper-2);
}
.mode h4 {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-ink-3);
}
.mode.on h4 {
  color: var(--color-ink);
}
.mode ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mode li {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.mode .t {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
}
.mode .d {
  font-size: 11.5px;
  color: var(--color-ink-3);
  line-height: 1.55;
}

.state {
  padding: 70px 0;
  text-align: center;
  font-size: 13.5px;
  color: var(--color-ink-2);
}
.state p {
  margin: 0 0 6px;
}
.state .dim {
  color: var(--color-ink-3);
  font-size: 12.5px;
}

@media (max-width: 640px) {
  h2 {
    font-size: 25px;
  }
  .deg {
    font-size: 36px;
  }
  .now img {
    width: 42px;
    height: 42px;
  }
}
</style>
