/*
 * 마당의 무대들.
 *
 * ── 두 갈래다 ──────────────────────────────────────
 * 참고한 다이어리 브랜드는 표지의 시각 언어를 둘로 나눠 쓰고 섞지 않는다.
 *
 *   engraved   각인형 — 저채도 딥톤 · 얇은 선 · 금박 · 질감
 *   illustrated 일러스트형 — 고채도 파스텔 · 두꺼운 흰 테두리 스티커
 *
 * 무대마다 어느 쪽인지 적어 두면 캐릭터도 그 결을 따라간다.
 * 각인형 무대에서는 캐릭터가 금선 드로잉이 되고,
 * 일러스트형에서는 스티커처럼 흰 테두리를 두른다.
 * 한 판 안에서는 언제나 한 가지 언어만 보인다.
 *
 * ── 색은 한 색의 명도 단계로만 ────────────────────
 * 표지 한 장의 색 97%가 같은 색상의 명도 2~3단이었다.
 * 그래서 무대마다 본색 하나를 받아 하늘에서 지면까지 밝기만 바꿔 내려온다.
 * 아래 HEX 는 표지 사진에서 실제로 추출된 값이다.
 *
 * ── 한 무대에 모티프는 하나 ───────────────────────
 * 표지 열세 장 전부 모티프가 정확히 하나였다.
 * 전에는 바닷가에 배·파라솔·가로등·구름·해가 흩어져 있어서
 * 무엇을 보라는 건지 알 수 없었다.
 */

/** 장소 — 사람들이 실제로 걸어다닐 법한 곳 */
const PLACES = [
  {
    id: 'meadow',
    en: 'MEADOW',
    ko: '들판',
    lang: 'illustrated',
    motif: 'tree',
    sky: '#8FA894',
    mid: '#5F7A66',
    far: '#4A6350',
    near: '#3D5442',
    ground: '#2C3F31',
    accent: '#EAC379',
  },
  {
    id: 'seaside',
    en: 'SEASIDE',
    ko: '바닷가',
    lang: 'illustrated',
    motif: 'gull',
    sky: '#C6D4EA',
    mid: '#A6BADD',
    far: '#849CCB',
    near: '#6E86B8',
    ground: '#D8C9A8',
    accent: '#F0DCAE',
  },
  {
    id: 'night',
    en: 'NIGHT',
    ko: '밤하늘',
    lang: 'engraved',
    motif: 'moon',
    sky: '#2A3350',
    mid: '#1E2540',
    far: '#171C32',
    near: '#101425',
    ground: '#0A0D18',
    accent: '#EAC379',
  },
  {
    id: 'snow',
    en: 'SNOWFIELD',
    ko: '눈밭',
    lang: 'illustrated',
    motif: 'bareTree',
    sky: '#F2F5F9',
    mid: '#E6EAF1',
    far: '#D7DBE3',
    near: '#C4C8D1',
    ground: '#B1B0B4',
    accent: '#918167',
  },
  {
    id: 'alley',
    en: 'ALLEY',
    ko: '골목',
    lang: 'illustrated',
    motif: 'lamp',
    sky: '#D9D7D3',
    mid: '#C6C5C2',
    far: '#B0AFAC',
    near: '#9A9996',
    ground: '#7E7D7A',
    accent: '#918167',
  },
]

/*
 * 에디션 — 참고한 표지 열세 장을 그대로 옮긴 판.
 * 색은 실측값이고 모티프도 그 표지의 것이다.
 */
