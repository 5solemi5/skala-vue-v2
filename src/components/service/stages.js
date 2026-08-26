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
 * ── 모티프 하나 + 풍경 여러 겹 ─────────────────────
 * 표지 열세 장은 모티프가 정확히 하나씩이었다.
 * 그 규칙은 '주인공은 하나' 라는 뜻이지 '아무것도 더 두지 마라' 는 아니다.
 *
 * 그래서 주인공은 하나로 두되 뒤에 깊이를 여러 겹 쌓았다.
 * 먼 산 · 구름 · 새 떼 · 중경 언덕 · 나무 · 안개 띠 · 근경 · 풀 · 떠다니는 것들.
 * 흩뿌린 게 아니라 뒤에서 앞으로 겹을 세운 것이라
 * 눈은 여전히 모티프 하나에 멈춘다.
 *
 * 어느 겹을 켤지와 그 색은 무대마다 아래 표에서 정한다.
 *
 * motifColor 는 일러스트형 무대에서만 쓴다.
 * 각인형은 모티프가 금박 선이라 accent 를 그대로 쓰지만,
 * 일러스트형에서 나무를 금색으로 칠하면 나무가 아니라 노란 공이 된다.
 * 자연물은 자기 색을 갖는다.
 */

/** 장소 — 사람들이 실제로 걸어다닐 법한 곳 */
const PLACES = [
  {
    id: 'meadow',
    motifColor: '#5C8A5F',
    haze: '#D8E3D2',
    veg: '#3A6B47',
    veg2: '#5E9160',
    bloom: '#F2DE96',
    mountains: 3,
    clouds: 4,
    birds: 1,
    trees: 6,
    grass: 1,
    flowers: 1,
    motes: 'pollen',
    rays: 1,
    en: 'MEADOW',
    ko: '들판',
    lang: 'illustrated',
    motif: 'tree',
    /*
     * 들판만 한 색의 명도 단계에서 벗어난다.
     * 하늘까지 초록으로 두었더니 초록 안개 속에 잠긴 판이 되어
     * 산도 나무도 서로 묻혔다. 들판은 하늘이 하늘색이어야 들판이다.
     */
    sky: '#A8C8DC',
    mid: '#C9DCDA',
    far: '#5E8A5F',
    near: '#426B48',
    ground: '#2E4D34',
    accent: '#EAC379',
  },
  {
    /*
     * 바닷가.
     *
     * 처음에는 들판의 겹을 색만 바꿔 썼다. 먼 산 두 겹, 구름, 새 떼,
     * 풀 한 줌. 모래색 지면을 깔았지만 그건 바닷가가 아니라
     * 모래색 들판이었다 — 바다가 없었다.
     *
     * 바닷가를 바닷가로 만드는 건 물이 뭍에 닿는 자리다.
     * 수평선, 밀려왔다 빠지는 파도, 물이 닿았다 간 젖은 모래.
     * 그 셋이 있어야 나머지(갈매기·꽃게·조개)가 놀러 온 해변이 된다.
     */
    id: 'seaside',
    beach: true,
    motifColor: '#E0704F',
    haze: '#DCE7F4',
    veg: '#C6AE80',
    veg2: '#E0CFA6',
    bloom: '#FFF3D6',
    // 뭍의 겹은 쓰지 않는다
    mountains: 0,
    clouds: 4,
    birds: 0,
    trees: 0,
    grass: 0,
    flowers: 0,
    rays: 0,
    // 바닷가에만 있는 겹
    motes: 'spray',
    sea: 1,
    waves: 5,
    gulls: 4,
    walkers: 3,
    crabs: 3,
    // 가끔 물 밖으로 솟는다
    dolphins: 2,
    shells: 11,
    en: 'SEASIDE',
    ko: '바닷가',
    lang: 'illustrated',
    motif: 'parasol',
    sky: '#BFD9F0',
    mid: '#93C1E2',
    far: '#3E86B4',
    near: '#2A6A93',
    ground: '#EADFC0',
    accent: '#F0DCAE',
  },
  {
    id: 'night',
    haze: '#232B44',
    veg: '#141A2E',
    veg2: '#1D2540',
    bloom: '#EAC379',
    mountains: 3,
    clouds: 2,
    birds: 0,
    trees: 3,
    grass: 1,
    flowers: 0,
    motes: 'star',
    rays: 0,
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
    motifColor: '#8E96A6',
    haze: '#E8ECF3',
    veg: '#AFB6C2',
    veg2: '#C6CBD5',
    bloom: '#D9E2EC',
    mountains: 3,
    clouds: 3,
    birds: 0,
    trees: 4,
    grass: 0,
    flowers: 0,
    motes: 'snow',
    rays: 1,
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
    motifColor: '#E0C089',
    haze: '#C9C8C5',
    veg: '#8B8A87',
    veg2: '#A2A19E',
    bloom: '#E0C089',
    mountains: 0,
    clouds: 2,
    birds: 1,
    trees: 2,
    grass: 0,
    flowers: 0,
    motes: 'dust',
    rays: 1,
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

  /*
   * 에디션 — 참고한 표지 열세 장을 그대로 옮긴 판.
   * 색은 실측값이고 모티프도 그 표지의 것이다.
   */
  /*
   * 심해.
   *
   * 다른 장소들은 하늘 아래다 — 산·구름·새·나무를 위에서 아래로 세운다.
   * 여기는 그 순서가 통째로 뒤집힌다. 빛이 위에서 들어와 아래로 흩어지고,
   * 무거운 것이 가라앉고, 사람은 바닥을 딛지 않는다.
   *
   * 그래서 under 를 켠다. 이 표시 하나로 장면이 다른 겹을 쓴다.
   *
   * 색은 한 청록의 명도 다섯 단이다. 수면에 가까울수록 밝고
   * 바닥으로 갈수록 잉크에 잠긴다. 발광색(bloom)만 그 계단에서 벗어나
   * 형광으로 튀는데, 심해에서 스스로 빛나는 것들이 그렇다.
   */
  {
    id: 'deepsea',
    under: true,
    motifColor: '#5FD3C8',
    haze: '#2A6B84',
    veg: '#12384A',
    veg2: '#1C5169',
    bloom: '#7FE3D4',
    /*
     * 뭍의 겹은 하나도 쓰지 않는다.
     *
     * 산맥 능선과 빛줄기를 그대로 가져다 색만 바꿔 봤는데,
     * 능선은 물속에서도 산으로 보이고 빛줄기는 구름 사이로 내리는 빛이라
     * 파란 들판에 지나지 않았다.
     * 겹의 이름만 바꾼다고 물속이 되지는 않는다.
     */
    mountains: 0,
    clouds: 0,
    birds: 0,
    trees: 0,
    grass: 0,
    flowers: 0,
    rays: 0,
    // 물속에만 있는 겹
    motes: 'bubble',
    reef: 1,
    marine: 1,
    glows: 11,
    kelp: 1,
    fish: 3,
    jellies: 5,
    corals: 1,
    en: 'DEEP SEA',
    ko: '심해',
    lang: 'illustrated',
    motif: 'jelly',
    sky: '#2E7A96',
    mid: '#1E5877',
    far: '#154059',
    near: '#0E2A40',
    ground: '#08192A',
    accent: '#7FE3D4',
  },
]

const EDITIONS = [
  {
    id: 'voyager',
    haze: '#DCE0E7',
    veg: '#B7BAC2',
    veg2: '#C8CAD1',
    bloom: '#878079',
    mountains: 2,
    clouds: 2,
    birds: 0,
    trees: 0,
    grass: 0,
    flowers: 0,
    motes: 'star',
    rays: 1,
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
    /*
     * 공룡.
     *
     * 표지 열세 장 중 이 한 장만 결이 다르다.
     *
     *   보색     열두 시즌 중 유일하게 보색 대비를 쓴다.
     *            파스텔 모브 핑크 판에 시안 블루 테두리 하나.
     *            시안은 0.5% 밖에 안 쓰였는데 그 0.5% 가 이 표지를 만든다.
     *   만화체   모티프가 실루엣이 아니라 표정 있는 캐릭터다.
     *            굵은 외곽선에 눈이 있고 웃는다.
     *   토성     우하단에 작은 토성 아이콘 하나.
     *
     * 이 라인에서 유일하게 '귀여운' 표지이고 어린이 스티커북 같은
     * 인상이라고 적혀 있다. 다른 무대의 절제를 여기서는 풀어도 된다.
     */
    id: 'dinosaur',
    dinoland: true,
    motifColor: '#8FBF6B',
    haze: '#E4C6DD',
    veg: '#8AA86A',
    veg2: '#A6C285',
    bloom: '#4598C6',
    // 뭍의 기본 겹은 쓰지 않는다. 이 판만의 겹으로 다시 세운다
    mountains: 0,
    clouds: 4,
    birds: 0,
    trees: 0,
    grass: 0,
    flowers: 0,
    /*
     * 빛줄기는 끈다. 구름 사이로 내리는 빛인데 이 판에는 화산 연기가
     * 하늘을 맡고 있어서, 둘이 겹치면 무엇이 연기이고 무엇이 빛인지
     * 알 수 없는 뿌연 판이 됐다.
     */
    rays: 0,
    motes: 'pollen',
    // 공룡 판에만 있는 겹
    volcanoes: 2,
    /*
     * 식물을 여러 종으로 나눈다.
     *
     * 소철 한 종만 흩어 놓았더니 같은 모양이 다섯 번 반복되는 판이었다.
     * 공룡이 살던 때의 숲은 꽃이 없는 대신 잎의 생김이 제각각이다 —
     * 부챗살 소철, 우산처럼 펼친 나무고사리, 부채꼴 은행,
     * 마디로 이어진 속새, 바닥에 깔린 고사리.
     *
     * 크기도 층으로 나눈다. 큰 것은 뒤에 몇 그루, 작은 것은 앞에 많이.
     * 그래야 숲에 깊이가 생긴다.
     */
    cycads: 4,
    treeferns: 3,
    ginkgos: 3,
    horsetails: 7,
    shrubs: 6,
    ferns: 16,
    eggs: 1,
    // 둘은 어미를 따라가고, 하나만 둥지 곁에 남는다
    hatchlings: 1,
    pterosaurs: 3,
    saturn: 1,
    no: '002',
    en: 'DINOSAUR',
    ko: '공룡',
    lang: 'illustrated',
    motif: 'dino',
    /*
     * 실측된 다섯 색.
     *   #C69FC0 74%  파스텔 모브 (본색)
     *   #D6A5C3 19%  밝은 핑크
     *   #A48794  3%  그림자
     *   #484A45  3%  외곽 어두운 톤
     *   #4598C6 0.5% 시안 블루
     */
    sky: '#E8D0E2',
    mid: '#D6A5C3',
    far: '#C69FC0',
    near: '#A48794',
    ground: '#BE9BB2',
    accent: '#4598C6',
    // 굵은 외곽선에 쓰는 색. 이 무대에만 있다
    ink: '#484A45',
    /*
     * 용암.
     *
     * 이 판의 색은 모브와 시안 둘뿐인데, 분화구를 시안으로 칠했더니
     * 산꼭대기에 하늘색 원판이 얹힌 꼴이었다 — 불이 아니라 물웅덩이다.
     * 불은 따뜻해야 불이다. 세 번째 색을 하나 들이되,
     * 모브와 부딪히지 않는 흙빛 주홍으로 아주 조금만 쓴다.
     */
    ember: '#D2694F',
  },
  {
    id: 'love',
    haze: '#26272B',
    veg: '#141416',
    veg2: '#1D1D20',
    bloom: '#DAD4C5',
    mountains: 2,
    clouds: 2,
    birds: 0,
    trees: 2,
    grass: 1,
    flowers: 1,
    motes: 'star',
    rays: 0,
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
    haze: '#CFCCC5',
    veg: '#84837F',
    veg2: '#9B9A96',
    bloom: '#1F2327',
    mountains: 3,
    clouds: 1,
    birds: 0,
    trees: 0,
    grass: 0,
    flowers: 0,
    motes: 'dust',
    rays: 1,
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
    motifColor: '#3E6BE0',
    haze: '#C48FCB',
    veg: '#7A4B9E',
    veg2: '#9463B0',
    bloom: '#3E6BE0',
    mountains: 2,
    clouds: 3,
    birds: 0,
    trees: 2,
    grass: 1,
    flowers: 1,
    motes: 'star',
    rays: 1,
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
    haze: '#3F5A46',
    veg: '#22301F',
    veg2: '#31432C',
    bloom: '#C6A76A',
    mountains: 2,
    clouds: 2,
    birds: 0,
    trees: 4,
    grass: 1,
    flowers: 0,
    motes: 'dust',
    rays: 1,
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
    motifColor: '#464F64',
    haze: '#DED2C0',
    veg: '#A2947F',
    veg2: '#B9AC97',
    bloom: '#464F64',
    mountains: 2,
    clouds: 3,
    birds: 1,
    trees: 2,
    grass: 1,
    flowers: 0,
    motes: 'spray',
    rays: 1,
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
    haze: '#C4494A',
    veg: '#7E1F1E',
    veg2: '#9C2A28',
    bloom: '#E8C98A',
    mountains: 2,
    clouds: 2,
    birds: 0,
    trees: 2,
    grass: 1,
    flowers: 0,
    motes: 'dust',
    rays: 1,
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
    haze: '#BAB1A8',
    veg: '#7E766F',
    veg2: '#948B83',
    bloom: '#C8C4BC',
    mountains: 3,
    clouds: 3,
    birds: 1,
    trees: 4,
    grass: 1,
    flowers: 1,
    motes: 'pollen',
    rays: 1,
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
    haze: '#40403B',
    veg: '#1A1A18',
    veg2: '#26261F',
    bloom: '#EAC379',
    mountains: 3,
    clouds: 2,
    birds: 0,
    trees: 3,
    grass: 1,
    flowers: 0,
    motes: 'star',
    rays: 0,
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
    motifColor: '#25324A',
    haze: '#B2C4E2',
    veg: '#3F5F86',
    veg2: '#5B7BA6',
    bloom: '#5FA98C',
    mountains: 3,
    clouds: 3,
    birds: 1,
    trees: 3,
    grass: 1,
    flowers: 1,
    motes: 'pollen',
    rays: 1,
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
    motifColor: '#5C2438',
    haze: '#F0A6B2',
    veg: '#A03A55',
    veg2: '#C05470',
    bloom: '#EDCABA',
    mountains: 2,
    clouds: 3,
    birds: 1,
    trees: 2,
    grass: 1,
    flowers: 1,
    motes: 'pollen',
    rays: 1,
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
    haze: '#F2E4C8',
    veg: '#C99A6A',
    veg2: '#DDB68A',
    bloom: '#EAC379',
    mountains: 2,
    clouds: 3,
    birds: 1,
    trees: 3,
    grass: 1,
    flowers: 1,
    motes: 'pollen',
    rays: 1,
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
