import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useConfigStore } from './configStore'
import { TIME_VIEWS, isKnownView, buildSky, withKnobs } from '@/components/sky/skyPresets'

const STORAGE_KEY = 'skala-chaebi-sky'

const loadSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

/*
 * 창밖을 어떻게 볼까.
 *
 * 고르는 건 '어떤 하늘' 이 아니라 '언제의, 무엇을 보는' 하늘이다.
 * 둘 다 그 사람의 실제 값에서 나오므로 고를수록 그 사람에게 가까워진다.
 */
export const useSkyStore = defineStore('sky', () => {
  const configStore = useConfigStore()
  const saved = loadSaved()

  const view = ref(isKnownView(saved.view) ? saved.view : 'now')

  /*
   * 손잡이.
   * 배경이 거슬리는 날에는 세기를 낮추고, 조용히 보고 싶으면 빠르기를 줄인다.
   */
  const knobs = ref({
    intensity: saved.intensity ?? 1,
    speed: saved.speed ?? 1,
    grain: saved.grain ?? 1,
    scroll: 0,
  })

  // 지금 보고 있는 지역의 날씨와 오늘 시간별 예보
  const liveWeather = ref(null)
  const hourly = ref([])
  const setLiveWeather = (w) => (liveWeather.value = w)
  const setHourly = (rows) => (hourly.value = rows ?? [])

  const now = ref(new Date())
  setInterval(() => (now.value = new Date()), 60 * 1000)

  const built = computed(() =>
    buildSky({
      weather: liveWeather.value,
      hourly: hourly.value,
      view: view.value,
      now: now.value,
    }),
  )

  const sky = computed(() => withKnobs(built.value.sky, knobs.value))
  const reading = computed(() => built.value.reading)

  /** 창이 보여 주고 있는 시각. 그곳의 시계로 읽는다 */
  const atLabel = computed(() => {
    const tz = liveWeather.value?.tz ?? 32400
    const d = new Date(built.value.at.getTime() + tz * 1000)
    const hh = String(d.getUTCHours()).padStart(2, '0')
    const mm = String(d.getUTCMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  })

  const views = computed(() =>
    TIME_VIEWS.map((v) => ({ ...v, ko: configStore.t(`view.${v.id}`) })),
  )
  function setView(id) {
    if (isKnownView(id)) view.value = id
  }
  function setKnob(key, value) {
    knobs.value = { ...knobs.value, [key]: value }
  }
  function resetKnobs() {
    knobs.value = { ...knobs.value, intensity: 1, speed: 1, grain: 1 }
  }

  watch(
    [view, knobs],
    () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ view: view.value, ...knobs.value }),
        )
      } catch {
        // 저장이 막힌 환경에서는 넘어간다
      }
    },
    { deep: true },
  )

  return {
    view,
    views,
    knobs,
    sky,
    reading,
    atLabel,
    setView,
    setKnob,
    resetKnobs,
    setLiveWeather,
    setHourly,
  }
})
