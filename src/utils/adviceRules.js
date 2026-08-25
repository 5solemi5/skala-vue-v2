import { translate } from '@/locales'
import { groupOf, isPrecipitating } from './weatherCondition'

/**
 * 오늘의 채비 판정 규칙
 *
 * 같은 날씨라도 챙기는 사람에 따라 해야 할 준비가 다르다.
 * 화면 여러 곳에서 같은 규칙을 쓰기 때문에 한곳에 모아 두었다.
 *
 * level 의미
 *  - stop : 오늘은 하지 마세요
 *  - warn : 주의가 필요합니다
 *  - info : 참고하세요
 *  - good : 조건이 좋습니다
 *
 * 이 파일에는 조건만 두고 문구는 locales/advice.*.js 로 옮겼다.
 * 처음에는 규칙과 문장이 같이 있었는데 화면을 한국어·영어로 나누면서
 * 규칙 하나에 언어 수만큼 문장이 붙어 조건이 안 보이게 됐다.
 *
 * ── 기준을 정할 때 지킨 것 ─────────────────────────
 * 1. 숫자에는 이유가 있어야 한다. '적당히 더우면' 이 아니라
 *    '33도 — 폭염주의보 기준' 처럼 근거가 있는 값만 썼다.
 * 2. 문구는 무엇을 하라고 말한다. '더워요' 가 아니라
 *    '12~16시는 피하고 물을 챙기세요' 라고 적는다.
 * 3. 근거를 함께 보인다. 왜 그런 판정인지 숫자로 밝히지 않으면
 *    다음에 같은 날씨를 봐도 스스로 판단할 수 없다.
 */

const LEVEL_ORDER = { stop: 0, warn: 1, info: 2, good: 3 }

/**
 * @param item  도시 한 곳의 날씨 (temp, minTemp, humidity, wind, rainProb, condition)
 * @param mode  하는 일 id
 * @param opts  { lang, unit } — 문구를 만들 때만 쓴다. 판정 자체는 언제나 섭씨 기준.
 */
