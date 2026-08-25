<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import CityHero from '../components/service/CityHero.vue'
import CityRow from '../components/service/CityRow.vue'
import PeopleBoard from '../components/service/PeopleBoard.vue'
import PeopleManager from '../components/service/PeopleManager.vue'
import CityManager from '../components/service/CityManager.vue'
import CityFilter from '../components/service/CityFilter.vue'

import { buildAdvice } from '../utils/adviceRules'
import { fetchAllWeather, fetchHourly, fetchCityWeather } from '../api/weatherApi'
import { useCityStore } from '@/stores/cityStore'
import { usePeopleStore } from '@/stores/peopleStore'
import { useConfigStore } from '@/stores/configStore'
import { useSkyStore } from '@/stores/skyStore'

const router = useRouter()
const route = useRoute()
const configStore = useConfigStore()
const cityStore = useCityStore()
const peopleStore = usePeopleStore()
const skyStore = useSkyStore()

const weatherList = ref([])
const hourlyRows = ref([])
const hourlyAll = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const failedCities = ref([])
const updatedAt = ref('')

// 사람마다 지역이 다르므로 각자 자기 지역 날씨를 따로 받는다
const peopleWeather = ref({})
const selectedPersonId = ref('')
const peopleTools = ref(null)

const searchQuery = ref('')
const selectedCityInfo = ref(configStore.t('home.hint'))
const selectedId = ref('')

const currentMode = computed(() => configStore.currentMode)

/*
 * 창의 큰 판정은 무엇을 따르는가.
 *
 * 사람을 고르고 있으면 그 사람이 하는 일을 따른다.
 * 정비소를 챙기러 들어왔는데 '빨래 널기 좋은 날' 이 큰 글씨로 떠 있으면
 * 무엇을 보러 온 화면인지 알 수 없다.
 *
 * 사람이 아니라 지역을 보고 있을 때(헤더의 '내 위치' 로 들어온 경우)에는
 * 챙길 사람이 없으니 내가 고른 일상 항목을 따른다.
 */
const selectedPerson = computed(
  () => peopleStore.people.find((p) => p.id === selectedPersonId.value) ?? null,
)
const heroMode = computed(() => selectedPerson.value?.modeId ?? configStore.currentMode)

const loadWeather = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { list, failed } = await fetchAllWeather(cityStore.cities, configStore.lang)
    weatherList.value = list
    failedCities.value = failed.map((f) => f.city.name)
    updatedAt.value = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

    /*
     * 선택된 지역이 목록에 없으면 맨 앞으로 되돌린다.
     *
     * 다만 사람을 고른 상태라면 되돌리지 않는다.
     * 호출 제한에 걸려 전주만 못 받아 온 날, 머리에는 '정비소 · 현장 작업' 이
     * 그대로 있는데 창에는 서울이 떠 있었다. 위아래가 어긋나면
     * 무엇을 보고 있는 화면인지 알 수 없다.
     * 그럴 때는 차라리 비워 두고 못 불러왔다고 말하는 편이 낫다.
     */
    if (!list.some((c) => c.id === selectedId.value) && !selectedPersonId.value) {
      selectedId.value = list[0]?.id ?? ''
    }
    loadHourly()
  } catch (error) {
    console.error('날씨 데이터를 불러오지 못했습니다:', error)
    errorMessage.value =
      error.response?.status === 401
        ? configStore.t('home.keyFail')
        : configStore.t('home.loadFailWith', { message: error.message })
  } finally {
    isLoading.value = false
  }
}

// 사람마다 자기 지역 날씨를 받아 둔다
const loadPeople = async () => {
  const list = peopleStore.people
  const results = await Promise.allSettled(
    list.map((p) => fetchCityWeather(p.city, configStore.lang)),
  )
  const map = {}
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') map[list[i].id] = r.value
  })
  peopleWeather.value = map
}

// 선택된 지역의 시간대별 예보만 따로 받는다
const loadHourly = async () => {
  const city = cityStore.cities.find((c) => c.id === selectedId.value)
  if (!city) {
    hourlyRows.value = []
    hourlyAll.value = []
    return
  }
  try {
    const { ahead, all } = await fetchHourly(city)
    hourlyRows.value = ahead
    // 창은 오늘 지나간 시각까지 있어야 '해뜰 때' 를 그릴 수 있다
    hourlyAll.value = all
    skyStore.setHourly(all)
  } catch (error) {
    console.error('시간대별 예보를 불러오지 못했습니다:', error)
    hourlyRows.value = []
    hourlyAll.value = []
  }
}

