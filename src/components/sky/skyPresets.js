/*
 * 어느 하늘을 볼까.
 *
 * ── 왜 다시 짰나 ────────────────────────────────────
 * 처음에는 '오디세이아', '악의 꽃' 같은 하늘 열두 판을 만들어 두고 고르게 했다.
 * 보기에는 화려했지만 이 서비스의 전제를 정면으로 깼다.
 *
 * 여기는 멀리 있는 사람의 하늘을 내가 지금 같이 보는 화면이다.
 * 그런데 고를수록 그 사람의 하늘에서 멀어지고 분위기만 남았다.
 * 창밖이 지어낸 것이면 그 아래 새겨 둔 좌표도 같이 거짓말이 된다.
 *
 * ── 그래서 고르는 대상을 바꿨다 ─────────────────────
 * 선택지를 없애지 않고, 전부 '그 사람의 진짜 하늘' 로 채웠다.
 *
 *   언제  지금 · 해뜰 때 · 한낮 · 해질 때 · 오늘 밤
 *         그곳의 실제 일출·일몰 시각으로 계산하고,
 *         그 시각의 실제 예보(구름·비·바람)를 쓴다.
 *
 * 구름·비·바람을 고르게 하지 않는다.
 * 한때 '렌즈' 라는 이름으로 무엇을 도드라지게 볼지 고르게 해 봤는데,
 * 바람이 세면 하늘이 이미 바람 부는 것처럼 보여야지
 * 그걸 보려고 손잡이를 돌릴 이유가 없었다.
 * 값이 그대로 그림이 되게 두고, 숫자는 창 아래에 적는다.
 */
import { celestial, toScreen } from '../../utils/celestial.js'

export const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const toHex = (rgb) =>
  `#${rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('')}`

const mixHex = (a, b, t) => {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return toHex(A.map((v, i) => v + (B[i] - v) * t))
}

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const between = (v, lo, hi) => clamp01((v - lo) / (hi - lo))

/** 언제의 하늘을 볼까 */
export const TIME_VIEWS = [
  { id: 'now', en: 'NOW' },
  { id: 'sunrise', en: 'SUNRISE' },
  { id: 'noon', en: 'NOON' },
  { id: 'sunset', en: 'SUNSET' },
  { id: 'night', en: 'NIGHT' },
]
export const isKnownView = (id) => TIME_VIEWS.some((v) => v.id === id)

/*
 * 그곳의 '오늘 몇 시' 를 절대 시각으로 바꾼다.
 *
 * 브라우저의 시계를 그대로 쓰면 안 된다.
 * 보는 사람이 서울에 있고 챙기는 곳이 다른 나라면
 * '그곳의 아침 6시' 가 내 시계로는 전혀 다른 시각이다.
 * 날씨에 함께 받아 둔 시간대 오프셋으로 옮긴다.
 */
const atLocalHour = (hour, tzSec, now) => {
  const shifted = new Date(now.getTime() + tzSec * 1000)
  const midnightUTC = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  )
  return new Date(midnightUTC + hour * 3600000 - tzSec * 1000)
}

/** 고른 '언제' 가 가리키는 실제 시각 */
export const momentOf = (view, weather, now = new Date()) => {
  const w = weather ?? {}
  const tz = w.tz ?? 32400 // 값이 없으면 한국 기준
  const rise = w.sunrise ?? 6
  const set = w.sunset ?? 18

  switch (view) {
    case 'sunrise':
      return atLocalHour(rise, tz, now)
    case 'noon':
      // 시계의 12시가 아니라 해가 가장 높은 때. 그게 '한낮' 이다
      return atLocalHour((rise + set) / 2, tz, now)
    case 'sunset':
      return atLocalHour(set, tz, now)
    case 'night':
      // 해가 지고 세 시간쯤. 하늘이 완전히 어두워진 뒤다
      return atLocalHour(Math.min(set + 3, 23.5), tz, now)
    default:
      return now
  }
}

/** 그 시각에 가장 가까운 예보 칸 */
const nearestRow = (instant, rows) => {
  let best = null
  let gap = Infinity
  for (const r of rows) {
    const d = Math.abs(r.at.getTime() - instant.getTime())
    if (d < gap) {
      gap = d
      best = r
    }
  }
  return best
}

/*
 * 그 시각의 날씨.
 * 시간별 예보에서 가장 가까운 칸을 찾는다.
 * 한 시간 반 넘게 떨어져 있으면 그 값을 그 시각이라고 부를 수 없으니
 * 지금 값으로 돌아간다. 하늘의 모양(해의 자리)은 어차피 계산으로 정확하다.
 */
const weatherAt = (instant, rows, current, isNow) => {
  /*
   * '지금' 은 예보를 보지 않는다.
   *
   * 두 곳에서 값을 받는데 성격이 다르다.
   *   OpenWeatherMap  지금 실제로 관측된 값
   *   Open-Meteo      시간별로 계산된 예보
   *
   * 지금을 보면서 예보를 쓰면 관측을 두고 추정을 쓰는 셈이다.
   * 실제로 어긋난다 — 하늘이 온흐림(구름 100%)인 시각에
   * 예보 칸은 11% 였다. 창은 맑게 그려지고 오른쪽 설명만 '온흐림' 이었다.
   * 기온도 관측 31도, 예보 29도로 갈렸다.
   *
   * 그래서 지금은 관측한 값을 그대로 쓰고,
   * 관측에 없는 강수확률만 그 시각 예보 칸에서 빌려 온다.
   * (무료 플랜의 현재 날씨에는 강수확률이 없다)
   */
  if (isNow) {
    const near = rows?.length ? nearestRow(instant, rows) : null
    return { ...current, rainProb: near?.rainProb ?? current?.rainProb ?? 0 }
  }
  if (!rows?.length) return current ?? {}
  const best = nearestRow(instant, rows)
  if (!best || Math.abs(best.at.getTime() - instant.getTime()) > 90 * 60 * 1000) {
    return current ?? {}
  }
  return {
    ...current,
    temp: best.temp,
    rainProb: best.rainProb,
    wind: best.wind,
    clouds: best.clouds ?? current?.clouds ?? 30,
    humidity: best.humidity,
    /*
     * 맑은지 비인지도 그 시각 값으로 바꾼다.
     * 이걸 안 바꾸면 지금 비가 온다는 이유로 새벽 하늘에도 비가 내렸다.
     * 값이 없는 칸이면 지금 상태로 둔다.
     */
    condition: best.condition ?? current?.condition,
  }
}

