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
    /*
     * 식물은 종을 다섯으로 늘리되 수는 줄인다.
     *
     * 다섯 종을 넉넉히 흩어 놓았더니 앞이 빽빽해서 공룡 무리가 묻혔다.
     * 종이 여럿이면 몇 그루만 있어도 숲으로 읽힌다 —
     * 다채로움은 개수가 아니라 종류에서 나온다.
     */
    cycads: 3,
    treeferns: 2,
    ginkgos: 2,
    horsetails: 3,
    shrubs: 3,
    ferns: 8,
    // 다른 공룡들. 배경에 서서 풀을 뜯거나 두리번거린다
    others: 3,
    eggs: 1,
    /*
     * 아기는 어미를 따라가는 둘뿐이다.
     *
     * 둥지 곁에 한 마리를 따로 두어 봤는데, 무리와 떨어져 혼자 서 있으니
     * 어미를 잃은 것처럼 보였다. 얼굴을 또렷하게 그려 놓으니
     * 더 눈에 띄어서, 배경에 있어야 할 것이 사연을 만들었다.
     * 알은 둥지에 그대로 두고 아기는 어미 곁에만 둔다.
     */
    hatchlings: 0,
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

/*
 * 어떤 날 — 여느 날과 하늘이 다른 날들.
 *
 * 장소는 '어디' 고 에디션은 '무엇' 인데, 이 목록은 '언제' 다.
 *
 * 기준을 달력에 두지 않았다. 달력으로 고르면 한국 음력 명절만 남아
 * 넷이 전부 비슷한 판이 된다 — 대보름과 추석은 아예 같은 보름달 밤이다.
 * 그래서 그날의 빛과 공기로 골랐다. 명절이든 축제든 상관없이
 * '이 날은 하늘색이 다르다' 하나만 본다.
 *
 * 여섯 장이 계절 · 시간대 · 색상 · 시각언어에서 하나도 겹치지 않는다.
 *
 *   벚꽃놀이   봄 한낮      연분홍   illustrated
 *   단오       초여름 한낮  옥색     illustrated
 *   불꽃놀이   한여름 밤    남색     illustrated
 *   추석       가을 저녁놀  황금     illustrated
 *   크리스마스 초겨울 밤    전나무   engraved
 *   설날       한겨울 아침  흰파랑   illustrated
 *
 * 밤이 둘이지만 남색과 전나무 초록으로 갈리고 광원도 다르다 —
 * 하늘에서 터지는 불과 트리에 앉은 금박. 기존 밤하늘(차가운 남색에
 * 초승달)과도 부딪히지 않는다.
 *
 * 크리스마스 한 장만 각인형이다. 여섯이 전부 일러스트형이면
 * 이 목록만 에디션 쪽 금박 판들과 결이 갈라져 따로 노는 묶음이 된다.
 * 한 장쯤 섞여 있어야 목록 셋이 같은 세계로 읽힌다.
 */