onMounted(() => {
  if (route.query.search) searchQuery.value = route.query.search
  if (route.query.mode) configStore.setMode(route.query.mode)

  // 등록해 둔 첫 곳을 바로 펼쳐 둔다.
  // 위 카드는 정비소(전주)인데 아래 화면은 서울이 떠 있으면 둘이 따로 노는 것처럼 보인다.
  // 주소로 직접 들어온 경우(?mode=...)에는 그 설정을 존중한다.
  const first = peopleStore.people[0]
  if (first && !route.query.mode && !route.query.city) handlePersonSelect(first)

  loadWeather()
  loadPeople()
})

// 헤더의 '내 위치' 를 누르면 ?city= 를 달고 이 화면으로 온다.
// 이미 이 화면에 있을 때도 눌리므로 onMounted 말고 따로 본다.
watch(
  () => route.query.city,
  (id) => {
    if (!id) return
    selectedPersonId.value = ''
    selectedId.value = id
    const known = weatherList.value.find((c) => c.id === id)
    if (known) selectedCityInfo.value = configStore.t('home.picked', { name: known.name })
  },
  { immediate: true },
)

watch([searchQuery, currentMode], ([newQuery, newMode]) => {
  router.replace({
    path: route.path,
    query: {
      search: newQuery || undefined,
      mode: newMode !== 'repair' ? newMode : undefined,
    },
  })
})

// 지역을 추가하거나 빼면 다시 불러온다
watch(
  () => cityStore.cities.map((c) => c.id).join(','),
  () => loadWeather(),
)

watch(selectedId, () => loadHourly())

// 날씨 설명('튼구름')은 API 가 언어에 맞춰 내려주는 값이라
// 화면 문구만 바꾸면 이 부분만 이전 언어로 남는다. 언어가 바뀌면 다시 받는다.
watch(
  () => configStore.lang,
  () => {
    loadWeather()
    loadPeople()
  },
)

// 사람을 고치거나 추가하면 그 사람 지역 날씨를 다시 받는다
watch(
  () => peopleStore.people.map((p) => `${p.id}:${p.city.id}:${p.modeId}`).join(','),
  () => loadPeople(),
)

// '내 사람들로 바꾸기' 를 누르면 아래 편집 영역으로 데려간다
const goSetup = () => {
  peopleTools.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return weatherList.value
  return weatherList.value.filter((item) => item.name.includes(query))
})

// 판정 문구를 만들 때 필요한 것들. 언어나 단위가 바뀌면 문구도 따라 바뀐다.
const adviceOpts = computed(() => ({ lang: configStore.lang, unit: configStore.unit }))

/* 창에 뜬 지역의 판정. 사람을 고르고 있으면 그 사람 기준이다 */
const heroAdvice = computed(() =>
  selectedCity.value ? buildAdvice(selectedCity.value, heroMode.value, adviceOpts.value) : [],
)

/*
 * 같은 지역, 같은 날씨를 내 일상 기준으로도 본다.
 *
 * 그 사람을 챙기러 들어왔지만 날씨는 나에게도 같다.
 * 빨래를 널지 산책을 갈지는 이 판정이 답한다.
 */
const lifeAdvice = computed(() =>
  selectedCity.value
    ? buildAdvice(selectedCity.value, configStore.currentMode, adviceOpts.value)
    : [],
)

/* 위 판정이 누구의 무엇인지 — '정비소 · 현장 작업' */
const jobLabel = computed(() => {
  const p = selectedPerson.value
  if (!p) return ''
  const job = configStore.modeList.find((m) => m.id === p.modeId)?.label ?? ''
  return `${p.who} · ${job}`
})

const adviceMap = computed(() => {
  const map = {}
  weatherList.value.forEach((item) => {
    map[item.id] = buildAdvice(item, currentMode.value, adviceOpts.value)
  })
  return map
})

const peopleAdvice = computed(() => {
  const map = {}
  peopleStore.people.forEach((p) => {
    const w = peopleWeather.value[p.id]
    if (w) map[p.id] = buildAdvice(w, p.modeId, adviceOpts.value)
  })
  return map
})

const modeLabelById = computed(() =>
  Object.fromEntries(configStore.modeList.map((m) => [m.id, m.label])),
)

const selectedCity = computed(
  () => weatherList.value.find((c) => c.id === selectedId.value) ?? null,
)

const countBy = (level) =>
  filteredWeatherList.value.filter((item) =>
    adviceMap.value[item.id]?.some((a) => a.level === level),
  ).length

const stopCount = computed(() => countBy('stop'))
// '중지'가 걸린 곳은 이미 따로 세므로 '주의'만 남은 곳을 센다
const warnCount = computed(
  () =>
    filteredWeatherList.value.filter((item) => {
      const list = adviceMap.value[item.id] ?? []
      return !list.some((a) => a.level === 'stop') && list.some((a) => a.level === 'warn')
    }).length,
)

