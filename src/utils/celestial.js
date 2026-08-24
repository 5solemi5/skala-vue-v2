/*
 * 해와 달이 지금 저 하늘 어디에 있는가.
 *
 * ── 왜 만들었나 ────────────────────────────────────
 * 전에는 일출과 일몰 사이를 사인 곡선으로 이어서 해를 왼쪽에서 오른쪽으로
 * 흘려 보냈다. 시각은 맞았지만 방위가 없었다.
 * 아침에도 저녁에도 해가 같은 길을 지났고, 여름이든 겨울이든 같은 높이였다.
 * 달은 아예 늘 같은 초승달이었다. 보름날에도 초승달이 떠 있었다.
 *
 * 창에 좌표를 새겨 놓고 그 하늘이 지어낸 것이면 좌표가 거짓말이 된다.
 *
 * ── 왜 API 를 안 쓰나 ──────────────────────────────
 * 해와 달의 자리는 위도·경도·시각만 있으면 계산으로 나온다.
 * 값을 받아 오려고 요청을 하나 더 두면 느려지고, 인터넷이 끊기면 하늘이 멈춘다.
 * 아래 식은 천문 연감의 저정밀도 공식이다.
 * 오차가 해는 1분각, 달은 십수 분각쯤 되는데,
 * 화면에서 해의 지름이 백 분의 오 정도라 눈으로는 구분되지 않는다.
 */

const RAD = Math.PI / 180
const DEG = 180 / Math.PI

/** 2000년 1월 1일 정오(J2000)로부터 지난 날수 */
const daysSinceJ2000 = (date) => date.getTime() / 86400000 + 2440587.5 - 2451545.0

/** 황도경사 — 지구 자전축이 공전면에서 기울어진 각. 계절이 여기서 나온다 */
const obliquity = (d) => (23.439 - 0.00000036 * d) * RAD

/** 해의 적경·적위와 황경 */
const solarCoords = (d) => {
  // 평균근점이각 — 궤도 위에서 얼마나 왔나
  const g = (357.529 + 0.98560028 * d) * RAD
  // 평균황경
  const q = 280.459 + 0.98564736 * d
  // 진황경 — 궤도가 원이 아니라서 생기는 어긋남을 두 항으로 보정한다
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD
  const e = obliquity(d)
  return {
    dec: Math.asin(Math.sin(e) * Math.sin(L)),
    ra: Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)),
    lon: L,
  }
}

/** 달의 적경·적위와 황경 */
const lunarCoords = (d) => {
  const L = (218.316 + 13.176396 * d) * RAD // 평균황경
  const M = (134.963 + 13.064993 * d) * RAD // 평균근점이각
  const F = (93.272 + 13.2293 * d) * RAD // 승교점으로부터의 이각
  // 달은 궤도가 많이 찌그러져서 보정 항이 해보다 크다
  const lon = L + 6.289 * RAD * Math.sin(M)
  const lat = 5.128 * RAD * Math.sin(F)
  const e = obliquity(d)
  return {
    ra: Math.atan2(
      Math.sin(lon) * Math.cos(e) - Math.tan(lat) * Math.sin(e),
      Math.cos(lon),
    ),
    dec: Math.asin(Math.sin(lat) * Math.cos(e) + Math.cos(lat) * Math.sin(e) * Math.sin(lon)),
    lon,
  }
}

/** 그 자리에서 하늘이 얼마나 돌아갔나 (지방항성시) */
const siderealTime = (d, lonDeg) => (280.16 + 360.9856235 * d) * RAD + lonDeg * RAD

/**
 * 적경·적위를 그 자리에서 본 고도와 방위로 바꾼다.
 * 고도는 지평선 위로 몇 도, 방위는 북쪽 0도에서 시계 방향으로 몇 도.
 */
const toAltAz = (ra, dec, latDeg, lst) => {
  const H = lst - ra // 시간각
  const lat = latDeg * RAD
  const alt = Math.asin(
    Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H),
  )
  // 이 식은 남쪽을 0 으로 재므로 180 을 더해 북쪽 기준으로 옮긴다
  const az = Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat),
  )
  return { alt: alt * DEG, az: (az * DEG + 180 + 360) % 360 }
}

/**
 * 지금 그 좌표에서 해와 달이 어디에 어떤 모습으로 있는가.
 *
 * phase 는 0 이 삭(그믐), 0.5 가 보름이다.
 * illum 은 눈에 보이는 밝은 부분의 비율 — 삭이면 0, 보름이면 1.
 */
export const celestial = (lat, lon, date = new Date()) => {
  const d = daysSinceJ2000(date)
  const lst = siderealTime(d, lon)

  const s = solarCoords(d)
  const m = lunarCoords(d)

  const sun = toAltAz(s.ra, s.dec, lat, lst)
  const moon = toAltAz(m.ra, m.dec, lat, lst)

  /*
   * 달의 위상은 해와 달이 하늘에서 얼마나 떨어져 있는지로 정해진다.
   * 같은 방향에 있으면(이각 0) 뒤쪽이 밝아 우리는 어두운 면만 본다 — 삭.
   * 정반대에 있으면(이각 180도) 앞면이 온통 밝다 — 보름.
   */
  let elong = (m.lon - s.lon) % (Math.PI * 2)
  if (elong < 0) elong += Math.PI * 2

  return {
    sun,
    moon: {
      ...moon,
      phase: elong / (Math.PI * 2),
      illum: (1 - Math.cos(elong)) / 2,
    },
  }
}

/**
 * 고도·방위를 창의 화면 좌표로 옮긴다.
 *
 * 어느 쪽을 바라보고 있다고 볼 것인가를 정해야 한다.
 * 북반구에서 해는 남쪽 하늘을 지나므로 남쪽을 향해 선 것으로 본다.
 * 남반구는 반대라 북쪽을 본다. 그래야 해가 화면 안에서 뜨고 진다.
 *
 * 좌우로 각각 95도쯤 담는다. 더 넓게 잡으면 해가 가운데에만 머물러
 * 하루 동안 움직이는 게 안 느껴지고, 좁게 잡으면 아침저녁에 화면 밖으로 나간다.
 */
export const toScreen = ({ alt, az }, lat) => {
  const facing = lat >= 0 ? 180 : 0
  let dx = az - facing
  if (dx > 180) dx -= 360
  if (dx < -180) dx += 360

  return [
    0.5 + dx / 190,
    // 지평선은 창 아래 바깥(-0.06)에 둔다. 고도 78도가 창 꼭대기다
    -0.06 + (alt / 78) * 1.06,
  ]
}
