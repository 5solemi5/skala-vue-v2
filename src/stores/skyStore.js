import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useConfigStore } from './configStore'
import {
  TIME_VIEWS,
  LENSES,
  isKnownView,
  isKnownLens,
  buildSky,
  withKnobs,
} from '@/components/sky/skyPresets'

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
  const lens = ref(isKnownLens(saved.lens) ? saved.lens : 'plain')

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
      lens: lens.value,
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
  const lenses = computed(() =>
    LENSES.map((l) => ({ ...l, ko: configStore.t(`lens.${l.id}`) })),
  )

  /*
   * 렌즈가 지금 무엇을 보여 주고 있는지 한 줄로.
   * 렌즈를 '분위기' 가 아니라 '정보' 로 두려면 숫자가 같이 나와야 한다.
   */
  const lensNote = computed(() => {
    const r = reading.value
    if (lens.value === 'cloud') return configStore.t('lens.noteCloud', { n: r.clouds })
    if (lens.value === 'rain') return configStore.t('lens.noteRain', { n: r.rainProb })
    if (lens.value === 'wind') return configStore.t('lens.noteWind', { n: r.wind })
    return ''
  })

  function setView(id) {
    if (isKnownView(id)) view.value = id
  }
  function setLens(id) {
    if (isKnownLens(id)) lens.value = id
  }
  function setKnob(key, value) {
    knobs.value = { ...knobs.value, [key]: value }
  }
  function resetKnobs() {
    knobs.value = { ...knobs.value, intensity: 1, speed: 1, grain: 1 }
  }

  watch(
    [view, lens, knobs],
    () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ view: view.value, lens: lens.value, ...knobs.value }),
        )
      } catch {
        // 저장이 막힌 환경에서는 넘어간다
      }
    },
    { deep: true },
  )

  return {
    view,
    lens,
    views,
    lenses,
    knobs,
    sky,
    reading,
    atLabel,
    lensNote,
    setView,
    setLens,
    setKnob,
    resetKnobs,
    setLiveWeather,
    setHourly,
  }
})