// 목록 위에 한 줄 요약을 세워 두면 전체 상황이 먼저 읽힌다.
const summaryLine = computed(() => {
  const total = filteredWeatherList.value.length
  if (!total) return ''
  const parts = []
  if (stopCount.value) parts.push(configStore.t('home.summaryStop', { n: stopCount.value }))
  if (warnCount.value) parts.push(configStore.t('home.summaryWarn', { n: warnCount.value }))
  if (!parts.length) return configStore.t('home.summaryNone', { total })
  return configStore.t('home.summary', { total, parts: parts.join(', ') })
})

watch(selectedCityInfo, (newInfo, oldInfo) => {
  console.log(`[watch] 상태바 문구 변경: "${oldInfo}" -> "${newInfo}"`)
})

watchEffect(() => {
  console.log(`[watchEffect] 현재 검색어 '${searchQuery.value}' 로 목록을 필터링합니다.`)
})

// 일상 항목을 바꾸는 건 사람이 아니라 지역을 보고 있을 때뿐이다
watch(currentMode, () => {
  if (selectedPerson.value) return
  selectedCityInfo.value = configStore.t('home.modeChanged', { mode: configStore.currentModeLabel })
})

// 대상을 고르면 하는 일과 지역이 함께 바뀐다.
// 정비소를 골랐는데 서울 날씨로 판정하던 문제를 여기서 막는다.
const handlePersonSelect = (person) => {
  selectedPersonId.value = person.id
  /*
   * 예전에는 여기서 화면의 모드를 그 사람 것으로 바꿨다.
   * 지금은 목록이 둘로 갈려서(일 / 일상) 그럴 수가 없다.
   * 그 사람의 일은 heroMode 가 알아서 따라가므로 여기서 손대지 않는다.
   */

  /*
   * 그 사람의 지역을 목록에서 찾는다.
   *
   * id 로만 맞추면 안 된다. 같은 전주라도 기본 목록의 것은 city_04 이고
   * 사람을 등록할 때 검색해서 고른 것은 geo_35.824_127.148 이라 서로 못 알아본다.
   * 좌표로 맞춰서, 이미 있는 곳이면 그 지역의 id 를 쓴다.
   *
   * 여기서 person.city.id 를 그대로 넣었더니 목록에 없는 id 가 되어
   * 창이 통째로 비었다. 목록에 있는 id 여야 그 날씨를 찾을 수 있다.
   */
  const same = cityStore.atSameSpot(person.city)
  if (same) {
    selectedId.value = same.id
  } else {
    cityStore.addCity(person.city)
    selectedId.value = person.city.id
  }

  const job = configStore.modeList.find((m) => m.id === person.modeId)?.label ?? ''
  selectedCityInfo.value = `${person.who} · ${person.city.name} · ${job}`
}

const handleSelect = (city) => {
  selectedId.value = city.id
  selectedCityInfo.value = configStore.t('home.picked', { name: city.name })
}

const handleDetail = (city) => {
  router.push(`/weather/${city.id}`)
}
</script>

