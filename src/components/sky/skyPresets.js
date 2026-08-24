/*
 * 확장자를 붙여 뒀다. 이 파일은 화면 없이도 값을 확인할 수 있어야 해서
 * (해가 하루 동안 어디를 지나는지 표로 찍어 보는 식으로)
 * Vite 를 거치지 않고 node 로 바로 불러올 일이 있다.
 */
import { celestial, toScreen } from '../../utils/celestial.js'

/*
 * 하늘 고르기.
 *
 * 프리셋은 셰이더에 넣을 숫자 묶음이다. 셰이더는 하나뿐이고 여기 값만 바뀐다.
 * 그래서 하늘을 하나 더 만드는 값이 거의 0 이고,
 * 사용자가 손잡이를 돌려 만든 하늘도 여기 프리셋과 똑같은 모양이다.
 *
 * 색은 16진수로 적는다. 셰이더에 넘길 때 0..1 로 바꾼다.
 * 눈으로 고르는 값이라 #2b3a55 가 [0.169, 0.227, 0.333] 보다 낫다.
 *
 * ── 왜 '에디션' 인가 ────────────────────────────────
 * 하늘마다 번호(no)와 이름(en/ko), 그리고 액센트 색을 하나씩 달아 뒀다.
 *
 * 배경 고르기를 설정 항목처럼 두면 한 번 고르고 다시 안 본다.
 * 번호를 붙이면 고르는 일이 '무엇을 켤까' 가 아니라 '어느 판을 펼칠까' 가 된다.
 * 실제로 판이 달라지기도 한다 — accent 는 배경에만 쓰이지 않고
 * 화면의 밑줄과 테두리, 좌표 각인까지 따라간다.
 * 표지만 바꾸고 속은 그대로면 고른 보람이 없다.
 *
 * 판정 세 가지 색(빨강·주황·초록)에는 accent 를 쓰지 않는다.
 * 그 셋은 어느 판을 펼치든 같은 뜻이어야 한다.
 */

export const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const between = (v, lo, hi) => clamp01((v - lo) / (hi - lo))

/*
 * 기본값. 프리셋은 여기서 바꾸고 싶은 것만 적는다.
 * 다 적게 하면 손잡이 하나 늘 때마다 모든 프리셋을 고쳐야 한다.
 */
const BASE = {
  skyTop: '#1b3a5c',
  skyMid: '#3f6b93',
  skyBot: '#9fc0d8',
  sunCol: '#ffd9a0',
  cloudLit: '#ffffff',
  cloudDark: '#7f93ab',
  sun: [0.5, 0.72],
  night: 0,
  moon: 0,
  cloud: 0.35,
  rain: 0,
  snow: 0,
  wind: 0.25,
  aurora: 0,
  stars: 0,
  haze: 0.4,
  // 해·달이 지평선 위에 있는 정도. 0 이면 알맹이가 안 보인다
  orb: 1,
  // 지평선 아래로 내려간 뒤에도 한동안 남는 노을빛
  glow: 1,
  // 달의 밝은 면 비율(0 삭 .. 1 보름)과 차는 쪽 (-1 차는달 / +1 기우는달)
  illum: 1,
  waxing: -1,
}

/*
 * 하늘 목록.
 *
 * follow: true 인 것 하나는 실제 날씨를 따라간다.
 * 나머지는 언제 봐도 그 하늘이다. 비 오는 날에도 오로라를 보고 싶을 수 있다.
 */