export const buildAdvice = (item, mode, opts = {}) => {
  const { lang = 'ko', unit = 'celsius' } = opts
  const list = []

  // 기준값은 섭씨로 두고 보여줄 때만 바꾼다.
  // 화씨로 보고 있는데 근거 문장만 섭씨로 나오면 앞뒤가 안 맞는다.
  const deg = (celsius) =>
    unit === 'fahrenheit' ? `${Math.round((celsius * 9) / 5 + 32)}℉` : `${celsius}℃`
  // 차이(일교차·체감 낙폭)는 눈금 폭이라 화씨에서는 1.8배가 된다
  const gap = (celsius) =>
    unit === 'fahrenheit' ? `${Math.round(celsius * 1.8)}℉` : `${celsius}℃`

  const say = (level, key, values = {}) => {
    list.push({
      level,
      key,
      title: translate(lang, `advice.${key}.title`, values),
      desc: translate(lang, `advice.${key}.desc`, values),
    })
  }

  const wind = item.wind ?? 0
  const swing = Math.round((item.temp ?? 0) - (item.minTemp ?? 0))
  /*
   * 바람이 부는 만큼 실제보다 춥게 느껴진다.
   * 정식 체감온도 식은 10도 아래에서만 쓰라고 되어 있어서,
   * 여기서는 초속 1m 마다 1도쯤 더 춥다는 어림으로만 쓴다.
   * 정확한 수치가 아니라 '바람 때문에 더 춥다' 를 말하는 데 쓴다.
   */
  const chill = Math.round((item.temp ?? 0) - wind)
  /*
   * 산 위는 아래보다 춥다.
   * 고도 100m 마다 0.65도씩 낮아지므로 1000m 봉우리면 6~7도 차이가 난다.
   * 등산 판정에서만 쓴다.
   */
  const summit = Math.round((item.temp ?? 0) - 6.5 - wind)

  const g = groupOf(item.condition)
  const wet = isPrecipitating(item.condition)
  const snowing = g === 'snow'
  const foggy = g === 'haze'
  const clear = g === 'clear'

  // 문구에서 자주 쓰는 값들을 미리 만들어 둔다
  const v = {
    humidity: item.humidity,
    rainProb: item.rainProb,
    wind,
    temp: deg(item.temp),
    minTemp: deg(item.minTemp),
    chill: deg(chill),
    summit: deg(summit),
    swing: gap(swing),
    cond: translate(lang, `cond.${g}`),
  }

  // ══════════════════════════════════════════════
  //  일 — 그 사람이 하는 일
  // ══════════════════════════════════════════════

  /*
   * ── 현장 작업 ─────────────────────────────────
   * 건설·설비·도장·조경·정비를 아우른다.
   * 사고로 이어지는 순서대로 본다: 강풍 → 미끄러짐 → 더위 → 추위 → 마감 품질.
   */
  if (mode === 'site') {
    // 타워크레인은 순간풍속 10m/s 에서 설치·해체를 멈추고 15m/s 에서 운전을 멈춘다
    if (wind >= 10) say('stop', 'site.windStop', v)
    else if (wind >= 7) say('warn', 'site.windWarn', v)

    if (wet) say('stop', 'site.precipStop', v)
    else if (item.rainProb >= 60) say('warn', 'site.rainWarn', v)

    // 33도는 폭염주의보 기준. 고용노동부는 이때 시간당 10~15분 휴식을 권한다
    if (item.temp >= 35) say('stop', 'site.heatStop', v)
    else if (item.temp >= 33) say('warn', 'site.heatWarn', v)
    else if (item.temp >= 31) say('info', 'site.heatCare', v)

    if (item.minTemp <= -10) say('stop', 'site.coldStop', v)
    else if (item.minTemp <= 0) say('warn', 'site.freeze', v)

    /*
     * 마감 품질.
     * 예전에 '자동차 정비소' 로 따로 두었던 도장 규칙을 여기로 합쳤다.
     * 도장·미장·방수·콘크리트 양생이 전부 같은 이유로 습도를 탄다.
     */
    if (item.humidity >= 85) say('warn', 'site.finishStop', v)
    else if (item.humidity >= 70) say('info', 'site.finishSlow', v)

    if (foggy) say('warn', 'site.fog', v)

    if (
      !wet && wind < 7 && item.temp >= 5 && item.temp < 31 &&
      item.humidity < 70 && item.rainProb < 40
    ) {
      say('good', 'site.good', v)
    }
  }

  /*
   * ── 농사 ─────────────────────────────────────
   * 노지·시설·과수를 아우른다.
   * 하루를 망치는 순서: 서리 → 방제 실패 → 병해 → 온열.
   */
  if (mode === 'farm') {
    // 서리는 기상관측 높이(1.5m)보다 지면이 더 차서 3도에도 내린다
    if (item.minTemp <= 0) say('stop', 'farm.frostHard', v)
    else if (item.minTemp <= 3) say('stop', 'farm.frost', v)

    // 약을 친 뒤 비가 오면 씻겨 내려가 약효가 없다
    if (item.rainProb >= 50 || wet) say('stop', 'farm.sprayStop', v)
    // 방제는 바람 3m/s 를 넘으면 약제가 옆 밭으로 날아간다
    else if (wind >= 4) say('warn', 'farm.sprayDrift', v)

    if (item.humidity >= 85) say('warn', 'farm.mold', v)

    if (item.temp >= 33) say('stop', 'farm.heatStop', v)
    else if (item.temp >= 31) say('warn', 'farm.heat', v)

    if (wind >= 9) say('warn', 'farm.windDamage', v)
    if (item.rainProb <= 20 && item.humidity < 60 && !wet) say('info', 'farm.water', v)
    if (wet) say('info', 'farm.harvest', v)

    if (
      !wet && item.minTemp > 5 && item.temp < 31 &&
      wind < 4 && item.rainProb < 30 && item.humidity < 80
    ) {
      say('good', 'farm.good', v)
    }
  }

  /*
   * ── 출퇴근 ────────────────────────────────────
   * 늦지 않는 것과 젖지 않는 것.
   * 결빙은 길이 막히는 게 아니라 사고가 나는 문제라 가장 무겁게 본다.
   */
  if (mode === 'commute') {
    if (snowing || (item.minTemp <= 0 && (wet || item.rainProb >= 40))) {
      say('stop', 'commute.iceStop', v)
    } else if (item.minTemp <= 0 && item.humidity >= 80) {
      say('warn', 'commute.blackIce', v)
    }

    if (wet) say('warn', 'commute.rainNow', v)
    else if (item.rainProb >= 60) say('warn', 'commute.rainLikely', v)
    else if (item.rainProb >= 30) say('info', 'commute.umbrella', v)

    if (foggy) say('warn', 'commute.fog', v)
    if (wind >= 9) say('info', 'commute.wind', v)
    if (item.temp >= 33) say('info', 'commute.heat', v)
    if (item.minTemp <= -8) say('warn', 'commute.cold', v)
    if (swing >= 10) say('info', 'commute.swing', v)

    if (!wet && item.rainProb < 30 && wind < 7 && item.minTemp > 0 && item.temp < 31) {
      say('good', 'commute.good', v)
    }
  }

  /*
   * ── 등하교 ────────────────────────────────────
   * 아이는 스스로 옷을 더 챙기지 않는다.
   * 그래서 아침에 무엇을 들려 보낼지에 집중한다.
   */
  if (mode === 'school') {
    if (snowing || item.minTemp <= 0) say('warn', 'school.slip', v)

    if (wet) say('warn', 'school.rainNow', v)
    else if (item.rainProb >= 50) say('warn', 'school.rainLikely', v)

    // 등교할 때 춥고 하교할 때 더우면 겉옷이 없으면 하루 종일 불편하다
    if (swing >= 10) say('warn', 'school.swing', v)

    if (item.temp >= 33) say('warn', 'school.heat', v)
    else if (item.temp >= 31) say('info', 'school.water', v)

    if (item.minTemp <= -5) say('warn', 'school.cold', v)
    if (foggy) say('info', 'school.fog', v)
    if (wind >= 9) say('info', 'school.wind', v)

    if (
      !wet && item.rainProb < 30 && swing < 10 &&
      item.minTemp > 0 && item.temp < 31 && wind < 7
    ) {
      say('good', 'school.good', v)
    }
  }

  /*
   * ── 야구 ─────────────────────────────────────
   * 비에 가장 약하다. 그라운드가 젖으면 경기 자체가 열리지 않는다.
   */
  if (mode === 'baseball') {
    if (wet) say('stop', 'baseball.precipStop', v)
    else if (item.rainProb >= 60) say('stop', 'baseball.rainHigh', v)
    else if (item.rainProb >= 30) say('warn', 'baseball.rainMid', v)

    if (item.temp >= 33) say('warn', 'baseball.hot', v)
    // 낮 경기와 밤 경기의 기온 차가 커서 저녁에 갑자기 춥다
    if (item.minTemp <= 10) say('info', 'baseball.night', v)
    if (wind >= 7) say('info', 'baseball.wind', v)
    if (foggy) say('info', 'baseball.fog', v)

    if (item.rainProb < 30 && item.temp >= 15 && item.temp <= 28 && wind < 7) {
      say('good', 'baseball.good', v)
    }
  }

  /*
   * ── 등산 ─────────────────────────────────────
   * 산 위는 아래와 날씨가 다르다.
   * 아래에서 잰 값으로 판단하면 정상에서 낭패를 본다.
   */
  if (mode === 'hike') {
    if (wet) say('stop', 'hike.precipStop', v)
    else if (item.rainProb >= 50) say('warn', 'hike.rainWarn', v)

    // 능선은 아래보다 두 배쯤 바람이 세다
    if (wind >= 9) say('stop', 'hike.ridgeWind', v)
    else if (wind >= 6) say('warn', 'hike.windWarn', v)

    if (foggy) say('stop', 'hike.fog', v)

    // 정상 기온이 영하로 떨어지면 장갑과 여벌 없이는 위험하다
    if (summit <= 0) say('warn', 'hike.summitFreeze', v)
    else if (summit <= 8) say('info', 'hike.summitCold', v)

    if (item.temp >= 31) say('warn', 'hike.heat', v)
    if (item.minTemp <= 0) say('info', 'hike.iceTrail', v)

    if (
      !wet && item.rainProb < 30 && wind < 6 &&
      summit > 3 && item.temp <= 28
    ) {
      say('good', 'hike.good', v)
    }
  }

  // ══════════════════════════════════════════════
  //  일상 — 오늘 내가 무엇을 할까
  // ══════════════════════════════════════════════

  /*
   * ── 빨래·환기 ─────────────────────────────────
   * 빨래는 습도가 정하고 환기는 안팎의 습도 차가 정한다.
   * 습한 날 창을 열면 오히려 집 안이 눅눅해진다.
   */
  if (mode === 'laundry') {
    if (wet) say('stop', 'laundry.precipStop', v)
    else if (item.rainProb >= 50) say('stop', 'laundry.rainStop', v)
    else if (item.rainProb >= 30) say('warn', 'laundry.rainWarn', v)

    // 습도 80% 가 넘으면 널어 두어도 물이 증발할 자리가 없다
    if (item.humidity >= 80) say('stop', 'laundry.humidStop', v)
    else if (item.humidity >= 65) say('warn', 'laundry.humidWarn', v)

    if (item.humidity >= 80) say('warn', 'laundry.ventStop', v)
    else if (item.humidity < 60 && item.rainProb < 30) say('good', 'laundry.ventGood', v)

    if (wind >= 8) say('warn', 'laundry.windy', v)
    if (item.temp <= 5) say('info', 'laundry.coldAir', v)
    if (item.minTemp <= 0) say('info', 'laundry.freeze', v)

    // 바람이 적당히 있고 건조하면 두꺼운 것까지 마른다
    if (item.humidity < 55 && item.rainProb < 30 && item.temp >= 10 && wind >= 3 && wind < 8) {
      say('good', 'laundry.bedding', v)
    }
  }

  /*
   * ── 산책 ─────────────────────────────────────
   * 우산을 쓰고도 나갈 수 있어서 비에는 관대하고,
   * 더위와 추위에는 엄격하다. 오래 밖에 있기 때문이다.
   */
  if (mode === 'walk') {
    if (item.temp >= 33) say('stop', 'walk.heatStop', v)
    else if (item.temp >= 31) say('warn', 'walk.heatWarn', v)

    if (wet) say('warn', 'walk.rainNow', v)
    else if (item.rainProb >= 60) say('warn', 'walk.rainLikely', v)

    // 바람이 세면 실제 기온보다 훨씬 춥게 느껴진다
    if (chill <= -5) say('stop', 'walk.chillStop', v)
    else if (chill <= 3) say('warn', 'walk.chillWarn', v)

    /*
     * 바람.
     * 처음엔 체감온도만 보면 됐다고 여겼는데, 18도에 12m/s 가 부는 날
     * 체감이 6도라 아무 경고도 안 나왔다. 그 바람에 걸어 보면 안다.
     * 춥지 않아도 부는 것 자체가 걷기를 힘들게 한다.
     */
    if (wind >= 9) say('warn', 'walk.wind', v)

    if (item.minTemp <= 0) say('info', 'walk.icyPath', v)
    if (foggy) say('info', 'walk.fog', v)
    if (swing >= 10) say('info', 'walk.swing', v)

    if (
      item.temp >= 12 && item.temp <= 25 &&
      item.rainProb < 30 && wind < 5 && !wet
    ) {
      say('good', 'walk.good', v)
    }
  }

  /*
   * ── 자전거 ────────────────────────────────────
   * 노면과 바람이 안전에 직결된다.
   * 측풍은 넘어질 수 있어 기온보다 위험하다.
   */
  if (mode === 'bike') {
    if (wet) say('stop', 'bike.precipStop', v)
    else if (item.rainProb >= 60) say('stop', 'bike.rainStop', v)
    else if (item.rainProb >= 30) say('warn', 'bike.rainWarn', v)

    if (wind >= 7) say('stop', 'bike.windStop', v)
    else if (wind >= 4) say('warn', 'bike.windWarn', v)

    if (item.minTemp <= 0) say('warn', 'bike.blackIce', v)

    if (item.temp >= 33) say('stop', 'bike.heatStop', v)
    else if (item.temp >= 31) say('warn', 'bike.heat', v)

    // 달리면 맞바람이 더해져서 서 있을 때보다 훨씬 춥다
    if (chill <= 3) say('warn', 'bike.chill', v)
    else if (item.minTemp <= 5) say('info', 'bike.gloves', v)

    if (foggy) say('warn', 'bike.fog', v)

    if (item.temp >= 12 && item.temp <= 26 && item.rainProb < 30 && wind < 4) {
      say('good', 'bike.good', v)
    }
  }

  /*
   * ── 야외운동 ──────────────────────────────────
   * 숨이 차게 움직이는 일이라 더위에 가장 엄격하다.
   * 습도가 높으면 땀이 증발하지 못해 체온이 안 내려간다.
   */
  if (mode === 'workout') {
    // 습도가 높은 더위는 같은 기온이라도 훨씬 위험하다
    if (item.temp >= 31 && item.humidity >= 75) say('stop', 'workout.humidHeat', v)
    else if (item.temp >= 33) say('stop', 'workout.heatStop', v)
    else if (item.temp >= 30) say('warn', 'workout.heatWarn', v)

    if (wet) say('warn', 'workout.rainNow', v)
    else if (item.rainProb >= 60) say('info', 'workout.indoor', v)

    // 추우면 근육과 심장에 부담이 커서 준비운동을 길게 해야 한다
    if (chill <= -5) say('warn', 'workout.coldStop', v)
    else if (chill <= 5) say('info', 'workout.warmup', v)

    if (wind >= 9) say('warn', 'workout.wind', v)
    if (foggy) say('info', 'workout.fog', v)

    if (
      item.temp >= 13 && item.temp <= 24 &&
      item.humidity < 70 && item.rainProb < 30 && wind < 6
    ) {
      say('good', 'workout.good', v)
    }
  }

  /*
   * ── 세차 ─────────────────────────────────────
   * 비 예보 하나로 판정이 거의 갈린다.
   * 다만 겨울에는 어는 것과 염화칼슘이 더 중요한 문제가 된다.
   */
  if (mode === 'wash') {
    if (wet) say('stop', 'wash.precipStop', v)
    else if (item.rainProb >= 50) say('stop', 'wash.rainStop', v)
    else if (item.rainProb >= 30) say('warn', 'wash.rainWarn', v)

    // 물이 얼면 문틈과 도어락이 얼어붙는다
    if (item.temp <= 0) say('stop', 'wash.freezeStop', v)
    else if (item.minTemp <= -3) say('warn', 'wash.freezeWarn', v)
    // 눈길을 달린 뒤에는 하부에 염화칼슘이 남아 부식된다
    else if (item.minTemp <= 0) say('info', 'wash.saltRust', v)

    // 볕이 강하면 물이 마르면서 얼룩이 남는다
    if (item.temp >= 30 && clear) say('warn', 'wash.spot', v)
    if (wind >= 7) say('warn', 'wash.dust', v)

    if (
      item.rainProb < 20 && !wet && item.temp > 5 && item.temp < 30 && wind < 7
    ) {
      say('good', 'wash.good', v)
    }
  }

  /*
   * ── 나들이·외출 ───────────────────────────────
   * 하루를 통째로 밖에서 보내는 일이라
   * 지금 날씨보다 하루 동안의 변화를 더 본다.
   */
  if (mode === 'outing') {
    if (wet) say('warn', 'outing.rainNow', v)
    else if (item.rainProb >= 60) say('warn', 'outing.rainLikely', v)
    else if (item.rainProb >= 30) say('info', 'outing.umbrella', v)

    if (item.temp >= 33) say('warn', 'outing.heat', v)
    if (chill <= -3) say('warn', 'outing.cold', v)
    // 아침저녁으로 기온이 크게 떨어지면 겉옷 하나로 하루가 달라진다
    if (swing >= 10) say('warn', 'outing.swing', v)

    if (wind >= 9) say('warn', 'outing.wind', v)
    // 전망을 보러 가는 나들이라면 안개가 하루를 정한다
    if (foggy) say('warn', 'outing.fog', v)

    if (
      clear && item.temp >= 15 && item.temp <= 26 &&
      item.rainProb < 20 && wind < 6 && swing < 10
    ) {
      say('good', 'outing.perfect', v)
    } else if (!wet && item.rainProb < 30 && item.temp >= 12 && item.temp <= 28) {
      say('good', 'outing.good', v)
    }
  }

  /*
   * 아무 규칙에도 안 걸린 날.
   *
   * 전에는 '특별히 챙길 것은 없습니다' 한 마디로 끝냈다.
   * 훑어보니 열두 모드 전부에서 그런 조합이 사천 가지 가까이 나왔다.
   * good 조건을 이상적인 날에만 걸리게 좁혀 둔 탓에
   * 나쁘지도 좋지도 않은 넓은 구간이 통째로 비어 있었다.
   *
   * 그 구간이야말로 대부분의 날이다. 모드마다 무난하다는 말을 따로 두고
   * 그 일에 필요한 숫자를 함께 보인다. 나쁘지 않다는 것도 알려 줄 값이다.
   */
  if (list.length === 0) say('good', `${mode}.plain`, v)
  return list
}

/** 가장 무거운 판정이 앞에 오도록 정렬한다. 여러 화면이 같은 순서를 쓴다 */
export const byWeight = (a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]
