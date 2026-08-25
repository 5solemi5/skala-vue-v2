import axios from 'axios'

/**
 * 날씨 데이터 수집 계층
 *
 * 두 곳에서 데이터를 받아 하나로 합친다.
 *  - OpenWeatherMap : 현재 기온 / 날씨 상태 / 습도 / 풍속  (교재 요구사항)
 *  - Open-Meteo     : 오늘 최저기온 / 강수확률             (요구사항 3번, 기타 외부 API)
 *
 * OpenWeatherMap 무료 플랜은 '오늘의 강수확률'과 '일 최저기온'을 주지 않는다.
 * 그런데 '오늘의 채비'를 판정하려면 이 두 값이 꼭 필요해서
 * 키 없이 쓸 수 있는 Open-Meteo 를 함께 호출해 보완했다.
 */

const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const OWM_URL = 'https://api.openweathermap.org/data/2.5/weather'
const METEO_URL = 'https://api.open-meteo.com/v1/forecast'
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct'
const METEO_GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const REVERSE_GEO_URL = 'https://api.openweathermap.org/geo/1.0/reverse'

// 처음 접속했을 때 보여줄 기본 지역 (교재 지정 3곳 + 개인 추가 3곳)
export const DEFAULT_CITIES = [
  { id: 'city_01', name: '서울', lat: 37.5665, lon: 126.978, region: '수도권' },
  { id: 'city_02', name: '수원', lat: 37.2636, lon: 127.0286, region: '수도권' },
  { id: 'city_03', name: '부산', lat: 35.1796, lon: 129.0756, region: '영남권' },
  { id: 'city_04', name: '전주', lat: 35.8242, lon: 127.148, region: '호남권' },
  { id: 'city_05', name: '대구', lat: 35.8714, lon: 128.6014, region: '영남권' },
  { id: 'city_06', name: '강릉', lat: 37.7519, lon: 128.8761, region: '강원권' },
]

/*
 * 유닉스 시각을 그 지역의 '몇 시' 로 바꾼다.
 *
 * OpenWeatherMap 은 일출·일몰을 UTC 초로 주고 그 지역이 UTC 에서
 * 몇 초 떨어져 있는지를 timezone 으로 함께 준다.
 * 브라우저의 getHours() 를 쓰면 보는 사람의 시간대로 읽혀서,
 * 다른 나라 지역을 보면 해가 엉뚱한 때에 뜬다.
 */
const hourOf = (unixSec, tzOffsetSec = 0) => {
  const d = new Date((unixSec + tzOffsetSec) * 1000)
  return d.getUTCHours() + d.getUTCMinutes() / 60
}

/** 화면 언어를 OpenWeatherMap 이 알아듣는 값으로 바꾼다 (한국어는 'kr') */
const owmLang = (lang) => (lang === 'en' ? 'en' : 'kr')

/** 한 도시의 현재 날씨 (OpenWeatherMap) */
const fetchCurrent = async (city, lang) => {
  const { data } = await axios.get(OWM_URL, {
    params: {
      lat: city.lat,
      lon: city.lon,
      appid: OWM_KEY,
      units: 'metric',
      lang: owmLang(lang),
    },
  })
  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    wind: Number(data.wind.speed.toFixed(1)),
    /*
     * 아래 셋은 판정에는 안 쓰이고 배경 하늘을 그리는 데 쓰인다.
     * 구름이 덮은 정도만큼 배경이 덮이고, 해는 그 지역의 실제
     * 일출·일몰 시각을 따라 뜨고 진다. 같은 시각이라도 여름과 겨울에
     * 해가 다른 자리에 있어야 창밖처럼 보인다.
     */
    clouds: data.clouds?.all ?? 0,
    // 그곳이 UTC 에서 몇 초 떨어져 있는지. '그곳의 오늘 아침 6시' 를 계산할 때 쓴다
    tz: data.timezone ?? 0,
    sunrise: data.sys?.sunrise ? hourOf(data.sys.sunrise, data.timezone) : 6,
    sunset: data.sys?.sunset ? hourOf(data.sys.sunset, data.timezone) : 18,
    // 판정에 쓰는 값. 언어와 상관없이 늘 같은 영문 코드다.
    condition: data.weather[0].main,
    // 화면에 그대로 뿌리는 설명. 위 lang 에 따라 언어가 바뀌어 온다.
    description: data.weather[0].description,
    icon: data.weather[0].icon,
  }
}