const EDITIONS = [
  {
    id: 'voyager',
    no: '001',
    en: 'VOYAGER',
    ko: '보이저',
    lang: 'engraved',
    motif: 'voyagerInk',
    // 쿨 오프화이트. 살짝 푸른 기가 돈다
    sky: '#E7EAEF',
    mid: '#DDE1E8',
    far: '#D7DBE3',
    near: '#C3C6CD',
    ground: '#B1B0B4',
    accent: '#878079',
    ink: '#242327',
  },
  {
    id: 'dinosaur',
    no: '002',
    en: 'DINOSAUR',
    ko: '공룡',
    lang: 'illustrated',
    motif: 'dino',
    // 열두 시즌 중 유일하게 보색 대비를 쓴다
    sky: '#E0BCD8',
    mid: '#D6A5C3',
    far: '#C69FC0',
    near: '#A48794',
    ground: '#8A6F7C',
    accent: '#4598C6',
  },
  {
    id: 'love',
    no: '005',
    en: 'LOVE',
    ko: '사랑',
    lang: 'engraved',
    motif: 'vine',
    // 검정 위의 검정. 무늬가 광택 차이로만 드러난다
    sky: '#3A3B3F',
    mid: '#2A2B2E',
    far: '#1D1D20',
    near: '#131315',
    ground: '#090809',
    accent: '#DAD4C5',
  },
  {
    id: 'bigbang',
    no: '006',
    en: 'BIGBANG',
    ko: '대폭발',
    lang: 'engraved',
    motif: 'singularity',
    // 노출 콘크리트. 열세 장 중 가장 절제된 표지
    sky: '#D3CFC7',
    mid: '#C4C2BE',
    far: '#BBBAB7',
    near: '#93979A',
    ground: '#6B6E6D',
    accent: '#1F2327',
  },
  {
    id: 'neverland',
    no: '007',
    en: 'NEVERLAND',
    ko: '네버랜드',
    lang: 'illustrated',
    motif: 'stars',
    // 열세 장 중 유일한 그라디언트 표지
    sky: '#D9A3CF',
    mid: '#CF89C3',
    far: '#AB71B9',
    near: '#945EAD',
    ground: '#684197',
    accent: '#3E6BE0',
  },
  {
    id: 'cocktail',
    no: '008',
    en: 'COCKTAIL',
    ko: '칵테일',
    lang: 'engraved',
    motif: 'glasses',
    // 바의 조도 같은 저명도 그린
    sky: '#4A6350',
    mid: '#3D5442',
    far: '#374E3C',
    near: '#2B3A2A',
    ground: '#1A2419',
    accent: '#C6A76A',
    seal: '#7A2233',
  },
  {
    id: 'whale',
    no: '009',
    en: 'WHALE',
    ko: '고래',
    lang: 'illustrated',
    motif: 'whale',
    // 저채도 크림 위에 고채도 블루 하나
    sky: '#E4D8C6',
    mid: '#DCCEBA',
    far: '#D6C6B2',
    near: '#BFB09C',
    ground: '#9C9184',
    accent: '#464F64',
  },
  {
    id: 'beethoven',
    no: '010',
    en: 'BEETHOVEN',
    ko: '베토벤',
    lang: 'engraved',
    motif: 'piano',
    // 이 라인에서 가장 채도가 높다. 연주회장의 벨벳과 놋쇠
    sky: '#D4494B',
    mid: '#CD3D40',
    far: '#BF2A27',
    near: '#9E2320',
    ground: '#6E1A19',
    accent: '#E8C98A',
  },
  {
    id: 'fleurs',
    no: '011',
    en: 'LES FLEURS',
    ko: '악의 꽃',
    lang: 'engraved',
    motif: 'deadBranch',
    // 얼룩덜룩한 기모 스웨이드. 질감 자체가 무늬 역할을 한다
    sky: '#C0B6AC',
    mid: '#B1A69D',
    far: '#A79C94',
    near: '#9C928B',
    ground: '#6E6660',
    accent: '#C8C4BC',
  },
  {
    id: 'goldenrecord',
    no: '012',
    en: 'GOLDEN RECORD',
    ko: '골든 레코드',
    lang: 'engraved',
    motif: 'voyagerFoil',
    // 이 라인에서 가장 어둡고 가장 조용한 표지
    sky: '#4D4B45',
    mid: '#3B3A36',
    far: '#323230',
    near: '#232320',
    ground: '#0C0F13',
    accent: '#EAC379',
  },
  {
    id: 'abebe',
    en: 'ABEBE',
    ko: '아베베',
    lang: 'illustrated',
    motif: 'runner',
    // 라벤더가 도는 하늘색 스웨이드
    sky: '#A8BCE0',
    mid: '#90A8D4',
    far: '#849CCB',
    near: '#6E86B4',
    ground: '#486E97',
    accent: '#5FA98C',
  },
  {
    id: 'duchamp',
    en: 'DUCHAMP',
    ko: '뒤샹',
    lang: 'illustrated',
    motif: 'gorilla',
    // 열세 장 중 가장 채도가 높은 표지
    sky: '#F09AA8',
    mid: '#EB7187',
    far: '#E9647D',
    near: '#B8425C',
    ground: '#8D3250',
    accent: '#EDCABA',
  },
  {
    id: 'florence',
    en: 'FLORENCE',
    ko: '플로렌스',
    lang: 'engraved',
    motif: 'wings',
    // 금박 면적이 가장 넓은 표지지만 그래도 전체의 5% 남짓이다
    sky: '#F8EDD8',
    mid: '#F5E6C9',
    far: '#EFDFC2',
    near: '#DFC9A2',
    ground: '#C98F64',
    accent: '#EAC379',
  },
]

export const STAGE_GROUPS = [
  { id: 'place', stages: PLACES },
  { id: 'edition', stages: EDITIONS },
]

export const STAGES = [...PLACES, ...EDITIONS]
export const STAGE_IDS = STAGES.map((s) => s.id)
export const isKnownStage = (id) => STAGE_IDS.includes(id)
export const stageById = (id) => STAGES.find((s) => s.id === id) ?? STAGES[0]

/*
 * 예전에 쓰던 id 를 지금 것으로 옮긴다.
 * 저장된 값을 그냥 버리면 골라 둔 무대가 사라진다.
 */
const RETIRED = { city: 'alley' }
export const migrateStage = (id) => RETIRED[id] ?? id
