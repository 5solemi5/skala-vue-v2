import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { translate, isKnownLang } from '@/locales'

const STORAGE_KEY = 'skala-chaebi-config'

const loadSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export const useConfigStore = defineStore('config', () => {
  const saved = loadSaved()
  // ─────────────────────────────────────────────
  // [교재 요구사항] 날씨 단위 설정
  // ─────────────────────────────────────────────

  // state: 단위를 저장하는 변수 (초기값은 'celsius')
  // 값은 오직 'celsius' 또는 'fahrenheit' 두 가지만 가진다.
  const unit = ref(saved.unit ?? 'celsius')

  // getters: 현재 단위 상태에 맞춰 화면에 뿌릴 기호(℃ / ℉)를 실시간 리턴
  const unitSymbol = computed(() => {
    return unit.value === 'celsius' ? '℃' : '℉'
  })

  // actions: 버튼 클릭 시 'celsius'와 'fahrenheit'를 토글(스위칭)하는 함수
  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }

  // ─────────────────────────────────────────────
  // [요구사항 4] 내가 추가한 state / getter / action
  // 하는 일(모드)과 언어는 메인 화면과 상세 화면이 함께 봐야 하는 값이라
  // 컴포넌트에 두지 않고 스토어로 옮겼다.
  // ─────────────────────────────────────────────

  // state: 화면 언어. 단위와 똑같이 저장해 두고 다음에 들어와도 그대로 쓴다.
  const lang = ref(isKnownLang(saved.lang) ? saved.lang : 'ko')

  // getter: 컴포넌트가 이 함수 하나만 가져다 쓰면 된다.
  // computed 로 감싸 두면 lang 이 바뀔 때 이 함수를 쓴 화면이 전부 다시 그려진다.
  const t = computed(() => (key, values) => translate(lang.value, key, values))

  // action: 언어 변경
  function setLang(id) {
    if (isKnownLang(id)) lang.value = id
  }

  // ─────────────────────────────────────────────
  // 낮 / 밤 / 시스템
  //
  // 값이 셋인 이유가 있다.
  // 낮·밤 두 개짜리 스위치로 두면 시스템 설정을 따라가는 상태로 되돌아갈 수가 없다.
  // 해 지면 어두워지길 바라는 사람은 'system' 에 두면 되고,
  // 낮에도 어두운 화면을 쓰는 사람은 'dark' 를 못 박아 두면 된다.
  //
  // 기본값은 'system' 이다. 처음 온 사람에게 우리 취향을 밀지 않는다.
  // ─────────────────────────────────────────────
  const THEMES = ['system', 'light', 'dark']
  const isKnownThemeMode = (id) => THEMES.includes(id)
  const theme = ref(isKnownThemeMode(saved.theme) ? saved.theme : 'system')

  // getter: 지금 실제로 어두운 화면인지. 'system' 이면 브라우저에 물어본다
  const prefersDark = ref(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  )
  if (typeof window !== 'undefined' && window.matchMedia) {
    // 사용자가 OS 설정을 바꾸면 새로고침 없이 따라간다
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => (prefersDark.value = e.matches))
  }
  const isDarkNow = computed(() =>
    theme.value === 'system' ? prefersDark.value : theme.value === 'dark',
  )

  const themeList = computed(() =>
    THEMES.map((id) => ({ id, label: t.value(`theme.${id}`) })),
  )

  // action: 테마 변경
  function setTheme(id) {
    if (isKnownThemeMode(id)) theme.value = id
  }

  /*
   * action: 다음 값으로 넘긴다.
   * 헤더에 세 칸을 놓을 자리가 없어서 버튼 하나로 돌려쓴다.
   * system → light → dark → system 순서다.
   */
  function cycleTheme() {
    const i = THEMES.indexOf(theme.value)
    theme.value = THEMES[(i + 1) % THEMES.length]
  }

  /*
   * 지금 어두운지 아닌지를 <html data-theme> 에 적는다.
   *
   * 'system' 일 때 아무것도 안 적고 CSS 의 prefers-color-scheme 에 맡기는 방법도 있다.
   * 처음에 그렇게 했다가 되돌렸다.
   *
   * 그러면 CSS 쪽에서 어두운 상태를 가리키는 선택자가 두 개가 된다.
   *   :root[data-theme='dark']                                    ← 직접 고른 밤
   *   @media (prefers-color-scheme: dark) :root:not([data-theme='light'])  ← 자동
   * 색 한 벌을 두 번씩 적어야 하고, 컴포넌트마다 이 두 줄이 따라다닌다.
   * 하늘 색을 손보면서 한쪽만 고치는 일이 실제로 생겼다.
   *
   * 'system' 을 JS 에서 미리 풀어 확정값만 적으면 선택자가 하나로 줄어든다.
   * 무엇을 골랐는지(theme)와 지금 어떤 화면인지(data-theme)를 따로 둔 셈이다.
   *
   * 대신 JS 가 돌기 전 첫 그림에는 아무 표시가 없어서, 어두운 기기에서
   * 흰 화면이 한 번 번쩍인다. 그건 index.html 의 짧은 스크립트가 막는다.
   */
  watch(
    isDarkNow,
    (dark) => {
      if (typeof document === 'undefined') return
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    },
    { immediate: true },
  )

  // state: 판 아래 마당의 배경. 고른 것은 저장해 둔다.
  const YARD_THEMES = ['meadow', 'seaside', 'night', 'snow', 'city']
  const isKnownTheme = (id) => YARD_THEMES.includes(id)
  const yardTheme = ref(isKnownTheme(saved.yardTheme) ? saved.yardTheme : 'meadow')
  const yardList = computed(() => YARD_THEMES.map((id) => ({ id, label: t.value(`yard.${id}`) })))
  function setYardTheme(id) {
    if (isKnownTheme(id)) yardTheme.value = id
  }

  // state: 사용 가능한 모드 목록과 현재 선택된 모드
  // 이름은 언어를 타므로 id 만 두고 표시용 이름은 그때그때 번역해서 만든다.
  const MODE_IDS = ['repair', 'farm', 'site', 'bike', 'hike', 'baseball', 'laundry']
  const modeList = computed(() =>
    MODE_IDS.map((id) => ({ id, label: t.value(`mode.${id}`) })),
  )

  // 저장된 값이 지금 목록에 없는 경우가 있다.
  // 모드를 바꾸거나 이름을 고치면 예전에 저장된 id 가 그대로 남아
  // 어떤 규칙에도 걸리지 않고 빈 판정만 나온다. 그래서 확인 후 되돌린다.
  const isKnownMode = (id) => MODE_IDS.includes(id)
  const currentMode = ref(isKnownMode(saved.currentMode) ? saved.currentMode : MODE_IDS[0])

  // getter: 현재 모드의 표시용 이름
  const currentModeLabel = computed(() => t.value(`mode.${currentMode.value}`))

  // action: 모드 변경 (목록에 없는 값이 들어오면 무시한다)
  function setMode(modeId) {
    if (isKnownMode(modeId)) {
      currentMode.value = modeId
    }
  }

  // ─────────────────────────────────────────────
  // [요구사항 3 참고] 온도 변환
  // 메인과 상세 양쪽에서 같은 변환식이 필요해서 스토어의 action 으로 뺐다.
  // (교재에서는 각 컴포넌트의 computed 로 두고 Composable 은 범위 제외로 안내되어 있다)
  // ─────────────────────────────────────────────
  // 단위와 모드, 언어는 다시 들어왔을 때도 그대로여야 한다
  watch([unit, currentMode, lang, yardTheme, theme], ([u, m, l, y, th]) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ unit: u, currentMode: m, lang: l, yardTheme: y, theme: th }),
      )
    } catch {
      // 저장이 막힌 환경에서는 넘어간다
    }
  })

  function convertTemp(celsius) {
    if (unit.value === 'fahrenheit') {
      return Math.round((celsius * 9) / 5 + 32) // 화씨 변환 연산
    }
    return celsius // 'celsius'일 때는 원본 그대로 반환
  }

  return {
    unit,
    unitSymbol,
    toggleUnit,
    lang,
    t,
    setLang,
    yardTheme,
    yardList,
    setYardTheme,
    theme,
    themeList,
    isDarkNow,
    setTheme,
    cycleTheme,
    modeList,
    currentMode,
    currentModeLabel,
    setMode,
    convertTemp,
  }
})