const DAYS = [
  {
    /*
     * 벚꽃놀이.
     *
     * 배경 나무의 색(veg·veg2)까지 분홍으로 둔다. 초록으로 두면
     * 벚나무 한 그루가 초록 숲에 홀로 핀 판이 되는데, 벚꽃놀이는
     * 한 그루를 보러 가는 게 아니라 온 산이 물든 걸 보러 가는 날이다.
     */
    id: 'blossom',
    /*
     * 벚꽃놀이 — 궁궐 담장 낀 벚꽃길.
     *
     * ── 시점을 바꾼다 ──────────────────────────────
     * 다른 판은 전부 정면에서 수평으로 보는 시점 하나다. 여기는
     * 벚나무 아래에 서서 올려다본다 — 늘어진 가지가 판 위쪽 좌우에서
     * 안으로 들어오고, 그 아래로 담장과 길이 보인다.
     *
     * 바닥 띠는 건드리지 않는다. 사람들이 판을 좌우로 걸어다니므로
     * 지면은 어디까지나 트인 길이어야 한다.
     *
     * ── 한국 판이다 ────────────────────────────────
     * 벚꽃만 두면 어느 나라 봄인지 알 수 없다. 기와 담장 한 줄이면
     * 그 길이 어디인지 정해진다. 담장은 인공물이라 판의 명도 단계에서
     * 벗어나 자기 색을 갖는다 — 흙빛 담벼락에 회자줏빛 기와.
     */
    wall: true,
    // 길에 쌓인 꽃잎. 이 얕은 한 겹이 '분홍 들판' 을 '벚꽃길' 로 만든다
    fallen: true,
    /*
     * 나무는 담장 뒤에 크게 넷.
     *
     * 기본값(밑동 178~208)을 그대로 뒀더니 담벼락 한가운데가 밑동이 되어
     * 벚나무들이 담 위에 심겨 있었다. 밑동을 담에 묻고 크기를 키우면
     * 꽃만 담 위로 넘어온다.
     */
    treeBase: [184, 196],
    treeBig: true,
    /*
     * 담장 색은 판 안에서 물러나 있어야 한다.
     *
     * 처음엔 실제 궁궐 담처럼 밝은 흙빛으로 뒀는데, 그 색이 판에서
     * 가장 밝아서 눈이 벚꽃이 아니라 담장으로 갔다. 담장은 이 길이
     * 어디인지 알려 주는 겹이지 보러 온 것이 아니다.
     * 그래서 분홍 기를 섞어 먼 산과 비슷한 단으로 내렸다.
     */
    wallFace: '#DDC7C1',
    wallTile: '#6B5A62',
    /*
     * 벚꽃놀이도 하늘까지 분홍으로 두지 않는다.
     *
     * 들판이 초록 하늘을 버린 것과 같은 이유다. 하늘부터 지면까지
     * 분홍 한 색으로 내려오게 했더니 벚나무가 분홍 안개에 잠겨
     * 뿌연 자국만 남았다 — 캐노피를 거의 흰빛까지 올려도 그랬다.
     *
     * 분홍이 주인공인 판은 하늘이 하늘색이어야 분홍이 보인다.
     * 그래서 하늘만 맑은 봄빛으로 두고, 먼 산부터 지면까지는
     * 분홍의 명도 단계로 내려온다.
     */
    // 흰빛까지 올리면 구름과 구별되지 않는다. 분홍을 한 단 남긴다
    motifColor: '#FBDCE8',
    /*
     * 빛을 따뜻한 쪽으로 옮긴다.
     *
     * 하늘을 하늘색으로 돌린 뒤 판이 맑아지긴 했는데 서늘해졌다.
     * 봄 한낮은 맑으면서 따뜻하고, 그 따뜻함은 하늘 꼭대기가 아니라
     * 지평선 쪽과 빛에서 온다. 그래서 하늘 위는 그대로 두고
     * 안개와 빛(bloom)만 크림빛으로 옮겼다.
     *
     * bloom 은 구름 · 빛무리 · 빛줄기 · 봄볕이 함께 쓰는 색이라
     * 이 한 값이 판의 온도를 정한다.
     */
    haze: '#F6E3D9',
    veg: '#A85F82',
    veg2: '#D08BAB',
    bloom: '#FFF3DC',
    mountains: 2,
    // 셋을 띄웠더니 하나가 늘어진 가지에 겹쳐서 꽃송이와 구별되지 않았다
    clouds: 2,
    // 갈매기 실루엣 대신 나비를 띄운다
    birds: 0,
    /*
     * 나비 셋.
     *
     * 처음엔 일곱을 흩었다. 채도 있는 노랑에 크기도 커서, 은은하기는커녕
     * 판에서 가장 먼저 눈에 띄는 것이 나비였다. 은은한 것은 적고 작고
     * 판의 색 안에 있어야 한다 — 그래서 셋, 판의 크림빛 하나로.
     */
    /*
     * 봄의 알록달록함을 아주 조금.
     *
     * 하늘만 하늘색이고 나머지는 분홍 한 색의 명도 단계라, 정돈되긴 했지만
     * 봄치고는 단조로웠다. 그렇다고 색을 여럿 들이면 판이 깨진다 —
     * 이 저장소가 표지 열세 장에서 읽어 낸 규칙이 '한 색의 명도 단계' 였다.
     *
     * 그래서 세 군데에만, 채도를 죽여서 넣는다.
     *   흰 벚나무   배경 나무의 절반쯤. 벚꽃은 원래 분홍과 흰빛이 섞여 핀다
     *   들꽃        길가 띠에 열두 송이. 흰빛 · 연노랑 · 연보라
     *   새순        마른 풀 사이에 연둣빛 몇 가닥
     *
     * 셋 다 '색을 칠한 것' 이 아니라 '원래 거기 있는 것' 이라, 눈에 띄지
     * 않으면서 판에 생기가 돈다. 채도를 올리면 그 순간 색동이 된다 —
     * 버들을 연둣빛으로 넣었다가 그것만 튀어서 지운 적이 있다.
     */
    treePale: '#F4E6EC',
    /*
     * 흰빛을 몇 군데 더.
     *
     * 분홍 한 색으로 두면 조화(造花) 가 된다. 실제 벚꽃은 한 가지 안에서도
     * 갓 핀 것이 희고 시든 것이 분홍으로 짙어진다. 그 섞임이 없으면
     * 색이 고르다 못해 인쇄물처럼 보인다.
     *
     *   motifPale  주인공 가지의 여섯 송이
     *   motePale   흩날리는 꽃잎의 절반쯤
     *   veil       먼 산 밑동에 걸리는 봄 아지랑이
     *   (기와 용마루의 가는 빛줄은 무대와 상관없이 담장에 붙는다)
     */
    motifPale: '#FDF3F7',
    motePale: '#FFFFFF',
    veil: true,
    wild: 12,
    wildMix: ['#FFFDF8', '#F2E3A8', '#D8C8E6'],
    grassFresh: '#A5AE8A',
    butterflies: 3,
    /*
     * 비행기 한 대.
     *
     * 한 바퀴 74초에 한 번 지나간다. 하늘이 넓게 비어 있는 판이라
     * 그 한 줄이 지나가는 동안 하늘에도 무슨 일이 생긴다.
     */
    plane: true,
    /*
     * 꽃잎비.
     *
     * 늘 흩날리는 꽃잎(motes)과는 다른 겹이다. 그쪽은 몇 장이 계속
     * 떠 있는 잔잔한 흩날림이고, 이쪽은 바람이 한 번 지나갈 때
     * 우수수 쏟아졌다 잦아드는 것이다. 한 바퀴 46초에 두 번 터진다.
     *
     * 색은 셋을 섞는다. 갓 진 꽃잎이 희고 오래된 것이 분홍으로 짙어져서,
     * 한 색으로 뿌리면 색종이가 된다.
     */
    petalRain: ['#FFFFFF', '#FBE3EC', '#F3C6D9'],
    /*
     * 나비 날개 색.
     *
     * 크림빛(bloom)으로 뒀더니 하늘도 안개도 크림빛이라 나비가 배경에
     * 잠겼다. 주인공이 배경색을 입고 있으면 안 된다. 흰빛으로 올리고
     * 가장자리에 짙은 선을 아주 가늘게 두른다 — 이 판의 시각 언어가
     * 원래 테두리 두른 스티커다.
     */
    wing: '#FFFDF7',
    // 뒷날개. 앞날개보다 한 단 낮춰야 두 장이 겹친 것으로 보인다
    wingHind: '#EFD3E0',
    // 먼 쪽 뒷날개. 넷 중 가장 짙다
    wingFar: '#EFC3D9',
    // 담장 뒤에 넷. 늘어진 가지가 주인공이니 이쪽은 무리로만 있으면 된다
    trees: 4,
    grass: 1,
    // 흩날리는 꽃잎이 이 자리를 쓴다. 들꽃은 아래 wild 로 따로 둔다
    flowers: 0,
    motes: 'petal',
    rays: 1,
    en: 'BLOSSOM',
    ko: '벚꽃놀이',
    lang: 'illustrated',
    motif: 'blossom',
    sky: '#CFE6F4',
    mid: '#F7E6D8',
    far: '#E9A9C4',
    near: '#D98BAE',
    ground: '#B46788',
    accent: '#6E3C55',
  },
  {
    /*
     * 단오.
     *
     * 초여름 녹음이라 들판과 색이 부딪히기 쉽다. 들판은 하늘이 하늘색인
     * 초록 판이고, 여기는 창포물 색 하나로 하늘부터 지면까지 내려온다.
     * 같은 초록이 아니라 옥색이라야 단오다.
     */
    id: 'dano',
    motifColor: '#8A6A4A',
    haze: '#CFE7E0',
    veg: '#35635A',
    veg2: '#4F857A',
    bloom: '#EFF7F2',
    mountains: 2,
    clouds: 3,
    birds: 1,
    trees: 4,
    grass: 1,
    flowers: 1,
    motes: 'pollen',
    rays: 1,
    en: 'DANO',
    ko: '단오',
    lang: 'illustrated',
    motif: 'swing',
    sky: '#D5EBE4',
    mid: '#B4DACE',
    far: '#7FBBAC',
    near: '#58978A',
    ground: '#3C6F65',
    accent: '#C0553F',
  },
  {
    /*
     * 불꽃놀이.
     *
     * 빛줄기는 끈다. 구름 사이로 내리는 빛인데 이 판의 광원은 하늘에서
     * 터지는 불 하나뿐이라, 다른 데서 빛이 또 들어오면 무엇이 밤인지
     * 알 수 없어진다. 어두워야 불꽃이 밝다.
     */
    id: 'fireworks',
    /*
     * 불꽃놀이 — 한강 둔치에서 건너다보기.
     *
     * ── 시점 ────────────────────────────────────────
     * 다른 판은 들이나 언덕을 정면에서 본다. 여기는 강 이쪽 둔치에 서서
     * 건너편을 본다 — 강 너머 도시 실루엣, 그 앞을 가로지르는 다리,
     * 그 사이의 검은 물. 사람들은 이쪽 둔치를 걷는다.
     *
     * 강이 있어야 하는 건 물에 비치기 때문이다. 한강 불꽃 사진을
     * 그 사진으로 만드는 건 하늘의 불꽃이 아니라 물에 어리는 쪽이다.
     *
     * ── 어두워야 한다 ──────────────────────────────
     * 건너편 창문을 다 켜 봤더니 도시가 밝아져서 하늘에서 터지는 것이
     * 묻혔다. 불꽃놀이 하는 밤의 강 건너는 생각보다 어둡다.
     */
    river: true,
    /*
     * 불꽃은 그려 두지 않는다.
     *
     * 갈래 열둘에 끝마다 점을 찍어 그려 뒀었는데, 잘 그렸든 아니든
     * 그건 불꽃이 아니라 불꽃 무늬였다. 불꽃은 모양이 아니라 사건이라서
     * 터지는 걸 보지 못하면 터진 줄을 모른다.
     *
     * 이제 올라가고 · 터지고 · 흩어지고 · 처지고 · 꺼지는 것을
     * 매 프레임 계산한다.
     */
    fireworks: true,
    cityDark: '#080C1A',
    bridgeDark: '#0A0F20',
    bridgeRail: '#141C36',
    waterFar: '#1B2748',
    waterMid: '#121A34',
    waterNear: '#0A0F20',
    waterLine: '#3C4E80',
    lampWarm: '#F2C15C',
    lampCool: '#BFD2F2',
    // 붉은 간판과 항공장애등. 아주 조금 쓰지만 이게 있어야 야경이 화려해진다
    lampNeon: '#D98297',
    motifColor: '#F26D7D',
    haze: '#2C3A66',
    veg: '#0C1122',
    veg2: '#16203C',
    bloom: '#F0D9A0',
    // 먼 산은 없다. 이 판에서 지평선을 만드는 건 능선이 아니라 강 건너 불빛이다
    mountains: 0,
    /*
     * 구름은 끈다.
     * 구름 색(bloom)은 불꽃 한가운데 쓰는 색이라 노랗다. 그 색으로
     * 밤하늘에 구름을 띄웠더니 하늘에 누런 빵이 하나 떠 있었고,
     * 작은 불꽃 하나가 하필 그 위에서 터졌다.
     */
    clouds: 0,
    birds: 0,
    // 둔치에 선 나무 둘. 기본 자리는 물속이라 강둑으로 내려 세운다
    trees: 2,
    treeBase: [214, 228],
    grass: 1,
    flowers: 0,
    /*
     * 떠다니는 것은 별이다.
     *
     * 불티(spark)로 뒀더니 위로 오르는 불티와 아래로 처지는 불꽃 잔불이
     * 한 판에 섞여서, 무엇이 무엇인지 알 수 없었다. 불티는 불꽃이 맡는다.
     */
    motes: 'star',
    rays: 0,
    en: 'FIREWORKS',
    ko: '불꽃놀이',
    lang: 'illustrated',
    sky: '#26325E',
    mid: '#1C2648',
    far: '#151D38',
    near: '#0E1428',
    ground: '#080B18',
    accent: '#F2C15C',
  },
  {
    /*
     * 추석.
     *
     * 전경 풀(veg)을 황금으로 둔다. 초록으로 두면 노을만 든 여름 들판이다.
     * 벼가 누렇게 서 있어야 거두는 날로 읽힌다.
     */
    id: 'chuseok',
    // 노을 진 하늘도 밝은 편이라 달은 거의 흰빛이어야 달로 보인다
    motifColor: '#FFFBEF',
    haze: '#F2DEB0',
    /*
     * 식물 색을 지면 쪽 단으로 내린다.
     *
     * 벼가 누렇게 보이라고 금색을 줬더니 배경 나무의 캐노피까지 금색이
     * 되어, 들녘에 노란 공 세 개가 떠 있었다. 나무와 벼는 같은 색을 쓴다.
     * 그래서 둘 다 짙은 황토로 내리고, 대신 지면을 한 단 더 어둡게 해서
     * 벼가 지면 위로 떠오르게 했다.
     */
    veg: '#8A5F2A',
    veg2: '#B98B41',
    bloom: '#FFF6DC',
    mountains: 2,
    clouds: 3,
    birds: 1,
    trees: 3,
    grass: 1,
    flowers: 0,
    motes: 'leaf',
    rays: 1,
    en: 'CHUSEOK',
    ko: '추석',
    lang: 'illustrated',
    motif: 'harvestmoon',
    sky: '#F7E2AC',
    mid: '#EDC983',
    far: '#D5A45B',
    near: '#A87840',
    ground: '#6F4C22',
    accent: '#FFF3CE',
  },
  {
    /*
     * 크리스마스.
     *
     * 이 목록에서 유일한 각인형이다. 저채도 딥톤 전나무 초록에
     * 금박 선 하나 — 트리도 사람도 금선 드로잉이 된다.
     * 눈 내리는 흰 판으로 가면 눈밭·설날과 셋이 겹치므로 숲으로 간다.
     */
    id: 'christmas',
    haze: '#3B5A50',
    veg: '#101D19',
    veg2: '#1B2E28',
    bloom: '#EAC379',
    mountains: 3,
    // 금박색 구름이 밤하늘에 누렇게 떴다. 이 판에 필요한 건 구름이 아니라 눈이다
    clouds: 0,
    birds: 0,
    trees: 4,
    grass: 0,
    flowers: 0,
    motes: 'snow',
    rays: 0,
    en: 'CHRISTMAS',
    ko: '크리스마스',
    lang: 'engraved',
    motif: 'firtree',
    sky: '#33504A',
    mid: '#26403A',
    far: '#1F342E',
    near: '#152420',
    ground: '#0C1714',
    accent: '#EAC379',
  },
  {
    /*
     * 설날.
     *
     * 눈밭과 색이 가장 가깝다. 갈라 세우는 건 시간대다 —
     * 눈밭은 해가 낮게 걸린 잿빛 낮이고 설날은 막 튼 아침이라
     * 하늘이 한 단 더 밝고 지면까지 푸른 기가 돈다.
     * 그 위에 단청 홍이 딱 한 군데, 연에만 쓰인다.
     */
    id: 'seollal',
    motifColor: '#F5F8FB',
    haze: '#E6EDF5',
    veg: '#8797AB',
    veg2: '#A9B7C7',
    bloom: '#FFFFFF',
    mountains: 3,
    clouds: 3,
    birds: 1,
    trees: 3,
    grass: 0,
    flowers: 0,
    motes: 'snow',
    rays: 1,
    en: 'SEOLLAL',
    ko: '설날',
    lang: 'illustrated',
    motif: 'kite',
    sky: '#EEF4FA',
    mid: '#E2EBF4',
    far: '#CCD9E6',
    near: '#B2C2D4',
    ground: '#97A6B8',
    accent: '#C8443C',
  },
]

export const STAGE_GROUPS = [
  { id: 'place', stages: PLACES },
  { id: 'edition', stages: EDITIONS },
  { id: 'day', stages: DAYS },
]

export const STAGES = [...PLACES, ...EDITIONS, ...DAYS]
export const STAGE_IDS = STAGES.map((s) => s.id)
export const isKnownStage = (id) => STAGE_IDS.includes(id)
export const stageById = (id) => STAGES.find((s) => s.id === id) ?? STAGES[0]

/*
 * 예전에 쓰던 id 를 지금 것으로 옮긴다.
 * 저장된 값을 그냥 버리면 골라 둔 무대가 사라진다.
 */
const RETIRED = { city: 'alley' }
export const migrateStage = (id) => RETIRED[id] ?? id