export const SKY_PRESETS = [
  {
    id: 'live',
    paper: 'cream',
    display: 'serif',
    epigraphKo: '오늘의 하늘을 그대로 옮겨 적는다.',
    epigraphEn: 'Today’s sky, copied down as it is.',
    no: '000',
    en: 'AUJOURD’HUI',
    ko: '오늘의 하늘',
    accent: '#c8a45c',
    follow: true,
    // 값은 날씨를 받아서 그때그때 만든다 (buildLiveSky)
  },
  {
    id: 'dawn',
    paper: 'cream',
    display: 'serif',
    epigraphKo: '떠난 자만이 돌아올 자리를 얻는다.',
    epigraphEn: 'Only the one who leaves earns a place to return to.',
    no: '001',
    en: 'ODYSSEIA',
    ko: '오디세이아',
    accent: '#e0a878',
    skyTop: '#2b3d63',
    skyMid: '#7a6a92',
    skyBot: '#f0b48a',
    sunCol: '#ffcf9c',
    cloudLit: '#ffd9c0',
    cloudDark: '#6b5f7d',
    sun: [0.2, 0.2],
    night: 0.35,
    cloud: 0.4,
    haze: 0.7,
    stars: 0.25,
  },
  {
    id: 'noon',
    paper: 'linen',
    display: 'sans',
    epigraphKo: '그림자가 가장 짧은 시각. 아무것도 숨지 못한다.',
    epigraphEn: 'The hour of shortest shadows. Nothing can hide.',
    no: '002',
    en: 'MERIDIAN',
    ko: '자오선',
    accent: '#5aa3dc',
    skyTop: '#1f6fbf',
    skyMid: '#4f9fdc',
    skyBot: '#bcdcf2',
    sunCol: '#fff3cf',
    cloudLit: '#ffffff',
    cloudDark: '#8fa8c0',
    sun: [0.5, 0.86],
    cloud: 0.32,
    haze: 0.3,
  },
  {
    id: 'dusk',
    paper: 'rose',
    display: 'serif',
    epigraphKo: '지는 것들은 하나같이 붉다.',
    epigraphEn: 'Everything that sets does so in red.',
    no: '003',
    en: 'LES FLEURS',
    ko: '악의 꽃',
    accent: '#d9695a',
    skyTop: '#20243f',
    skyMid: '#7c4262',
    skyBot: '#e5794b',
    sunCol: '#ffb072',
    cloudLit: '#ffbd8f',
    cloudDark: '#4a3350',
    sun: [0.78, 0.14],
    night: 0.5,
    cloud: 0.48,
    haze: 0.8,
    stars: 0.4,
  },
  {
    id: 'night',
    paper: 'slate',
    display: 'serif',
    epigraphKo: '불을 끄고 나서야 보이는 것이 있다.',
    epigraphEn: 'Some things appear only after the lights go out.',
    no: '004',
    en: 'NOCTURNE',
    ko: '야상곡',
    accent: '#8fa8d8',
    skyTop: '#05080f',
    skyMid: '#0c1526',
    skyBot: '#1d2b42',
    sunCol: '#cfe0ff',
    cloudLit: '#3a4a63',
    cloudDark: '#141c2b',
    sun: [0.72, 0.7],
    night: 1,
    moon: 1,
    cloud: 0.2,
    stars: 1,
    haze: 0.25,
  },
  {
    id: 'aurora',
    paper: 'slate',
    display: 'sans',
    epigraphKo: '하늘이 소리 없이 흔들리는 밤.',
    epigraphEn: 'A night when the sky sways without a sound.',
    no: '005',
    en: 'AURORA',
    ko: '극광',
    accent: '#3fd39a',
    skyTop: '#03060f',
    skyMid: '#071426',
    skyBot: '#0d2138',
    sunCol: '#bcd4ff',
    cloudLit: '#2c3d55',
    cloudDark: '#0a1220',
    sun: [0.2, 0.78],
    night: 1,
    moon: 1,
    cloud: 0.12,
    stars: 1,
    aurora: 1,
    haze: 0.2,
  },
  {
    id: 'storm',
    paper: 'stone',
    display: 'sans',
    epigraphKo: '견디는 것도 하나의 일이다.',
    epigraphEn: 'To endure is also a kind of work.',
    no: '006',
    en: 'TEMPEST',
    ko: '폭풍우',
    accent: '#7f8fa3',
    skyTop: '#171c26',
    skyMid: '#2e3846',
    skyBot: '#59636f',
    sunCol: '#8fa2b8',
    cloudLit: '#6d7b8c',
    cloudDark: '#191f29',
    sun: [0.3, 0.6],
    night: 0.35,
    cloud: 0.95,
    rain: 0.85,
    wind: 0.9,
    haze: 0.6,
  },
  {
    id: 'blizzard',
    paper: 'frost',
    display: 'serif',
    epigraphKo: '흰 것이 쌓이면 길이 지워진다.',
    epigraphEn: 'When white piles up, the road is erased.',
    no: '007',
    en: 'HIVER',
    ko: '겨울',
    accent: '#a9c2d8',
    skyTop: '#5b6b7e',
    skyMid: '#8b9aa9',
    skyBot: '#cdd7e0',
    sunCol: '#e8f0f8',
    cloudLit: '#f0f5f9',
    cloudDark: '#8695a5',
    sun: [0.5, 0.5],
    night: 0.1,
    cloud: 0.9,
    snow: 1,
    wind: 0.85,
    haze: 0.9,
  },
  {
    id: 'ember',
    paper: 'amber',
    display: 'serif',
    epigraphKo: '다 타고 남은 자리가 가장 오래 뜨겁다.',
    epigraphEn: 'What is left after burning stays hot the longest.',
    no: '008',
    en: 'EMBER',
    ko: '잔불',
    accent: '#e0783c',
    skyTop: '#170a10',
    skyMid: '#5a1c22',
    skyBot: '#c2542a',
    sunCol: '#ff9b52',
    cloudLit: '#e07b45',
    cloudDark: '#2c1118',
    sun: [0.62, 0.1],
    night: 0.65,
    cloud: 0.6,
    haze: 0.95,
    stars: 0.5,
  },
  {
    id: 'seafog',
    paper: 'mist',
    display: 'serif',
    epigraphKo: '안개 속에서는 큰 것이 먼저 사라진다.',
    epigraphEn: 'In fog, the large things vanish first.',
    no: '009',
    en: 'WHALE',
    ko: '고래',
    accent: '#8fb0b4',
    skyTop: '#8fa8ae',
    skyMid: '#b6c8cb',
    skyBot: '#dde6e6',
    sunCol: '#f2efe4',
    cloudLit: '#ffffff',
    cloudDark: '#9db0b4',
    sun: [0.42, 0.5],
    cloud: 0.85,
    haze: 1,
    wind: 0.12,
  },
  {
    id: 'ink',
    paper: 'paper',
    display: 'sans',
    epigraphKo: '덜어낸 자리에 남는 것이 뜻이다.',
    epigraphEn: 'What remains after removal is the meaning.',
    no: '010',
    en: 'ENCRE',
    ko: '먹',
    accent: '#8d97a3',
    // 아무것도 방해받고 싶지 않을 때. 색이 없어서 판정 색만 남는다
    skyTop: '#0d1116',
    skyMid: '#161c23',
    skyBot: '#242c35',
    sunCol: '#9aa6b3',
    cloudLit: '#39434f',
    cloudDark: '#12171d',
    sun: [0.5, 0.85],
    night: 0.9,
    moon: 1,
    cloud: 0.25,
    stars: 0.35,
    haze: 0.2,
  },
  {
    id: 'mint',
    paper: 'linen',
    display: 'sans',
    epigraphKo: '찬 것이 먼저 정신을 깨운다.',
    epigraphEn: 'What is cold wakes the mind first.',
    no: '011',
    en: 'MENTHE',
    ko: '박하',
    accent: '#4fbfa0',
    skyTop: '#0d3b3a',
    skyMid: '#1f7a6b',
    skyBot: '#96dcc4',
    sunCol: '#f4ffd9',
    cloudLit: '#ddf6ea',
    cloudDark: '#155048',
    sun: [0.3, 0.74],
    cloud: 0.3,
    haze: 0.35,
  },
]