/*
 * 세계기상기구(WMO) 날씨 코드를 이 화면이 쓰는 말로 바꾼다.
 *
 * OpenWeatherMap 은 지금 날씨만 주고 시간별로는 안 준다.
 * Open-Meteo 는 시간별로 이 코드를 주는데 숫자라, 판정 규칙이 알아듣는
 * 영문 이름으로 옮겨 둔다. 이름을 맞춰 두면 지금 날씨든 몇 시간 뒤든
 * 같은 규칙이 그대로 돈다.
 */
const wmoCondition = (code) => {
  if (code === undefined || code === null) return undefined
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Clouds'
  if (code === 45 || code === 48) return 'Fog'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain'
  if (code === 85 || code === 86) return 'Snow'
  if (code >= 95) return 'Thunderstorm'
  return 'Clouds'
}

/** 한 도시의 오늘 최저기온·강수확률 (Open-Meteo, API 키 불필요) */
const fetchDaily = async (city) => {
  const { data } = await axios.get(METEO_URL, {
    params: {
      latitude: city.lat,
      longitude: city.lon,
      daily: 'temperature_2m_min,precipitation_probability_max',
      timezone: 'Asia/Seoul',
      forecast_days: 1,
    },
  })
  return {
    minTemp: Math.round(data.daily.temperature_2m_min[0]),
    rainProb: data.daily.precipitation_probability_max[0] ?? 0,
  }
}

/** 두 API 를 합쳐 화면이 쓰는 형태로 만든다 */
export const fetchCityWeather = async (city, lang = 'ko') => {
  /*
   * 두 곳에서 받는다. 서로 의존하지 않는 요청이라 동시에 보낸다.
   *
   *   OpenWeatherMap  지금 관측된 값 — 기온·바람·습도·하늘 상태
   *   Open-Meteo      오늘의 최저기온과 강수확률
   *
   * 예보가 실패해도 관측은 살린다.
   *
   * Promise.all 로 묶어 두었더니 예보 한 곳이 막히는 순간 관측까지
   * 통째로 버려졌다. 실제로 Open-Meteo 가 429 를 돌려주자 도시가 전부
   * 실패로 처리되어, 관측은 멀쩡히 200 으로 받아 놓고도 화면이
   * '불러오는 중' 에서 멈췄다. 하나가 막혔다고 아는 것까지 버릴 이유는 없다.
   *
   * 예보를 못 받으면 minTemp 와 rainProb 는 null 이다. 0 이 아니다 —
   * 모르는 것을 0 으로 적으면 '비 올 일 없음' 이라고 잘못 말하게 된다.
   */
  const [c, d] = await Promise.allSettled([fetchCurrent(city, lang), fetchDaily(city)])
  if (c.status === 'rejected') throw c.reason
  const current = c.value
  const daily = d.status === 'fulfilled' ? d.value : { minTemp: null, rainProb: null }
  return {
    id: city.id,
    name: city.name,
    region: city.region,
    // 카드에 새길 좌표. 어느 하늘을 보고 있는지 밝히는 값이다
    lat: city.lat,
    lon: city.lon,
    ...current,
    ...daily,
  }
}

/**
 * 목록에 있는 도시를 한 번에 불러온다.
 * Promise.all 은 하나만 실패해도 전부 버려서, 도시 한 곳 때문에 화면이 통째로 비어버린다.
 * allSettled 로 바꿔서 성공한 것만 모으고 실패한 도시는 따로 알려준다.
 */
export const fetchAllWeather = async (cities, lang = 'ko') => {
  const results = await Promise.allSettled(cities.map((city) => fetchCityWeather(city, lang)))
  const ok = []
  const failed = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') ok.push(r.value)
    else failed.push({ city: cities[i], reason: r.reason })
  })
  return { list: ok, failed }
}

/**
 * 지역 이름으로 좌표를 찾는다.
 *
 * 두 곳을 함께 검색한다. 한쪽에만 있는 지역이 꽤 있어서다.
 * 예를 들어 철원은 OpenWeatherMap 에 없고 Open-Meteo 에만 있는데,
 * 반대로 영월은 Open-Meteo 에 없고 OpenWeatherMap 에만 있다.
 * 한 곳만 쓰면 "우리 동네가 안 나온다"는 일이 생긴다.
 */