<template>
  <div class="page">
    <p v-if="errorMessage" class="alert stop">{{ errorMessage }}</p>
    <p v-else-if="failedCities.length" class="alert warn">
      {{ configStore.t('home.partialFail', { names: failedCities.join(', ') }) }}
    </p>

    <div v-if="isLoading && !weatherList.length" class="loading">
      {{ configStore.t('home.loading') }}
    </div>

    <template v-else>
      <!--
        창문이 맨 위로 왔다.

        전에는 사람 카드와 마당, 모드 칸을 지나야 이 판이 나왔다.
        아침에 열었을 때 처음 보이는 게 등록 목록이면 '관리 화면' 이고,
        지금 하늘이면 '오늘' 이다. 매일 열고 싶어지는 건 뒤쪽이다.

        고를 대상(사람 카드)은 바로 아래에 둔다.
        먼저 지금을 보여 주고, 다른 곳이 궁금하면 그때 고르게 한다.
      -->
      <!--
        고른 사람의 지역을 못 불러온 날.
        전에는 조용히 첫 지역(서울)으로 바꿔 버려서
        머리에는 '정비소' 인데 창에는 서울이 뜨는 어긋난 상태가 됐다.
        지금은 바꾸지 않고 사정을 말한다.
      -->
      <div v-if="!selectedCity && selectedPersonId" class="empty">
        <p>{{ configStore.t('home.cityFail') }}</p>
        <button type="button" class="link" @click="loadWeather">
          {{ configStore.t('home.refresh') }}
        </button>
      </div>

      <CityHero
        v-else
        :city="selectedCity"
        :advice-list="heroAdvice"
        :life-advice-list="lifeAdvice"
        :job-label="jobLabel"
        :hourly-rows="hourlyRows"
        :status-text="selectedCityInfo"
        @open-detail="handleDetail"
      />

      <PeopleBoard
        :is-sample="peopleStore.isSample"
        :people="peopleStore.people"
        :weather-by-id="peopleWeather"
        :advice-by-id="peopleAdvice"
        :label-by-id="modeLabelById"
        :selected-id="selectedPersonId"
        @select="handlePersonSelect"
        @setup="goSetup"
      />

      <section class="list">
        <header class="list-head">
          <div>
            <h3>{{ configStore.t('home.others') }}</h3>
            <p v-if="summaryLine" class="summary" :class="{ warn: stopCount > 0 || warnCount > 0 }">
              {{ summaryLine }}
            </p>
          </div>
          <div class="meta">
            <CityFilter v-model="searchQuery" />
            <span v-if="updatedAt" class="tnum">{{ configStore.t('home.asOf', { time: updatedAt }) }}</span>
            <button type="button" class="refresh" :disabled="isLoading" @click="loadWeather">
              {{ configStore.t(isLoading ? 'home.refreshing' : 'home.refresh') }}
            </button>
          </div>
        </header>

        <ul v-if="filteredWeatherList.length" class="rows">
          <CityRow
            v-for="item in filteredWeatherList"
            :key="item.id"
            :city="item"
            :advice-list="adviceMap[item.id]"
            :selected="item.id === selectedId"
            @select="handleSelect"
            @open-detail="handleDetail"
          />
        </ul>

        <div v-else-if="cityStore.count === 0" class="empty">
          <p>{{ configStore.t('home.noCity') }}</p>
          <p class="dim">{{ configStore.t('home.noCityHint') }}</p>
        </div>

        <div v-else class="empty">
          <p>{{ configStore.t('home.noMatch', { query: searchQuery.trim() }) }}</p>
          <button type="button" class="link" @click="cityStore.requestAdd(searchQuery.trim())">
            {{ configStore.t('home.addQuery', { query: searchQuery.trim() }) }}
          </button>
        </div>
      </section>

      <section ref="peopleTools" class="tools">
        <div class="tool">
          <PeopleManager @changed="loadPeople" />
        </div>
        <div class="tool">
          <CityManager />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.alert {
  margin: 0;
  padding: 11px 14px;
  font-size: 13px;
  border-radius: 4px;
}
.alert.stop {
  color: var(--color-stop);
  background: var(--color-stop-soft);
}
.alert.warn {
  color: var(--color-warn);
  background: var(--color-warn-soft);
}

.loading {
  padding: 80px 0;
  text-align: center;
  font-size: 13px;
  color: var(--color-ink-3);
}

.list {
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: 6px;
}
.list-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--color-line);
}
.list-head h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.summary {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--color-ink-2);
}
.summary.warn {
  color: var(--color-stop);
}
.meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  font-size: 11.5px;
  color: var(--color-ink-3);
}
.refresh {
  font-family: inherit;
  font-size: 11.5px;
  color: var(--color-ink-2);
  background: none;
  border: 1px solid var(--color-line-2);
  border-radius: 3px;
  padding: 4px 9px;
  cursor: pointer;
}
.refresh:hover:not(:disabled) {
  border-color: var(--color-ink-3);
  color: var(--color-ink);
}
.refresh:disabled {
  opacity: 0.5;
  cursor: default;
}

.rows {
  margin: 0;
  padding: 0;
  list-style: none;
}

.empty {
  padding: 46px 20px;
  text-align: center;
  font-size: 13.5px;
  color: var(--color-ink-2);
}
.empty p {
  margin: 0 0 6px;
}
.empty .dim {
  color: var(--color-ink-3);
  font-size: 12.5px;
}
.link {
  font-family: inherit;
  font-size: 13px;
  color: var(--color-ink);
  background: none;
  border: 0;
  border-bottom: 1px solid var(--color-line-2);
  padding: 0 0 2px;
  cursor: pointer;
}
.link:hover {
  border-bottom-color: var(--color-ink);
}

.tools {
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: 6px;
}
.tool {
  padding: 20px 22px;
}
.tool + .tool {
  border-top: 1px solid var(--color-line);
}

@media (max-width: 640px) {
  .list-head {
    flex-direction: column;
    gap: 10px;
    padding: 14px;
  }
  .tool {
    padding: 16px;
  }
}
</style>