/*
 * 그 사람의 하늘 한 벌.
 *
 * 색을 고르지 않는다. 해의 높이와 구름양, 비, 바람이 색을 정한다.
 * 같은 시각이라도 흐린 날과 맑은 날의 하늘이 다르고,
 * 같은 맑은 날이라도 여름과 겨울의 해 높이가 다르다.
 */
export const buildSky = ({ weather, hourly, view = 'now', now = new Date() }) => {
  const current = weather ?? {}
  const instant = momentOf(view, current, now)
  const w = weatherAt(instant, hourly, current, view === 'now')

  const lat = current.lat ?? 36.5
  const lon = current.lon ?? 127.5
  const { sun, moon } = celestial(lat, lon, instant)

  const cloudPct = (w.clouds ?? 30) / 100
  const rainProb = (w.rainProb ?? 0) / 100
  const windMs = w.wind ?? 2
  const cond = String(w.condition ?? '').toLowerCase()

  const isSnow = cond.includes('snow')
  const isRain = cond.includes('rain') || cond.includes('drizzle') || cond.includes('thunder')
  const isFog = cond.includes('mist') || cond.includes('fog') || cond.includes('haze')

  const showMoon = sun.alt < -4 && moon.alt > -3
  const body = showMoon ? moon : sun

  // 밤의 정도. 시민박명(-6도)을 지나 -12도쯤에서 완전한 밤이 된다
  const night = 1 - between(sun.alt, -12, 4)

  /*
   * 해가 낮으면 빛이 붉어진다.
   * 시각이 아니라 해의 높이가 정한다. 빛이 대기를 길게 통과하면서
   * 파란 쪽이 흩어져 없어지고 붉은 쪽만 남기 때문이다.
   */
  const low = 1 - between(sun.alt, -6, 20)
  const sunset = low * between(sun.alt, -10, 0) * 0.85

  // 흐린 날은 채도를 뺀다. 맑은 날의 파랑을 그대로 두면 흐린 게 안 느껴진다
  const dull = Math.min(0.75, cloudPct * 0.8)
  const base = {
    top: mixHex('#1c67b4', '#4a5a6b', dull),
    mid: mixHex('#5aa3dc', '#77848f', dull),
    bot: mixHex('#c2dff2', '#b3bcc4', dull),
  }

  const sky = {
    skyTop: mixHex(mixHex(base.top, '#3d4a72', sunset * 0.5), '#050810', night),
    skyMid: mixHex(mixHex(base.mid, '#b5628a', sunset * 0.6), '#0d1728', night),
    skyBot: mixHex(mixHex(base.bot, '#f0a06a', sunset), '#20304a', night * 0.85),
    sunCol: showMoon ? '#cfe0ff' : mixHex('#fff3d4', '#ff7a38', low),
    cloudLit: mixHex('#ffffff', '#46505c', night * 0.85),
    cloudDark: mixHex(isRain ? '#5d6a78' : '#8698ac', '#111823', night * 0.9),

    sun: toScreen(body, lat),
    // 알맹이는 지평선 언저리에서 사라지고, 노을빛은 한참 더 남는다
    orb: between(body.alt, -2, 2),
    glow: between(sun.alt, -14, 2),
    moon: showMoon ? 1 : 0,
    illum: showMoon ? moon.illum : 1,
    // 차는 달은 오른쪽이 밝다. 그림자를 왼쪽으로 밀어야 한다
    waxing: moon.phase < 0.5 ? -1 : 1,

    night,
    cloud: Math.max(0.08, isFog ? 0.9 : cloudPct),
    rain: isRain ? Math.max(0.35, rainProb) : 0,
    snow: isSnow ? 0.9 : 0,
    // 12m/s 를 셰이더의 1 로 본다. 그보다 세면 어차피 나가면 안 된다
    wind: Math.min(1, windMs / 12),
    aurora: 0,
    stars: night,
    haze: isFog ? 1 : 0.35 + cloudPct * 0.3,
    speed: 1,
    intensity: 1,
    grain: 1,
    scroll: 0,
  }

  return {
    sky,
    // 창 아래에 적을 값들
    at: instant,
    reading: {
      temp: w.temp,
      clouds: Math.round(w.clouds ?? 30),
      rainProb: Math.round(w.rainProb ?? 0),
      wind: windMs,
      // 그 시각이 맑은지 흐린지. 창 오른쪽 설명이 이걸 따라간다
      condition: w.condition,
      // 지금을 볼 때만 관측한 설명 문구를 그대로 쓸 수 있다
      description: w.description,
    },
  }
}

/** 사용자 손잡이(세기·빠르기·결)를 그 위에 얹는다 */
export const withKnobs = (sky, knobs) => ({
  ...sky,
  intensity: sky.intensity * (knobs.intensity ?? 1),
  speed: sky.speed * (knobs.speed ?? 1),
  grain: knobs.grain ?? 1,
  scroll: knobs.scroll ?? 0,
})
