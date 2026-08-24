import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useConfigStore } from './configStore'
import {
  SKY_PRESETS,
  PAPER_TONES,
  isKnownSky,
  presetById,
  buildLiveSky,
  resolveSky,
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
 * 어느 판을 펼쳐 놓았나.
 *
 * 고른 에디션은 배경만 바꾸지 않는다.
 * 액센트 색과 지면 톤, 표제 서체까지 같이 옮겨서 판이 통째로 달라진다.
 * 그 값들을 <html> 에 얹어 두면 화면 어디서든 var() 로 받아 쓸 수 있다.
 */
export const useSkyStore = defineStore('sky', () => {
  const configStore = useConfigStore()
  const saved = loadSaved()

  const skyId = ref(isKnownSky(saved.skyId) ? saved.skyId : 'live')
  const preset = computed(() => presetById(skyId.value))

  /*
   * 손잡이.
   * 어느 에디션을 골랐든 그 위에 얹힌다.
   * 배경이 거슬리는 날에는 세기를 낮추고, 조용히 보고 싶으면 빠르기를 줄인다.
   */
  const knobs = ref({
    intensity: saved.intensity ?? 1,
    speed: saved.speed ?? 1,
    grain: saved.grain ?? 1,
    scroll: 0,
  })

  // 지금 보고 있는 지역의 날씨. '오늘의 하늘' 을 만드는 재료다
  const liveWeather = ref(null)
  const setLiveWeather = (w) => (liveWeather.value = w)

  /*
   * 지금 시각.
   * 해와 달의 자리를 날짜까지 보고 계산하므로 시각만 넘기면 안 된다.
   * 같은 14시라도 여름과 겨울에 해가 다른 높이에 있다.
   */
  const now = ref(new Date())
  setInterval(() => (now.value = new Date()), 60 * 1000)

  const live = computed(() => buildLiveSky(liveWeather.value, now.value))

  // 셰이더에 그대로 넘길 값 한 벌
  const sky = computed(() =>
    resolveSky({ preset: preset.value, live: live.value, knobs: knobs.value }),
  )

  const editions = computed(() =>
    SKY_PRESETS.map((p) => ({
      id: p.id,
      no: p.no,
      en: p.en,
      ko: p.ko,
      accent: p.accent,
      // 목록에서 미리 보여 줄 색 세 개
      swatch: p.follow
        ? [live.value.skyTop, live.value.skyMid, live.value.skyBot]
        : [p.skyTop, p.skyMid, p.skyBot],
    })),
  )

  const epigraph = computed(() =>
    configStore.lang === 'en' ? preset.value.epigraphEn : preset.value.epigraphKo,
  )

  function setSky(id) {
    if (isKnownSky(id)) skyId.value = id
  }
  function setKnob(key, value) {
    knobs.value = { ...knobs.value, [key]: value }
  }
  function resetKnobs() {
    knobs.value = { ...knobs.value, intensity: 1, speed: 1, grain: 1 }
  }

  /*
   * 고른 판을 화면에 입힌다.
   *
   * 액센트는 밑줄과 테두리, 좌표 각인에 쓴다.
   * 지면은 아주 옅게만 민다 — 진해지면 판정 세 가지 색이 지면과 섞여 뜻이 흐려진다.
   * 판정은 어느 판을 펼쳐도 같은 뜻이어야 한다.
   */
  watch(
    [preset, () => configStore.isDarkNow],
    ([p, dark]) => {
      if (typeof document === 'undefined') return
      const root = document.documentElement
      root.style.setProperty('--color-accent', p.accent)
      const tone = PAPER_TONES[p.paper] ?? PAPER_TONES.paper
      root.style.setProperty('--color-paper-2', dark ? tone.dark : tone.light)
      root.setAttribute('data-display', p.display ?? 'sans')
      root.setAttribute('data-edition', p.id)
    },
    { immediate: true },
  )

  watch(
    [skyId, knobs],
    () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ skyId: skyId.value, ...knobs.value }),
        )
      } catch {
        // 저장이 막힌 환경에서는 넘어간다
      }
    },
    { deep: true },
  )

  return {
    skyId,
    preset,
    editions,
    epigraph,
    knobs,
    sky,
    setSky,
    setKnob,
    resetKnobs,
    setLiveWeather,
  }
})
