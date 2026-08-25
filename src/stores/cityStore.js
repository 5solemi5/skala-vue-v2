import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { DEFAULT_CITIES } from '@/api/weatherApi'

const STORAGE_KEY = 'skala-chaebi-cities'

/**
 * 사용자가 보고 있는 지역 목록.
 *
 * 기본값은 교재에서 준 서울·수원·부산에 내가 고른 세 곳을 더한 여섯 곳이다.
 * 여기에 직접 도시를 추가하거나 뺄 수 있고, 그 결과를 localStorage 에 남긴다.
 * 다음에 다시 들어와도 자기가 만든 목록이 그대로 남아 있어야 쓸 만한 서비스가 된다.
 */
/*
 * 같은 자리를 좌표로 알아본다.
 *
 * id 가 어디서 왔느냐에 따라 다르게 붙는다.
 * 기본 목록의 전주는 city_04 이고, 사람을 등록할 때 검색해서 고른 전주는
 * geo_35.824_127.148 이다. 같은 곳인데 id 가 달라서 목록에 두 번 들어갔다.
 *
 * 그러면 같은 곳의 날씨를 두 번 부르고(무료 플랜 호출 제한을 두 배로 쓴다),
 * 실패 안내에도 '전주, 전주' 라고 두 번 나온다.
 *
 * 소수점 세 자리면 100m 남짓이라 같은 동네는 같은 자리로 본다.
 */
const spotKey = (c) => `${c.lat.toFixed(3)},${c.lon.toFixed(3)}`

const dedupe = (list) => {
  const seen = new Set()
  return list.filter((c) => {
    if (c?.lat === undefined) return false
    const k = spotKey(c)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export const useCityStore = defineStore('city', () => {
  const load = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return [...DEFAULT_CITIES]
      const parsed = JSON.parse(saved)
      // 저장된 값이 깨졌을 때를 대비해 최소한의 모양만 확인한다
      if (!Array.isArray(parsed) || parsed.some((c) => !c?.id || c.lat === undefined)) {
        return [...DEFAULT_CITIES]
      }
      return dedupe(parsed)
    } catch {
      return [...DEFAULT_CITIES]
    }
  }

  const cities = ref(dedupe(load()))

  // 목록이 바뀔 때마다 저장한다
  watch(
    cities,
    (list) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
      } catch {
        // 사파리 시크릿 모드처럼 저장이 막힌 경우엔 그냥 넘어간다
      }
    },
    { deep: true },
  )

  // 위쪽 검색에서 결과가 없을 때 그 검색어로 지역 추가를 이어가기 위한 통로
  const pendingQuery = ref('')
  const requestAdd = (query) => {
    pendingQuery.value = query
  }
  const clearPending = () => {
    pendingQuery.value = ''
  }

  const count = computed(() => cities.value.length)
  const has = (id) => cities.value.some((c) => c.id === id)

  /** 같은 자리에 이미 있는 곳. id 가 달라도 좌표가 같으면 같은 곳이다 */
  const atSameSpot = (city) =>
    city?.lat === undefined
      ? null
      : (cities.value.find((c) => spotKey(c) === spotKey(city)) ?? null)

  const addCity = (city) => {
    if (has(city.id) || atSameSpot(city)) return false
    cities.value.push(city)
    return true
  }

  const removeCity = (id) => {
    cities.value = cities.value.filter((c) => c.id !== id)
  }

  const resetCities = () => {
    cities.value = [...DEFAULT_CITIES]
  }

  return {
    atSameSpot,
    cities,
    count,
    has,
    addCity,
    removeCity,
    resetCities,
    pendingQuery,
    requestAdd,
    clearPending,
  }
})