const searchOwm = async (query, lang) => {
  const { data } = await axios.get(GEO_URL, {
    params: { q: query, limit: 5, appid: OWM_KEY },
  })
  return data.map((c) => ({
    id: `geo_${c.lat.toFixed(3)}_${c.lon.toFixed(3)}`,
    // 영어로 보고 있으면 영문 표기를 먼저 쓴다
    name: lang === 'en' ? c.name : (c.local_names?.ko ?? c.name),
    region: c.state ?? c.country,
    lat: c.lat,
    lon: c.lon,
    from: 'owm',
  }))
}

const searchMeteo = async (query, lang) => {
  const { data } = await axios.get(METEO_GEO_URL, {
    params: { name: query, count: 5, language: lang === 'en' ? 'en' : 'ko', format: 'json' },
  })
  return (data.results ?? [])
    .filter((c) => c.country_code === 'KR')
    .map((c) => ({
      id: `geo_${c.latitude.toFixed(3)}_${c.longitude.toFixed(3)}`,
      name: c.name,
      region: [c.admin1, c.admin2].filter(Boolean).join(' '),
      lat: c.latitude,
      lon: c.longitude,
      from: 'meteo',
    }))
}

export const searchCity = async (query, lang = 'ko') => {
  const results = await Promise.allSettled([searchOwm(query, lang), searchMeteo(query, lang)])
  const found = results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value)

  // 좌표가 거의 같은 결과는 한 번만 보여준다
  const seen = new Set()
  return found.filter((c) => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })
}

/**
 * 좌표로 지역 이름을 찾는다 (OpenWeatherMap 역지오코딩).
 *
 * 브라우저가 주는 건 위도·경도뿐이라 화면에 "37.5665, 126.978" 이라고 쓸 수는 없다.
 * 좌표를 사람이 아는 이름으로 바꿔야 "지금 계신 곳: 서울" 이 된다.
 */
export const reverseGeocode = async (lat, lon, lang = 'ko') => {
  const { data } = await axios.get(REVERSE_GEO_URL, {
    params: { lat, lon, limit: 1, appid: OWM_KEY },
  })
  const found = data?.[0]
  if (!found) return null
  return {
    id: `geo_${lat.toFixed(3)}_${lon.toFixed(3)}`,
    name: lang === 'en' ? found.name : (found.local_names?.ko ?? found.name),
    region: found.state ?? found.country ?? '',
    lat,
    lon,
  }
}

/**
 * 한 지역의 시간대별 예보 (Open-Meteo).
 * 하루 중 언제 괜찮은지 보려면 하루 한 덩어리 값으로는 부족해서 따로 받는다.
 * 저녁에 들어와도 쓸모 있도록 현재 시각부터 18시간을 보여준다.
 */
export const fetchHourly = async (city) => {
  const { data } = await axios.get(METEO_URL, {
    params: {
      latitude: city.lat,
      longitude: city.lon,
      hourly:
        'temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,cloud_cover,weather_code',
      timezone: 'Asia/Seoul',
      forecast_days: 2,
      /*
       * 오늘 지나간 시각도 함께 받는다.
       * 창에서 '해뜰 때' 를 보려면 오늘 아침 6시의 구름양이 있어야 하는데,
       * 앞날치만 받으면 오후에 열었을 때 그 시각이 이미 지나 있어 빈다.
       */
      past_days: 1,
    },
  })

  const h = data.hourly
  const now = new Date()

  const all = h.time.map((t, i) => ({
    at: new Date(t),
    time: t.slice(11, 16),
    hour: Number(t.slice(11, 13)),
    temp: Math.round(h.temperature_2m[i]),
    humidity: h.relative_humidity_2m[i],
    rainProb: h.precipitation_probability[i] ?? 0,
    wind: Number((h.wind_speed_10m[i] ?? 0).toFixed(1)),
    clouds: h.cloud_cover?.[i] ?? null,
    // 그 시각이 맑은지 비인지 눈인지. 시각을 옮겨 볼 때 이게 없으면
    // 지금 비가 온다는 이유로 새벽 하늘에도 비가 내린다
    condition: wmoCondition(h.weather_code?.[i]),
  }))

  /*
   * 두 벌로 나눠 돌려준다.
   *   ahead  앞으로 열여덟 시간 — 시간축이 쓴다
   *   all    오늘 지나간 시각까지 — 창이 '해뜰 때' 를 그릴 때 쓴다
   */
  return {
    all,
    ahead: all.filter((row) => row.at >= now).slice(0, 18),
  }
}
