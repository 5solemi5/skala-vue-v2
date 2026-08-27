/**
 * 한국어 문구
 *
 * 화면에 그대로 나가는 글자만 모았다.
 *
 * 값은 문자열이거나 함수다.
 * {name} 처럼 중괄호로 감싼 자리에는 값이 들어간다.
 * 우리말 수 세는 말이나 조사처럼 규칙이 필요한 문구는 함수로 쓴다.
 */

// 숫자보다 우리말이 따뜻하게 읽힌다
const koCount = [
  '',
  '한',
  '두',
  '세',
  '네',
  '다섯',
  '여섯',
  '일곱',
  '여덟',
  '아홉',
  '열',
  '열한',
  '열두',
]

export default {
  // ── 머리말·꼬리말 ──────────────────────────────
  'brand.name': '오늘의 채비',
  'brand.tagline': '같은 하늘, 다른 하루',
  'nav.home': '오늘의 채비',
  'nav.about': '서비스 소개',
  'nav.skip': '본문으로 건너뛰기',
  'nav.mainAria': '주요 메뉴',
  'foot.credit': '오늘의 채비 · 같은 하늘, 다른 하루',
  'lang.aria': '언어 선택',
  // 낮 / 밤. 'system' 은 기기 설정을 따라간다는 뜻이라 '자동' 으로 적었다.
  'unit.aria': '온도 단위',
  'unit.c': '섭씨',
  'unit.f': '화씨',
  'theme.system': '자동',
  'theme.light': '낮',
  'theme.dark': '밤',
  'theme.aria': '화면 밝기',
  'theme.nowSystem': '기기 설정을 따릅니다',
  'theme.nowLight': '밝은 화면으로 고정',
  'theme.nowDark': '어두운 화면으로 고정',

  // ── 지금 있는 곳 ──
  'here.ask': '내 위치',
  'here.askTitle': '지금 계신 곳의 날씨를 봅니다',
  'here.loading': '찾는 중',
  'here.goTitle': ({ name }) => `${name} 오늘의 채비 보기`,
  'here.denied': '위치를 쓸 수 없음',
  'here.deniedTitle': '브라우저에서 위치 접근이 막혀 있습니다',
  'here.failed': '다시',
  'here.failedTitle': '위치는 찾았지만 날씨를 못 받았습니다. 다시 눌러 보세요',
  'here.unnamed': '지금 이곳',

  // ── 마당 배경 ──

  // ── 날씨 상태 ────────────────────────────────
  // ── 일 — 그 사람이 하는 일 ──
  'mode.site': '현장 작업',
  'mode.farm': '농사',
  'mode.commute': '출퇴근',
  'mode.school': '등하교',
  'mode.baseball': '야구',
  'mode.hike': '등산',
  // ── 일상 — 오늘 내가 무엇을 할까 ──
  'mode.laundry': '빨래·환기',
  'mode.walk': '산책',
  'mode.bike': '자전거',
  'mode.workout': '야외운동',
  'mode.wash': '세차',
  'mode.outing': '나들이·외출',
  'mode.eyebrow': '무엇을 볼까요',
  'mode.aria': '무엇을 볼지 고르기',
  'cond.clear': '맑음',
  'cond.clouds': '구름',
  'cond.rain': '비',
  'cond.snow': '눈',
  'cond.haze': '흐림',

  // ── 하는 일 ─────────────────────────────────

  // ── 오늘, 내 사람들 ───────────────────────────
  'yard.plate': '마당',
  'yard.group.place': '장소',
  'yard.group.edition': '에디션',
  'yard.group.day': '어떤 날',
  'yard.expand': '넓게 보기',
  'yard.collapse': '접기',
  'yard.sign': '오늘의 채비',
  'people.today': '오늘,',
  'people.mine': '내 사람들',
  'people.count': ({ n }) => `${koCount[n] ?? n} 곳의 하루를 보고 있어요`,
  'people.setup': '내 사람들 챙기기',
  'people.setupMore': '내 사람들 더 챙기기',
  'people.loading': '불러오는 중',

  // ── 판정 ───────────────────────────────────
  'verdict.stop': '오늘은 아니에요',
  'verdict.warn': '조심하세요',
  'verdict.good': '괜찮아요',
  'verdict.info': '알아두세요',

  // ── 오늘의 채비 (큰 카드) ───────────────────────
  'hero.humidity': '습도',
  'hero.cloud': '구름',
  'hero.rainProb': '강수확률',
  'hero.hot': '더움 (25도 이상)',
  'hero.mild': '선선함 (25도 미만)',
  'hero.detail': '상세보기',
  // 막대에서 시각을 골랐을 때 판정 위에 걸리는 줄
  'hero.basis': '기준으로 보고 있어요',
  'hero.basisNow': '지금으로',
  'hero.detailAria': ({ name }) => `${name} 상세보기`,
  'hero.rowDetail': '상세',

  // ── 시간대 막대 ──────────────────────────────
  'view.now': '지금',
  'view.sunrise': '해뜰 때',
  'view.noon': '한낮',
  'view.sunset': '해질 때',
  'view.night': '오늘 밤',
  'view.aria': '언제의 하늘을 볼지 고르기',
  'view.there': '그곳은 지금',
  'sky.knobs': '손보기',
  'sky.intensity': '세기',
  'sky.speed': '빠르기',
  'sky.grain': '결',
  'sky.reset': '처음값으로',
  'hourly.label': '시간대',
  'hourly.span': '지금부터 18시간',
  'hourly.now': '지금',
  'hourly.rain': '비 올 확률',
  'hourly.rainShort': '비',
  'hourly.bandOne': ({ from }) => `${from}시`,
  'hourly.bandRange': ({ from, to }) => `${from}\u2013${to}시`,
  'hourly.bandTitle': '이 사이가 낫습니다',
  'hourly.pick': '막대를 누르면 그 시각의 값을 봅니다',
  'hourly.aria': '시간대별 판정. 좌우 화살표로 시각을 옮깁니다',
  'hourly.slotAria': ({ hour, temp, rain }) =>
    `${hour}시, 기온 ${temp}도, 비 올 확률 ${rain}퍼센트`,
  'hourly.good': '괜찮음',
  'hourly.warn': '주의',
  'hourly.stop': '피하기',
  'hourly.note': '아래 숫자는 기온',
  'hourly.none': '오늘은 여유로운 시간대가 없습니다',
  'hourly.one': ({ from }) => `${from}시가 가장 낫습니다`,
  'hourly.range': ({ from, to }) => `${from}시 ~ ${to}시가 낫습니다`,

  // ── 메인 화면 ────────────────────────────────
  'home.hint': '목록에서 지역을 누르면 여기가 바뀝니다.',
  'home.modeChanged': ({ mode }) => `${mode} 기준으로 오늘의 채비를 다시 계산했습니다.`,
  'home.picked': ({ name }) => `${name}이 선택되었습니다.`,
  'home.loadFail': '날씨 데이터를 불러오지 못했습니다.',
  'home.keyFail': 'OpenWeatherMap API 키가 유효하지 않습니다. .env.local 의 키를 확인해 주세요.',
  'home.loadFailWith': ({ message }) => `날씨 데이터를 불러오지 못했습니다. (${message})`,
  'home.partialFail': ({ names }) =>
    `${names} 은(는) 불러오지 못했습니다. 나머지 지역만 표시합니다.`,
  'home.loading': '불러오는 중입니다',
  // ── 내 지역 관리 ──────────────────────────────
  // 예전에는 이 문구들이 컴포넌트 안에 한국어로 박혀 있었다.
  // 영어로 바꿔도 이 칸만 한국어로 남아서 여기로 옮겼다.
  'city.title': '내 지역',
  'city.manage': '지역 추가·삭제',
  'city.close': '닫기',
  'city.empty': '목록이 비었습니다. 아래에서 지역을 추가해 주세요.',
  'city.searchLabel': '추가할 지역 검색',
  'city.searchPlaceholder': '추가할 지역 이름 (예: 광주, 제주, Busan)',
  'city.search': '검색',
  'city.searching': '찾는 중',
  'city.add': '추가',
  'city.already': '이미 있음',
  'city.reset': '기본 목록으로 되돌리기',
  'city.removeAria': ({ name }) => `${name} 삭제`,
  'city.notFound': ({ query }) =>
    `'${query}' 로 찾은 지역이 없습니다. 다른 이름으로 검색해 보세요.`,
  'city.searchFail': '지역을 검색하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  'city.added': ({ name }) => `${name} 을(를) 추가했습니다.`,
  'city.exists': ({ name }) => `${name} 은(는) 이미 목록에 있습니다.`,
  'city.removed': ({ name }) => `${name} 을(를) 목록에서 뺐습니다.`,
  // ── 목록 걸러 보기 ────────────────────────────
  'filter.label': '지역 이름으로 걸러 보기',
  'filter.placeholder': '지역 이름',
  'filter.clear': '지우기',
  'home.others': '다른 지역',
  'home.asOf': ({ time }) => `${time} 기준`,
  'home.refreshing': '갱신 중',
  'home.cityFail': '그곳 날씨를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.',
  'home.refresh': '새로고침',
  'home.noCity': '보고 있는 지역이 없습니다.',
  'home.noCityHint': '아래에서 지역을 추가해 주세요.',
  'home.noMatch': ({ query }) => `'${query}' 와(과) 일치하는 지역이 목록에 없습니다.`,
  'home.addQuery': ({ query }) => `'${query}' 추가하기`,
  'home.summaryStop': ({ n }) => `${n}곳은 오늘 피하시는 편이 낫습니다`,
  'home.summaryWarn': ({ n }) => `${n}곳은 주의가 필요합니다`,
  'home.summaryNone': ({ total }) => `${total}곳 모두 오늘은 괜찮습니다`,
  'home.summary': ({ total, parts }) => `${total}곳 중 ${parts}`,

  // ── 상세 화면 ────────────────────────────────
  'detail.back': '전체 지역',
  'detail.loading': '불러오는 중입니다',
  'detail.loadFail': '상세 정보를 불러오지 못했습니다',
  'detail.weather': '날씨',
  'detail.humidity': '습도',
  'detail.rainProb': '강수확률',
  'detail.minTemp': '최저기온',
  'detail.wind': '풍속',
  'detail.feelsLike': '체감',
  'detail.byMode': '하는 일별 채비',
  'detail.byModeHint':
    '메인에서는 고른 한 가지만 보이지만 여기서는 네 가지를 나란히 볼 수 있습니다.',
  'detail.notInList': '내 지역 목록에 없는 곳입니다.',
  'detail.notInListHint': '전체 지역 화면에서 먼저 추가해 주세요.',

  // ── 사람 편집 ────────────────────────────────
  'edit.title': '내 사람들',
  'edit.hint': '챙기고 싶은 사람과 그 사람이 있는 곳을 적어 두세요.',
  'edit.open': '고르기',
  'edit.close': '접기',
  'edit.edit': '수정',
  'edit.delete': '삭제',
  'edit.who': '어떻게 부를까요',
  'edit.whoPlaceholder': '예: 정비소, 밭, 출퇴근길',
  'edit.what': '무엇을 하나요',
  'edit.where': '어디에 있나요',
  'edit.change': '바꾸기',
  'edit.cityPlaceholder': '지역 이름 (예: 전주, 철원, 잠실)',
  'edit.searching': '찾는 중',
  'edit.search': '검색',
  'edit.save': '저장',
  'edit.cancel': '취소',
  'edit.add': '추가',
  'edit.addPerson': '+ 사람 추가',
  'edit.reset': '예시로 되돌리기',
  'edit.full': ({ max }) => `${max}명이 다 찼습니다. 한 명을 지우면 더 넣을 수 있습니다.`,
  'edit.fullShort': ({ max }) => `한 번에 ${max}명까지 볼 수 있습니다.`,
  'edit.fullRemove': ({ max }) =>
    `한 번에 ${max}명까지 볼 수 있습니다. 한 명을 지우고 추가해 주세요.`,
  'edit.needWho': '어떻게 부를지 적어 주세요. (예: 정비소, 밭, 출퇴근길)',
  'edit.needCity': '지역을 골라 주세요.',
  'edit.noResult': ({ query }) =>
    `'${query}' 로 찾은 지역이 없습니다. 가까운 큰 지역으로 검색해 보세요.`,
  'edit.searchFail': '지역을 검색하지 못했습니다. 잠시 후 다시 시도해 주세요.',

  // ── 없는 화면 ────────────────────────────────
  'notFound.title': '페이지를 찾을 수 없습니다',
  'notFound.body': '요청하신 주소가 존재하지 않거나,<br />아직 만들어지지 않았습니다.',
  'notFound.home': '날씨 메인으로 이동',
}