/*
 * 종이.
 *
 * 에디션이 하늘만 바꾸면 표지만 갈아 끼운 것이다.
 * 골든레코즈가 테마를 속지 곳곳에 스미게 하듯, 지면 색도 같이 옮긴다.
 *
 * 다만 아주 옅게만 민다. 지면이 진해지면 그 위의 글자가 흐려지고,
 * 무엇보다 판정 세 가지 색이 지면 색과 섞여 뜻이 흐려진다.
 * 판정은 어느 판을 펼쳐도 같은 뜻이어야 한다.
 */
export const PAPER_TONES = {
  paper: { light: '#f0f3f5', dark: '#0c151d' },
  cream: { light: '#f5f1e9', dark: '#12140f' },
  linen: { light: '#f2f3ef', dark: '#0d1512' },
  rose: { light: '#f6eeec', dark: '#160f10' },
  slate: { light: '#eef1f5', dark: '#0a0f18' },
  stone: { light: '#f0f1f2', dark: '#101215' },
  frost: { light: '#eef3f7', dark: '#0b131b' },
  amber: { light: '#f7f1e7', dark: '#15100b' },
  mist: { light: '#eef2f2', dark: '#0b1314' },
}

export const isKnownSky = (id) => SKY_PRESETS.some((s) => s.id === id)
export const presetById = (id) => SKY_PRESETS.find((s) => s.id === id) ?? SKY_PRESETS[1]

/*
 * 실제 날씨로 하늘을 만든다.
 *
 * 이 서비스에서 배경이 장식이 아닌 이유가 여기 있다.
 * 전주에 지금 비가 오면 배경이 전주의 강수확률만큼 내리고,
 * 구름이 88% 면 하늘이 그만큼 덮이고, 풍속 8m/s 면 그 속도로 흐른다.
 * 창문을 열지 않고도 바깥이 어떤지 알 수 있게 하는 게 목적이다.
 */
export const buildLiveSky = (weather, date = new Date()) => {
  const w = weather ?? {}
  const cloudPct = (w.clouds ?? 30) / 100
  const rainProb = (w.rainProb ?? 0) / 100
  const windMs = w.wind ?? 2
  const cond = String(w.condition ?? '').toLowerCase()

  const isSnow = cond.includes('snow')
  const isRain = cond.includes('rain') || cond.includes('drizzle') || cond.includes('thunder')
  const isFog = cond.includes('mist') || cond.includes('fog') || cond.includes('haze')

  /*
   * 해와 달의 자리를 실제로 계산한다.
   *
   * 전에는 일출과 일몰 사이를 사인 곡선으로 이어서 해를 왼쪽에서 오른쪽으로
   * 흘려 보냈다. 아침에도 저녁에도 같은 길을 지나고 계절도 없었다.
   * 창에 좌표를 새겨 놓고 그 하늘이 지어낸 것이면 좌표가 거짓말이 된다.
   */
  const lat = w.lat ?? 36.5
  const lon = w.lon ?? 127.5
  const { sun, moon } = celestial(lat, lon, date)

  /*
   * 무엇을 띄울까.
   * 해가 지평선 아래로 충분히 내려갔고 달이 떠 있을 때만 달을 띄운다.
   * 둘 다 없는 시간이 있는데(달이 아직 안 뜬 밤) 그때는 아무것도 안 띄운다.
   * 늘 뭔가 떠 있게 하면 달이 없는 밤이 사라진다.
   */
  const showMoon = sun.alt < -4 && moon.alt > -3
  const body = showMoon ? moon : sun

  // 밤의 정도. 시민박명(-6도)을 지나 -12도쯤에서 완전한 밤이 된다
  const night = 1 - between(sun.alt, -12, 4)

  const lerpHex = (a, b, t) => {
    const A = hexToRgb(a)
    const B = hexToRgb(b)
    const m = A.map((v, i) => v + (B[i] - v) * t)
    return `#${m.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`
  }

  // 흐린 날은 채도를 뺀다. 맑은 날의 파랑을 그대로 두면 흐린 게 안 느껴진다
  const dull = Math.min(0.75, cloudPct * 0.8)

  /*
   * 해가 낮으면 빛이 붉어진다.
   *
   * 전에는 '밤인 정도' 로 노을을 흉내 냈다. 그런데 밤은 해가 지고 한참 뒤에야
   * 짙어지는 값이라, 정작 해가 지평선에 걸린 그 시각에는 아직 낮으로 쳐서
   * 하늘이 푸르스름한 채로 해가 넘어갔다.
   *
   * 붉어지는 건 시각이 아니라 해의 높이가 정한다.
   * 해가 낮으면 빛이 대기를 길게 통과하면서 파란 쪽이 흩어져 없어지고
   * 붉은 쪽만 남는다. 그래서 높이를 그대로 쓴다.
   */
  const low = 1 - between(sun.alt, -6, 20)
  // 노을은 해가 있는 쪽 지평선부터 물든다. 밤이 깊으면 그마저 사라진다
  const sunset = low * between(sun.alt, -10, 0) * 0.85

  const base = {
    top: lerpHex('#1c67b4', '#4a5a6b', dull),
    mid: lerpHex('#5aa3dc', '#77848f', dull),
    bot: lerpHex('#c2dff2', '#b3bcc4', dull),
  }

  return {
    id: 'live',
    skyTop: lerpHex(lerpHex(base.top, '#3d4a72', sunset * 0.5), '#050810', night),
    skyMid: lerpHex(lerpHex(base.mid, '#b5628a', sunset * 0.6), '#0d1728', night),
    skyBot: lerpHex(lerpHex(base.bot, '#f0a06a', sunset), '#20304a', night * 0.85),
    // 한낮에는 흰빛에 가깝고 낮아질수록 짙은 주황으로 간다
    sunCol: showMoon ? '#cfe0ff' : lerpHex('#fff3d4', '#ff7a38', low),
    cloudLit: lerpHex('#ffffff', '#46505c', night * 0.85),
    cloudDark: lerpHex(isRain ? '#5d6a78' : '#8698ac', '#111823', night * 0.9),

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
  }
}

/*
 * 프리셋과 사용자 손잡이를 합쳐 셰이더에 넣을 값 한 벌을 만든다.
 * 손잡이(세기·빠르기·결)는 어떤 하늘을 골랐든 그 위에 얹힌다.
 */
export const resolveSky = ({ preset, live, knobs }) => {
  const base = preset?.follow ? live : preset
  return { ...BASE, ...base, ...knobs }
}
