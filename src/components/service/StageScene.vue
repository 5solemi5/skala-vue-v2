<script setup>
import { computed, onMounted, onUnmounted, ref, useId, watch } from 'vue'

/*
 * 무대 한 장.
 *
 * 800×260 화폭에 풍경을 여러 겹 쌓는다.
 * 접혀 있을 때는 아래쪽 띠만 잘라 보여주고, 펼치면 전부 드러난다.
 * 늘려서 채우지 않기 때문에 어느 쪽에서도 비율이 찌그러지지 않는다.
 *
 * ── 겹의 순서 ──────────────────────────────────────
 *   하늘 → 빛무리 → 빛줄기 → 먼 산 → 구름 → 새 떼
 *   → 모티프 → 원경 언덕 → 안개 띠 → 중경 언덕과 나무
 *   → 근경 → 덤불과 꽃 → 지면 → 전경 풀 → 떠다니는 것 → 비네트 → 결
 *
 * 흩뿌린 게 아니라 뒤에서 앞으로 세운 것이라
 * 요소가 아무리 많아도 눈은 모티프 하나에 멈춘다.
 *
 * ── 자리는 고정이다 ────────────────────────────────
 * 난수를 쓰면 다시 그릴 때마다 나무가 순간이동한다.
 * 무대 id 에서 뽑은 수로 자리를 정해서, 같은 무대는 늘 같은 풍경이다.
 */
const props = defineProps({
  stage: { type: Object, required: true },
  /*
   * 판이 펼쳐졌는지.
   *
   * 처음에는 부모의 .stage.open 을 :global() 로 참조해서 모티프를 띄웠다.
   * 컴포넌트 경계를 넘는 선택자라 scoped 규칙과 어긋나 아무것도 안 보였다.
   * 상태를 넘겨받으면 이 파일 안에서만 따지면 된다.
   */
  open: { type: Boolean, default: false },
  /*
   * 화폭을 판에 어떻게 앉힐지.
   *
   * 여기서 정하지 않고 받아 쓴다. 판이 실제로 몇 픽셀인지는 마당이 재고
   * 있고, 걸어다니는 사람들의 발밑도 같은 수에서 나와야 하기 때문이다.
   * 그림과 사람이 서로 다른 기준으로 자리를 잡으면, 지면은 여기 있는데
   * 사람은 저기 서 있게 된다.
   */
  fit: { type: String, default: 'xMidYMax slice' },
})

const uid = useId()

/** 같은 무대는 늘 같은 풍경이 되도록 id 에서 수를 뽑는다 */
const seedOf = (text) => {
  let n = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    n ^= text.charCodeAt(i)
    n = Math.imul(n, 16777619) >>> 0
  }
  return n
}
const rng = (seed) => {
  let x = seed >>> 0
  return () => {
    x ^= x << 13
    x >>>= 0
    x ^= x >> 17
    x ^= x << 5
    x >>>= 0
    return x / 4294967296
  }
}

const scene = computed(() => {
  const s = props.stage
  const r = rng(seedOf(s.id))
  const pick = (a, b) => a + r() * (b - a)

  // 구름. 크기와 높이를 다르게 해서 깊이를 만든다
  const clouds = Array.from({ length: s.clouds ?? 0 }, (_, i) => ({
    i,
    x: pick(-40, 780),
    y: pick(18, 92),
    w: pick(70, 190),
    h: pick(14, 30),
    o: pick(0.28, 0.7),
    dur: pick(120, 260),
  }))

  // 새 떼. 한 무리가 천천히 지나간다
  const birds = s.birds
    ? Array.from({ length: 5 }, (_, i) => ({
        i,
        x: i * 22 + (i % 2) * 8,
        y: (i % 3) * 9,
        s: pick(0.8, 1.15),
      }))
    : []

  // 나무. 큰 것 하나에 작은 것들이 흩어진다
  /*
   * 나무가 서는 자리와 크기를 무대가 정할 수 있게 열어 둔다.
   *
   * 담장이 지나가는 판에서는 이 값이 그냥 두면 안 된다. 기본값은
   * 담장 한가운데를 밑동으로 잡아서, 나무들이 담 위에 심긴 꼴이 된다.
   */
  const tb = s.treeBase ?? [178, 208]
  // 나무를 판 전체에 고르게 흩지 않고 한쪽으로 모을 수 있게 열어 둔다
  const tx = s.treeX ?? [40, 760]
  const trees = Array.from({ length: s.trees ?? 0 }, (_, i) => {
    const big = s.treeBig || i === 0
    return {
      i,
      x: pick(tx[0], tx[1]),
      base: pick(tb[0], tb[1]),
      h: big ? pick(52, 66) : pick(22, 42),
      w: big ? pick(30, 40) : pick(14, 26),
      dark: r() > 0.55,
      // 흰 벚나무. 벚꽃은 원래 분홍과 흰빛이 섞여 핀다
      pale: r() > 0.52,
    }
  })

  // 덤불과 꽃
  const flowers = s.flowers
    ? Array.from({ length: 26 }, () => ({
        x: pick(10, 790),
        y: pick(202, 236),
        r: pick(2.2, 4.4),
        sway: pick(2.6, 5),
      }))
    : []

  // 전경 풀. 바람에 흔들린다
  const grass = s.grass
    ? Array.from({ length: 46 }, () => {
        const x = pick(-10, 810)
        return {
          x,
          h: pick(20, 58),
          lean: pick(-9, 9),
          sway: pick(2.2, 4.4),
          delay: pick(0, 3),
          /*
           * 새순.
           *
           * 마른 풀 사이로 갓 올라온 연둣빛. 넷에 하나꼴로 섞었더니
           * 초록 줄이 여기저기 서서 봄이 아니라 잔디밭이 됐다.
           * 열에 하나면 눈에 띄지 않으면서 판에 생기가 돈다.
           */
          fresh: r() > 0.89,
        }
      })
    : []

  /*
   * 들꽃.
   *
   * 앞쪽 띠에만 둔다. 멀리까지 흩으면 색점이 판 전체에 박혀서
   * 은은한 게 아니라 얼룩덜룩해진다. 사람들이 걷는 길가에만
   * 몇 송이 있으면 그걸로 봄이 든다.
   */
  const wildMix = s.wildMix ?? []
  const wild = wildMix.length
    ? Array.from({ length: s.wild ?? 0 }, (_, i) => ({
        i,
        x: pick(-10, 810),
        y: pick(206, 250),
        r: pick(1.3, 2.3),
        c: wildMix[Math.floor(r() * wildMix.length) % wildMix.length],
        // 옅기도 제각각으로. 다 같은 진하기면 찍어 놓은 점이 된다
        o: pick(0.45, 0.85),
        sway: pick(3, 5.4),
      }))
    : []

  // 떠다니는 것 — 홀씨·눈·별·먼지·물보라
  const motes = Array.from({ length: s.motes === 'none' ? 0 : 16 }, () => ({
    // 갓 진 꽃잎은 희고 시든 것이 분홍이다. 섞여 날려야 꽃잎으로 보인다
    pale: r() > 0.55,
    x: pick(0, 800),
    y: pick(30, 230),
    r: pick(0.9, 2.4),
    dur: pick(9, 22),
    delay: pick(0, 12),
    drift: pick(-30, 30),
  }))

  /*
   * ── 물속 ────────────────────────────────────────
   * 물고기 떼 · 해파리 · 해초 · 산호.
   *
   * 뭍의 것들과 규칙이 다르다. 나무는 땅에 박혀 있지만
   * 물고기와 해파리는 물기둥 어디에나 있을 수 있고, 늘 움직인다.
   */
  const fish = Array.from({ length: (s.fish ?? 0) * 6 }, (_, i) => ({
    i,
    // 한 떼가 비슷한 높이에서 함께 흐른다
    band: Math.floor(i / 6),
    x: pick(-60, 820),
    y: 44 + Math.floor(i / 6) * 52 + pick(-14, 14),
    sc: pick(0.55, 1.15),
    dur: pick(26, 54),
    delay: pick(-40, 0),
    // 절반은 반대로 헤엄친다
    back: r() > 0.55,
  }))

  const jellies = Array.from({ length: s.jellies ?? 0 }, (_, i) => ({
    i,
    x: pick(40, 760),
    y: pick(40, 200),
    sc: pick(0.5, 1.25),
    dur: pick(7, 13),
    delay: pick(-10, 0),
    rise: pick(16, 44),
  }))

  // 해초. 바닥에 뿌리를 두고 물살에 눕는다
  const kelp = s.kelp
    ? Array.from({ length: 22 }, () => ({
        x: pick(-20, 820),
        h: pick(70, 190),
        lean: pick(-26, 26),
        sway: pick(4.5, 9),
        delay: pick(0, 5),
        w: pick(2.4, 6),
      }))
    : []

  // 산호. 바닥에 앉은 덩어리들
  const corals = s.corals
    ? Array.from({ length: 14 }, () => ({
        x: pick(0, 800),
        y: pick(226, 248),
        r: pick(6, 20),
        arms: 3 + Math.floor(r() * 3),
        lit: r() > 0.62,
      }))
    : []

  /*
   * 암초.
   *
   * 산 능선을 색만 바꿔 쓰면 물속에서도 산으로 보인다. 능선은 하늘과
   * 맞닿은 선이라 위가 뾰족하고 아래가 넓은데, 물속 바위는 그렇지 않다 —
   * 물이 깎아서 위가 둥글고 옆으로 퍼진다.
   * 그래서 꺾인 선이 아니라 둥근 덩어리를 겹쳐 세운다.
   */
  const reef = s.reef
    ? Array.from({ length: 3 }, (_, band) => ({
        band,
        o: 0.32 + band * 0.3,
        rocks: Array.from({ length: 5 - band }, () => {
          const w = pick(120, 300) * (1 - band * 0.16)
          return { x: pick(-80, 820), w, h: pick(46, 128) * (1 - band * 0.2) }
        }),
        base: 236 - band * 30,
      }))
    : []

  /*
   * 마린 스노우.
   *
   * 위에서 끊임없이 내려오는 부유물. 심해를 심해로 보이게 하는 것은
   * 사실 이것 하나다 — 물이 맑으면 그냥 파란 방이고,
   * 무언가가 천천히 가라앉고 있어야 깊이가 생긴다.
   * 아주 느리게, 아주 작게. 눈처럼 흩날리면 눈이 된다.
   */
  const marine = s.marine
    ? Array.from({ length: 54 }, () => ({
        x: pick(0, 800),
        y: pick(-30, 260),
        r: pick(0.5, 1.7),
        dur: pick(30, 80),
        delay: pick(-70, 0),
        drift: pick(-16, 16),
        o: pick(0.18, 0.5),
      }))
    : []

  // 스스로 빛나는 것들. 깊을수록 빛은 위에서 오지 않는다
  const glows = Array.from({ length: s.glows ?? 0 }, () => ({
    x: pick(16, 784),
    y: pick(46, 244),
    r: pick(1.4, 3.6),
    dur: pick(3, 8),
    delay: pick(-8, 0),
  }))

  /*
   * ── 바닷가 ──────────────────────────────────────
   *
   * 물이 뭍에 닿는 자리를 y 206 으로 잡았다. 그 위는 바다, 아래는 모래다.
   * 사람은 지면(y 228)에서 걸으니 모래가 스물두 칸쯤 남는다 —
   * 걸을 자리는 있고 바다는 충분히 넓다.
   */
  const SHORE = 206

  // 파도. 해안선까지 밀려왔다가 빠진다. 저마다 다른 박자로
  const waves = Array.from({ length: s.waves ?? 0 }, (_, i) => ({
    i,
    y: SHORE - 26 + i * 5.5,
    dur: pick(5.5, 9),
    delay: pick(-9, 0),
    // 뒤쪽 파도일수록 옅고 얇다
    o: 0.25 + i * 0.13,
    w: 1.1 + i * 0.35,
  }))

  /*
   * 나는 갈매기.
   *
   * 새 떼(birds)는 한 무리가 대열을 지어 지나간다. 바닷가 갈매기는
   * 그렇게 날지 않는다 — 저마다 다른 높이에서 각자 원을 그린다.
   * 그래서 한 마리씩 다른 궤도와 박자를 준다.
   */
  const gulls = Array.from({ length: s.gulls ?? 0 }, (_, i) => ({
    i,
    /*
     * 바다 위를 낮게 난다.
     *
     * 처음에는 하늘 높이(y 28~128)에 띄웠다. 그런데 판은 접혀 있을 때가
     * 대부분이고, 접히면 아래쪽 절반만 보인다. 갈매기가 통째로 잘려서
     * 판을 펼치기 전에는 한 마리도 없는 바닷가였다.
     *
     * 접히면 화폭 아래쪽 y 137~260 만 보인다. 그 안에서 날아야 한다.
     * 실제 갈매기도 하늘 높이 떠 있지 않다. 물 위를 낮게 훑는다.
     */
    y: pick(146, 196),
    sc: pick(0.6, 1.25),
    dur: pick(26, 52),
    delay: pick(-50, 0),
    // 오르내리는 폭. 갈매기는 곧게 날지 않는다
    rise: pick(10, 30),
    bob: pick(3.5, 7),
    back: r() > 0.5,
  }))

  /*
   * 돌고래.
   *
   * 물 밖으로 솟았다 들어간다. 뛰는 순간만 보이고 나머지는 물속이라,
   * 한 번 뛰는 데 쓰는 시간이 전체의 십 분의 일도 안 된다.
   * 자주 뛰면 놀랍지 않다.
   */
  const dolphins = Array.from({ length: s.dolphins ?? 0 }, (_, i) => ({
    i,
    x: pick(120, 660),
    y: pick(184, 197),
    sc: pick(0.72, 1),
    dur: pick(19, 33),
    delay: pick(-30, 0),
    back: r() > 0.5,
  }))

  /*
   * ── 공룡 판 ─────────────────────────────────────
   *
   * 이 무대만 어린이 스티커북처럼 그린다. 그래서 모든 것에 굵은 외곽선을
   * 두르고, 판 전체가 파스텔 모브인데 테두리만 시안이다.
   * 참조한 표지에서 시안은 0.5% 밖에 안 쓰였는데, 그 0.5% 가 이 표지를
   * 나머지 열둘과 갈라 놓는다.
   */

  // 먼 화산. 연기가 오래 피어오른다
  const volcanoes = Array.from({ length: s.volcanoes ?? 0 }, (_, i) => ({
    i,
    x: 150 + i * 380 + pick(-50, 50),
    base: 176 - i * 6,
    w: pick(120, 190),
    h: pick(48, 78),
    dur: pick(16, 26),
    delay: pick(-20, 0),
    /*
     * 터지는 주기. 아주 길다.
     * 한 바퀴의 96% 는 아무 일도 없고 연기만 오른다. 자주 터지면
     * 놀랍지 않을뿐더러, 이 판이 조용히 지나가는 배경이 아니게 된다.
     * 둘이 같이 터지지 않도록 주기와 시작을 어긋뜨린다.
     */
    blastDur: pick(34, 52),
    blastDelay: pick(-48, 0),
    // 튀어 오르는 용암 방울. 각도와 세기를 미리 정해 둔다
    lava: Array.from({ length: 7 }, () => ({
      dx: pick(-26, 26),
      dy: pick(-34, -16),
      r: pick(1.4, 3),
      d: pick(0, 0.28),
    })),
  }))

  // 소철. 굵은 줄기에 잎이 부챗살처럼 퍼진다
  /*
   * 땅에 심는 것들의 높이.
   *
   * 전에는 y 를 고정 범위에서 뽑았다. 그런데 지면은 평평하지 않고
   * 근경 언덕이 오르내려서, 언덕이 꺼진 자리에 심긴 것은 허공에 떴다.
   * 살랑거리기는 하는데 뿌리가 없는 풀이었다.
   *
   * 근경 언덕(⑪)의 곡선을 따라 높이를 되돌려 준다. 그 위에 심으면
   * 어디에 두어도 땅을 딛는다. 아래로 조금 묻어 심어야 경계가 안 보인다.
   */
  const soilAt = (x) => {
    const t = Math.max(0, Math.min(1, x / 800))
    // M0 196 c140 -20 214 -12 320 10 s186 12 316 -14 s132 -10 164 6
    return 196 - 16 * Math.sin(t * Math.PI * 1.9) + 12 * Math.sin(t * Math.PI * 3.4 + 1)
  }

  const cycads = Array.from({ length: s.cycads ?? 0 }, (_, i) => {
    const x = pick(20, 780)
    return {
      i,
      x,
      y: soilAt(x) + pick(3, 12),
      sc: pick(0.7, 1.25),
      fronds: 6 + Math.floor(r() * 3),
      sway: pick(5, 9),
      delay: pick(0, 5),
    }
  })

  /*
   * 나무고사리. 이 숲에서 가장 큰 것.
   * 가는 줄기 하나가 곧게 오르고 꼭대기에서만 잎이 우산처럼 펼쳐진다.
   */
  const treeferns = Array.from({ length: s.treeferns ?? 0 }, (_, i) => {
    const x = pick(30, 770)
    return {
      i,
      x,
      y: soilAt(x) + pick(2, 8),
      h: pick(38, 62),
      sc: pick(0.85, 1.2),
      // 위쪽 반원을 채우려면 7 로는 성기다. 사이가 뜨면 우산이 아니라 별이 된다
      fronds: 9,
      sway: pick(6, 10),
      delay: pick(0, 6),
    }
  })

  // 은행. 잎이 부채꼴이고 가지가 성기다
  /*
   * 은행은 멀리 세우지 않는다.
   *
   * 은행만 줄기가 가는 맨 가지다(2.6). 뒤쪽 언덕 위에 작게 세웠더니
   * 화면에서 줄기가 2px 남짓이 되고 뒤 언덕과 색이 붙어 사라져서,
   * 잎 세 장만 화산 옆 공중에 뜬 그림이 됐다.
   * 지면이 앞쪽인 자리(y 200 아래)에만 남긴다. 남는 수가 줄어도
   * 좋다 — 서 있을 자리가 없으면 없는 편이 낫다.
   */
  const ginkgos = Array.from({ length: s.ginkgos ?? 0 }, (_, i) => {
    const x = pick(40, 760)
    return {
      i,
      x,
      y: soilAt(x) + pick(2, 9),
      h: pick(26, 44),
      sc: pick(0.8, 1.15),
      sway: pick(5.5, 9),
      delay: pick(0, 5),
    }
  }).filter((g) => g.y >= 200)

  // 속새. 마디로 이어진 대롱이 곧게 선다. 무리 지어 난다
  const horsetails = Array.from({ length: s.horsetails ?? 0 }, (_, i) => {
    const x = pick(0, 800)
    return {
      i,
      x,
      y: Math.max(soilAt(x) + 6, pick(228, 250)),
      h: pick(14, 26),
      n: 3 + Math.floor(r() * 3),
      sway: pick(4, 7),
      delay: pick(0, 4),
    }
  })

  /*
   * 덤불. 잎 몇 장이 뭉쳐 낮게 퍼진다.
   *
   * 이 판에서 줄기가 아예 없는 것은 덤불뿐이다. 잎 대여섯 장이
   * 한 점에서 위로 벌어질 뿐이라, 땅에 붙어 있다는 표시가
   * 뿌리 그림자(opacity 0.3) 하나밖에 없다.
   *
   * 그래서 지면선에 가까이 서면 안 된다. 지면선 바로 아래에 두었더니
   * 오른쪽 화산 옆에서 잎 여섯 장만 공중에 뜬 것으로 보였다 —
   * 뒤 언덕과 앞 땅의 경계가 그 자리를 지나서, 뿌리 그림자가
   * 경계선에 먹혔기 때문이다.
   *
   * 지면선에서 26 아래로 내려온 자리에만 남긴다. 그만큼 내려오면
   * 앞 땅 한가운데라 밑에 땅이 깔리고, 줄기가 없어도 놓인 것으로 읽힌다.
   * 남는 수가 줄어도 좋다 — 뜬 것을 하나 두느니 둘만 두는 편이 낫다.
   */
  const shrubs = Array.from({ length: s.shrubs ?? 0 }, (_, i) => {
    const x = pick(-10, 810)
    return {
      i,
      x,
      y: Math.max(soilAt(x) + 8, pick(232, 254)),
      sc: pick(0.8, 1.4),
      leaves: 5 + Math.floor(r() * 3),
      sway: pick(4.5, 8),
      delay: pick(0, 5),
    }
  }).filter((b) => b.y - soilAt(b.x) >= 26)

  // 고사리. 전경에 낮게 깔린다
  const ferns = Array.from({ length: s.ferns ?? 0 }, () => {
    const x = pick(-10, 810)
    return {
      x,
      y: Math.max(soilAt(x) + 8, pick(232, 256)),
      sc: pick(0.6, 1.2),
      lean: pick(-1, 1) > 0 ? 1 : -1,
      sway: pick(3.4, 6),
      delay: pick(0, 4),
    }
  })

  /*
   * 알 둥지.
   * 하나만 둔다. 여럿 두면 알 가게가 된다.
   * 가운데 알만 아주 가끔 흔들린다 — 안에 무언가 있다는 뜻이다.
   */
  const nest = s.eggs ? { x: pick(120, 660), y: pick(238, 248), sc: pick(0.9, 1.2) } : null

  /*
   * 다른 공룡들.
   *
   * 식물을 아무리 여러 종 심어도 숲은 숲일 뿐이라, 이 판이
   * 공룡 판이라는 말은 공룡이 해야 한다.
   * 종을 셋으로 나눈다 — 실루엣이 서로 확실히 다른 것들로.
   *
   *   0  등에 판이 늘어선 것
   *   1  머리에 뿔과 목도리를 두른 것
   *   2  두 발로 서서 꼬리를 곧게 뻗은 것
   *
   * 주인공 무리보다 작고 뒤에 선다. 걷지 않고 제자리에서
   * 고개만 움직인다 — 걸어다니는 것이 여럿이면 눈이 갈 곳을 잃는다.
   */
  /*
   * 다른 공룡들의 색.
   *
   * 셋 다 어미와 같은 초록이었더니 종만 다르고 다 한 무리로 보였다.
   * 그렇다고 아무 색이나 쓸 수는 없다 — 이 판은 파스텔 모브 위에
   * 시안 하나를 얹은 판이라, 채도 높은 색을 들이면 그 규칙이 깨진다.
   *
   * 모브와 부딪히지 않는 쪽으로 셋을 고른다.
   *   청록  시안 쪽으로 기운 초록. 어미의 초록과 이 판의 시안 사이에 선다
   *   황토  모브의 보색 쪽. 분홍 바탕에서 가장 또렷하게 떨어진다
   *   코럴  용암과 같은 계열의 흐린 주홍. 따뜻한 쪽을 하나 남겨 둔다
   *
   * 종마다 몸 · 다리 · 등판 세 단을 함께 준다. 몸만 바꾸면
   * 다리가 어미 색으로 남아 몸에서 떨어져 보인다.
   */
  const OTHER_COATS = [
    { coat: '#6FAEA0', limb: '#568F83', trim: '#9BCDC3' },
    { coat: '#C9AC5A', limb: '#A78F44', trim: '#E2CA8B' },
    { coat: '#CF8874', limb: '#AC6B59', trim: '#E9AE9C' },
  ]

  /*
   * 색은 한 번만 돌린다.
   *
   * 마리마다 따로 뽑았더니 셋 중 둘이 같은 색으로 나왔다.
   * 시작 자리 하나만 뽑고 거기서부터 차례로 나눠 주면 세 색이
   * 반드시 서로 다르다. 어느 종이 어느 색인지는 무대마다 바뀐다.
   */
  const coatShift = Math.floor(r() * 3)

  const others = Array.from({ length: s.others ?? 0 }, (_, i) => {
    const x = pick(60, 740)
    return {
      i,
      kind: i % 3,
      // 종과 색을 따로 돌린다. 같은 종이 늘 같은 색이면 셋이 한 벌처럼 보인다
      ...OTHER_COATS[(i + coatShift) % 3],
      x,
      y: soilAt(x) + pick(4, 12),
      sc: pick(0.5, 0.78),
      back: r() > 0.5,
      bob: pick(3.4, 6),
      delay: pick(0, 5),
      /*
       * 이 공룡들은 걷지 않는다.
       *
       * 좁게 오가게 해 봤는데, 좌우로 왕복하면서 몸은 뒤집히지 않으니
       * 절반은 뒤로 걷는 꼴이었다. 방향을 뒤집으면 무리처럼 부산해지고,
       * 안 뒤집으면 뒷걸음이다.
       *
       * 서서 할 수 있는 것만 시킨다 — 풀을 뜯고, 꼬리를 흔들고,
       * 이따금 고개를 들어 둘러본다. 배경에 있는 것은 그걸로 족하다.
       */
      tail: pick(2.6, 4.4),
      breath: pick(3.6, 5.8),
    }
  })
  /*
   * 겹친 것만 푼다.
   *
   * 셋 중 둘이 거의 같은 자리에 서서 두 마리가 아니라 겹쳐 그린
   * 한 마리로 보였다. 배경에 세 종을 세운 이유가 실루엣이 서로
   * 다르다는 것인데, 포개지면 그 이유가 없어진다.
   *
   * 그렇다고 고르게 흩으면 안 된다. 판을 삼등분해 한 마리씩 세워
   * 봤더니, 뭉쳐 선 둘이 판 양끝으로 갈라져서 같이 있던 둘이
   * 남남이 됐다. 붙어 선 것은 붙어 선 채로 두는 게 맞다.
   *
   * 그래서 자리는 그대로 두고, 너무 가까운 짝만 몸 하나 너비에
   * 조금 못 미치는 거리(0.9)까지 밀어낸다. 그만큼이면 뒤엣것의
   * 앞자락이 앞엣것에 살짝 물린다 — 겹쳐 그린 하나가 아니라
   * 나란히 선 둘로 보이는 최소한의 거리다.
   */
  // 꼬리 끝에서 주둥이 끝까지, scale 1 기준. 몸통이 아니라 실루엣 너비다
  const BODY = 88
  others
    .slice()
    .sort((a, b) => a.x - b.x)
    .forEach((o, i, sorted) => {
      if (i === 0) return
      const prev = sorted[i - 1]
      // 딱 붙는 거리가 BODY * 평균 배율. 그 0.82 면 한 뼘쯤만 물린다
      const gap = BODY * ((prev.sc + o.sc) / 2) * 0.82
      if (o.x - prev.x < gap) o.x = prev.x + gap
    })

  // 아기 공룡. 알 근처를 종종거린다
  const hatchlings = Array.from({ length: s.hatchlings ?? 0 }, (_, i) => ({
    i,
    x: pick(60, 720),
    y: pick(232, 250),
    sc: pick(0.95, 1.4),
    dur: pick(16, 30),
    delay: pick(-26, 0),
    span: pick(50, 130),
    step: pick(0.42, 0.66),
    back: r() > 0.5,
  }))

  // 익룡. 하늘을 가로지른다
  const pterosaurs = Array.from({ length: s.pterosaurs ?? 0 }, (_, i) => ({
    i,
    y: pick(40, 132),
    sc: pick(0.55, 1),
    dur: pick(34, 62),
    delay: pick(-58, 0),
    rise: pick(10, 26),
    flap: pick(1.6, 2.6),
    back: r() > 0.5,
  }))

  // 모래 위를 걷는 갈매기. 물가를 따라 종종거린다
  const strollers = Array.from({ length: s.walkers ?? 0 }, (_, i) => ({
    i,
    x: pick(60, 720),
    y: SHORE + pick(6, 18),
    sc: pick(0.55, 0.8),
    dur: pick(22, 40),
    delay: pick(-30, 0),
    span: pick(40, 110),
    step: pick(0.5, 0.8),
    back: r() > 0.5,
  }))

  // 꽃게. 옆으로만 걷는다
  const crabs = Array.from({ length: s.crabs ?? 0 }, (_, i) => ({
    i,
    x: pick(40, 740),
    y: SHORE + pick(14, 30),
    sc: pick(0.6, 1),
    dur: pick(14, 26),
    delay: pick(-24, 0),
    span: pick(50, 130),
    step: pick(0.34, 0.5),
    back: r() > 0.5,
  }))

  // 소라 · 조개 · 불가사리. 모래 위에 흩어져 가만히 있는 것들
  const shells = Array.from({ length: s.shells ?? 0 }, () => ({
    x: pick(10, 790),
    y: SHORE + pick(8, 44),
    sc: pick(0.7, 1.3),
    kind: Math.floor(r() * 3),
    tilt: pick(-24, 24),
  }))

  return {
    others,
    volcanoes,
    cycads,
    treeferns,
    ginkgos,
    horsetails,
    shrubs,
    ferns,
    nest,
    hatchlings,
    pterosaurs,
    waves,
    gulls,
    dolphins,
    strollers,
    crabs,
    shells,
    clouds,
    birds,
    trees,
    flowers,
    grass,
    wild,
    motes,
    fish,
    jellies,
    kelp,
    corals,
    reef,
    marine,
    glows,
  }
})

// 산 능선. 겹마다 높이와 들쭉날쭉함을 달리한다
const ridge = (base, amp, seed) => {
  const r = rng(seed)
  let d = `M0 ${base}`
  for (let x = 0; x <= 800; x += 50) {
    d += ` L${x} ${Math.round(base - r() * amp)}`
  }
  return `${d} L800 260 L0 260Z`
}
/*
 * 나비.
 *
 * ── 왜 다시 짰나 ────────────────────────────────
 * 한동안 좌표를 손으로 찍고 CSS 키프레임으로 움직였다. 옆모습으로도
 * 그려 보고 비스듬한 각도로도 그려 봤지만 어느 쪽도 나비가 아니었다.
 *
 * 문제는 그림이 아니라 방식이었다. 나비의 생김은 각도에 따라 달라지는데,
 * 한 각도로 그려 놓고 눌렀다 폈다 하면 그건 나비의 모습이 아니라
 * 나비 그림을 눌렀다 편 것이다.
 *
 * 그래서 삼차원 자세를 매 프레임 계산해서 그린다. 날개가 몸통을 축으로
 * 얼마나 들렸는지(θ), 우리가 그 몸통을 어느 각도에서 보고 있는지(φ),
 * 이 둘로 두 날개의 보이는 폭이 정해진다.
 *
 *   먼 쪽 날개 폭  =  cos(θ − φ)
 *   가까운 날개 폭 = −cos(θ + φ)
 *
 * 이 한 줄이 지금까지 따로 만들려던 것들을 한꺼번에 준다 —
 * 위에서 본 모습, 옆에서 본 모습, 그 사이의 모든 각도, 날갯짓,
 * 그리고 날개가 몸 위로 모이는 순간까지.
 *
 * 각도가 90도를 넘으면 가까운 날개가 먼 날개와 같은 쪽으로 넘어간다.
 * 옆에서 본 나비가 날개를 세우면 두 장이 몸 위에 겹치는데, 그 모습이
 * 계산에서 저절로 나온다. 따로 그릴 필요가 없다.
 *
 * ── 그리는 자세 ────────────────────────────────
 * 머리를 위로 둔 위에서 본 모습으로 그린다. 앞날개는 오른쪽 위로 뻗고
 * 뒷날개가 그 뒤를 받친다. 왼쪽 날개는 같은 그림을 x 로 뒤집어 쓴다.
 *
 * 판에 세울 때는 가는 방향으로 통째로 돌린다. 위에서 본 그림을 방향에
 * 맞춰 돌리는 것이라, 왼쪽으로 날든 오른쪽으로 날든 따로 뒤집을 일이 없다.
 */

/*
 * 앞날개.
 * 앞가장자리는 활처럼 바깥으로 휘고, 끝(apex)은 모난다.
 * 바깥가장자리는 안쪽으로 살짝 패어 들어온다 — 이 오목함이
 * 앞날개를 잎사귀가 아닌 날개로 만든다.
 */
const BF_FORE =
  'M1.5-6C7-10 14-14.5 19.5-17.2L21-15.2C19.8-10.5 16.8-4.5 13.2 .8 9 2 5 2.2 1.5 1.5Z'
/*
 * 뒷날개.
 * 앞날개보다 짧고 둥글다. 바깥가장자리가 볼록해서 부채처럼 퍼진다.
 * 안쪽 절반은 앞날개에 가려지는데, 그 겹침이 날개를 두 장으로 읽게 한다.
 */
const BF_HIND =
  'M1.2-1C5 0 9.5 .8 12.2 2.8 14 4.4 13 8.4 9.6 11 7.6 12.6 5 12.4 3.6 10.4 2.2 8.4 1.4 4 1.2-1Z'
/*
 * 날개 끝 무늬.
 * 흰나비의 앞날개 끝은 짙다. 무늬 하나가 흰 덩어리를 날개로 바꾼다 —
 * 눈이 끝을 찾을 수 있게 되어서 방향이 생긴다.
 */
const BF_TIP = 'M19.5-17.2L21-15.2C20-12.4 18.5-9.4 16.8-6.4 15.2-9 15.4-13.2 17.4-15.8Z'
/*
 * 몸통.
 *
 * 날개에 비해 작아야 한다. 나비와 다른 곤충을 가르는 건 무늬도 색도
 * 아니고 이 비율이다 — 날개 폭이 몸 길이의 세 배쯤 된다.
 * 몸을 조금만 키워도 나방이 되고, 조금 더 키우면 파리가 된다.
 */
const BF_BODY =
  'M-1.3-6C-1.7-3-1.6-1-1.3 1.4-1 4.2-.6 6 0 7.4 .6 6 1 4.2 1.3 1.4 1.6-1 1.7-3 1.3-6Z'

/*
 * 세 마리, 세 갈래.
 *
 * 자리를 시각마다 적어 두고 사이를 곡선으로 잇는다. 마디를 직선으로
 * 이으면 매듭마다 꺾여서 종이비행기가 된다.
 *
 * 깊이는 적지 않는다. 판의 원근에서 끌어다 쓴다 — 아래 주석 참고.
 *
 * 같은 자리를 두 번 적어 두면 그동안 머문다. 그게 꽃에 앉아 있는 때다.
 * 도는 시간을 서로 배수가 아니게 두고(38 · 45 · 33초) 시작도 어긋내
 * 두었다. 셋이 같은 때에 멀어지면 판 가운데로 몰린다.
 */
const BF_DEFS = [
  {
    id: 'a',
    sc: 0.72,
    beat: 0.34,
    seed: 0.7,
    loop: 38,
    offset: 0,
    // 앉은 동안 가끔 날개를 천천히 여닫는 때
    pulses: [2.4, 4.1, 35.2, 36.8],
    // 왼쪽 벚꽃에 앉았다가 들판 쪽으로 나갔다 온다
    keys: [
      [0, 168, 58],
      [5, 168, 58],
      [6.2, 188, 68],
      [8.5, 236, 88],
      [11, 288, 108],
      [13.5, 340, 126],
      [16.5, 392, 144],
      [19, 428, 156],
      [21.5, 400, 148],
      [24, 348, 132],
      [26.5, 292, 114],
      [29, 238, 92],
      [31, 198, 72],
      [32.6, 172, 62],
      [33.6, 168, 58],
      [38, 168, 58],
    ],
  },
  {
    id: 'b',
    sc: 0.64,
    beat: 0.3,
    seed: 2.9,
    loop: 45,
    offset: 23,
    pulses: [1.8, 3.4, 41.6, 43.4],
    // 오른쪽 벚꽃에서 왼쪽 들판으로
    keys: [
      [0, 612, 34],
      [4.5, 612, 34],
      [5.8, 594, 44],
      [8.5, 546, 66],
      [11.5, 490, 90],
      [14.5, 432, 112],
      [18, 372, 134],
      [21, 330, 150],
      [24, 366, 138],
      [27, 422, 118],
      [30, 478, 98],
      [33, 532, 76],
      [36, 576, 56],
      [38.5, 606, 40],
      [39.6, 612, 34],
      [45, 612, 34],
    ],
  },
  {
    id: 'c',
    sc: 0.78,
    beat: 0.38,
    seed: 5.1,
    loop: 33,
    offset: 12,
    pulses: [1.2, 2.6, 31.8],
    // 길가 풀에 앉았다가 들판 위로 올라갔다 온다
    keys: [
      [0, 330, 214],
      [3.5, 330, 214],
      [4.6, 346, 200],
      [6.6, 380, 176],
      [8.8, 356, 156],
      [11.2, 404, 140],
      [13.8, 456, 128],
      [16.5, 508, 122],
      [18.5, 540, 126],
      [21, 502, 140],
      [23.5, 452, 158],
      [26, 404, 178],
      [28.4, 362, 198],
      [30.4, 338, 210],
      [31.4, 330, 214],
      [33, 330, 214],
    ],
  },
]

/*
 * 깊이는 판의 원근에서 가져온다.
 *
 * 나비만의 깊이 값을 따로 적어 뒀더니 배경과 어긋났다. 화면 아래로
 * 내려가면서 오히려 작아지는 일이 생겼는데, 아래쪽은 앞쪽 풀밭이라
 * 가까워야 하는 자리다.
 *
 * 이 판의 원근은 단순하다. 지평선 언저리(y 168, 담장이 지나가고 산이
 * 맞닿는 자리)가 가장 멀고, 거기서 위로 올라갈수록 — 하늘 쪽으로,
 * 늘어진 가지 쪽으로 — 가까워지고, 아래로 내려갈수록 — 앞쪽 풀밭으로 —
 * 역시 가까워진다.
 *
 * 위아래로 벌어지는 폭이 다르다. 하늘은 넓게 열려 있고 앞쪽 땅은
 * 좁은 띠라서, 아래쪽이 훨씬 가파르게 가까워진다.
 */
const HORIZON = 168
const SKY_SPAN = 145
const GROUND_SPAN = 62
const depthAt = (y) => {
  const away = y < HORIZON ? (HORIZON - y) / SKY_SPAN : (y - HORIZON) / GROUND_SPAN
  return 1 - Math.min(away, 1)
}

// 네 점을 지나는 부드러운 곡선. 마디에서 꺾이지 않는다
const spline = (a, b, c, d, t) => {
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
  )
}
const trackAt = (keys, t) => {
  let i = 0
  while (i < keys.length - 2 && keys[i + 1][0] <= t) i++
  const k1 = keys[i]
  const k2 = keys[i + 1]
  const k0 = keys[Math.max(i - 1, 0)]
  const k3 = keys[Math.min(i + 2, keys.length - 1)]
  const u = Math.min(Math.max((t - k1[0]) / Math.max(k2[0] - k1[0], 1e-4), 0), 1)
  return [spline(k0[1], k1[1], k2[1], k3[1], u), spline(k0[2], k1[2], k2[2], k3[2], u)]
}

const smoothStep = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/*
 * 날갯짓 한 번.
 *
 * 내리치는 쪽이 올리는 쪽보다 빠르다. 힘을 주는 것이 내리치는 동작이라
 * 그렇고, 좌우를 같은 속도로 두면 박자가 시계추처럼 들린다.
 *
 * 위로 74도까지 올라가 몸 위에서 거의 만나고, 아래로는 30도까지만
 * 내려간다. 위아래를 대칭으로 두면 파닥이는 게 아니라 젓는 것이 된다.
 */
const beatAngle = (u) => {
  const UP = 74
  const DOWN = -30
  if (u < 0.42) return UP + (DOWN - UP) * smoothStep(u / 0.42)
  return DOWN + (UP - DOWN) * smoothStep((u - 0.42) / 0.58)
}

/*
 * 얼마나 세게, 얼마나 자주 치는가.
 *
 * 나비는 쉬지 않고 파닥이지 않는다. 몇 번 치고 잠깐 활공하고 또 몇 번
 * 친다. 일정한 박자로 계속 치면 그건 나비가 아니라 벌이다.
 *
 * 그래서 사인 하나 안에 사인을 넣어 주기를 흐트러뜨린다. 두 주기가
 * 서로 나누어떨어지지 않아 같은 마디가 되풀이되지 않는다.
 * 이 값이 날갯짓의 빠르기와 폭을 함께 정하므로, 잦아들 때는
 * 느려지면서 얕아진다 — 실제로 그렇게 잦아든다.
 */
const beatDrive = (t, seed) => {
  const a = Math.sin(t * 0.62 + seed)
  const b = Math.sin(t * 1.43 + a * 2.2 + seed * 1.7)
  return 0.5 + 0.5 * b
}
// 활공 자세. 날개를 조금 든 채로 흐른다
const GLIDE = 34

/*
 * 앉아 있을 때의 날개.
 *
 * 반쯤 든 채로 가만히 있다가, 가끔 한 번씩 천천히 여닫는다.
 * 앉은 나비가 쉬지 않고 날갯짓을 하면 앉은 것이 아니라 뜨려는 것이다.
 */
const perchAngle = (t, def) => {
  let dip = 0
  for (const p of def.pulses) {
    const d = Math.abs(t - p)
    if (d < 1.1) dip = Math.max(dip, Math.cos(((d / 1.1) * Math.PI) / 2))
  }
  return 54 - 34 * dip
}

/*
 * 비행기와 비행운.
 *
 * ── 꼬리부터 사라진다 ──────────────────────────
 * 비행운은 그어지는 선이 아니라 흩어지는 구름이다. 비행기가 지나간
 * 자리에 생겨서, 오래된 쪽 — 그러니까 꼬리 끝 — 부터 옅어지며 풀린다.
 * 선을 긋고 지우는 것으로는 이 결이 안 나온다.
 *
 * ── 두 줄을 겹친다 ─────────────────────────────
 * 갓 생긴 자리는 가늘고 또렷하고, 시간이 지난 자리는 퍼지면서 흐려진다.
 * 그래서 가는 선 하나와 굵고 옅은 선 하나를 겹친다.
 *   가는 선  꼬리에서 0, 비행기 쪽으로 갈수록 진해진다
 *   굵은 선  꼬리도 0, 비행기 쪽도 0, 가운데가 가장 진하다
 * 굵은 선의 가운데가 '퍼지는 중' 인 자리다.
 *
 * 그라디언트의 두 끝을 매 프레임 꼬리와 머리에 맞춘다. 조각을 여럿
 * 그려 각각 옅기를 주는 방법도 있지만, 그러면 매 프레임 수십 개를
 * 고쳐야 한다. 이쪽은 좌표 넷이면 된다.
 *
 * 색은 구름색(bloom)이 아니라 순백이다. 이 판의 구름색은 봄볕에 맞춰
 * 크림빛으로 옮겨 두었는데, 그 색으로 그었더니 옅은 하늘에 묻혀
 * 있는지 없는지 알 수 없었다. 비행운은 높은 데서 언 얼음이라
 * 구름보다 희고, 흴수록 하늘과 갈린다.
 *
 * 색은 구름색(bloom)이 아니라 순백이다. 이 판의 구름색은 봄볕에 맞춰
 * 크림빛으로 옮겨 두었는데, 그 색으로 그었더니 옅은 하늘에 묻혀
 * 있는지 없는지 알 수 없었다. 비행운은 높은 데서 언 얼음이라
 * 구름보다 희고, 흴수록 하늘과 갈린다.
 *
 * ── 평화롭게 ───────────────────────────────────
 * 판을 가로지르는 데 46초, 한 바퀴는 74초다. 비행기가 나간 뒤에도
 * 꼬리는 한동안 남아 마저 풀리고, 그다음 잠깐 빈 하늘이 있다.
 * 서둘러 지나가면 평화로운 게 아니라 바쁜 것이 된다.
 */
/*
 * 항로.
 *
 * 곧은 선분으로 뒀더니 자로 그은 것처럼 보였다. 높이 나는 비행기가
 * 곧게 가는 건 맞지만, 판을 가로지르는 동안 우리가 보는 건 고개를
 * 돌려 가며 따라가는 호(弧)다. 양 끝이 낮고 가운데가 높다.
 * 판 길이의 2% 도 안 되는 휨이지만 그 2% 가 도면과 하늘을 가른다.
 */
const PLANE_FROM = [-70, 58]
const PLANE_TO = [870, 46]
const PLANE_BOW = 20
const PLANE_CROSS = 46
const PLANE_CYCLE = 74
// 비행운이 덮는 길이. 판 길이의 절반쯤이라야 하늘을 가로지른 것으로 보인다
const PLANE_TRAIL = 0.48

const PLANE_MID = (() => {
  const mx = (PLANE_FROM[0] + PLANE_TO[0]) / 2
  const my = (PLANE_FROM[1] + PLANE_TO[1]) / 2
  const dx = PLANE_TO[0] - PLANE_FROM[0]
  const dy = PLANE_TO[1] - PLANE_FROM[1]
  const len = Math.hypot(dx, dy)
  // 진행 방향의 왼쪽(위쪽)으로 띄운다
  return [mx + (dy / len) * PLANE_BOW * 2, my - (dx / len) * PLANE_BOW * 2]
})()
// 이차 곡선 위의 한 점
const planeAt = (u) => {
  const v = 1 - u
  return [
    v * v * PLANE_FROM[0] + 2 * v * u * PLANE_MID[0] + u * u * PLANE_TO[0],
    v * v * PLANE_FROM[1] + 2 * v * u * PLANE_MID[1] + u * u * PLANE_TO[1],
  ]
}
// 그 점에서의 진행 방향
const planeDir = (u) => {
  const v = 1 - u
  return [
    2 * (v * (PLANE_MID[0] - PLANE_FROM[0]) + u * (PLANE_TO[0] - PLANE_MID[0])),
    2 * (v * (PLANE_MID[1] - PLANE_FROM[1]) + u * (PLANE_TO[1] - PLANE_MID[1])),
  ]
}

/*
 * 꼬리의 처짐.
 *
 * 비행운은 생긴 자리에 가만히 있지 않는다. 바람에 밀리고 무거워져
 * 천천히 가라앉는다. 갓 생긴 쪽은 아직 항로에 붙어 있고 꼬리로 갈수록
 * 내려앉아서, 비행운은 늘 항로보다 조금 휘어 있다.
 *
 * 곧게 그은 비행운이 도면처럼 보이던 건 이 처짐이 없어서였다.
 * 초당 0.55 씩 내려앉으므로 스물두 초 묵은 꼬리 끝은 열둘 남짓 처진다.
 */
const TRAIL_SAG = 0.55
const sagAt = (age) => [age * TRAIL_SAG * 0.16, age * TRAIL_SAG]

const planeState = ref({
  on: false,
  fly: false,
  op: 0,
  rot: 0,
  d: '',
  px: 0,
  py: 0,
  tx: 0,
  ty: 0,
  hx: 0,
  hy: 0,
})

const stepPlane = (time) => {
  const d = (time % PLANE_CYCLE) / PLANE_CROSS
  const head = Math.min(d, 1)
  const tail = Math.max(d - PLANE_TRAIL, 0)
  if (tail >= head)
    return { on: false, fly: false, op: 0, d: '', px: 0, py: 0, rot: 0, tx: 0, ty: 0, hx: 0, hy: 0 }
  const [rawTx, rawTy] = planeAt(tail)
  const [hx, hy] = planeAt(head)
  // 꼬리와 가운데는 나이만큼 내려앉아 있다
  const [tsx, tsy] = sagAt((d - tail) * PLANE_CROSS)
  const tx = rawTx + tsx
  const ty = rawTy + tsy
  const midU = (tail + head) / 2
  const [rawMx, rawMy] = planeAt(midU)
  const [msx, msy] = sagAt((d - midU) * PLANE_CROSS)
  const mx = rawMx + msx
  const my = rawMy + msy
  // 꼬리 · 가운데 · 머리 를 지나는 이차 곡선
  const cx = 2 * mx - (tx + hx) / 2
  const cy = 2 * my - (ty + hy) / 2
  const [dirX, dirY] = planeDir(head)
  return {
    on: true,
    // 비행기는 판을 다 건너면 나간다. 꼬리만 남아 마저 풀린다
    fly: d <= 1,
    // 나간 뒤에는 남은 꼬리가 통째로 옅어진다
    op: Math.min(Math.max((1 + PLANE_TRAIL - d) / PLANE_TRAIL, 0), 1),
    d: `M${tx.toFixed(1)} ${ty.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${hx.toFixed(1)} ${hy.toFixed(1)}`,
    px: hx,
    py: hy,
    // 호를 그리므로 향한 각도가 지나가는 동안 조금씩 바뀐다
    rot: (Math.atan2(dirY, dirX) * 180) / Math.PI,
    tx,
    ty,
    hx,
    hy,
  }
}

/*
 * 꽃잎비.
 *
 * ── 바람은 하나다 ──────────────────────────────
 * 처음엔 꽃잎마다 제 사인파를 하나씩 줬다. 그랬더니 판 전체가 한
 * 박자로 좌우로 왔다 갔다 했다 — 저마다 다르게 움직이라고 준 값인데
 * 결과는 정확히 반대였다. 다 같은 꼴의 운동을 하고 있어서다.
 *
 * 실제로는 반대다. 바람은 하나고, 꽃잎은 저마다 제 자리에서 그 바람을
 * 받는다. 그래서 가까이 있는 것끼리는 함께 쏠리고 멀리 있는 것은 따로
 * 논다. 그 '함께 쏠림' 이 바람으로 읽히는 것이지, 제각각 흔들리는 건
 * 바람이 아니라 그냥 소란이다.
 *
 * 그래서 자리와 시각의 함수인 바람 하나를 두고, 꽃잎은 그 자리의 값을
 * 받아 간다. 공간 주기를 오백 남짓으로 잡았으므로 이백 쯤 떨어진
 * 꽃잎끼리는 반대로 쏠린다.
 *
 * ── 흘러가는 게 아니라 밀린다 ──────────────────
 * 바람 값을 자리에 바로 더하면 바람이 멎을 때 꽃잎도 즉시 멎는다.
 * 꽃잎에는 무게가 있어서 밀리고 나서도 한동안 간다. 그래서 바람을
 * 속도에 실어 주고 속도가 바람을 뒤따라가게 둔다(항력).
 * 이 한 단계가 '떠다닌다' 와 '끌려간다' 를 가른다.
 *
 * ── 꽃잎은 가지에서 나온다 ─────────────────────
 * 판 위쪽에 고르게 뿌렸더니 하늘 전체에서 비가 내렸다. 꽃잎이 나오는
 * 데는 꽃이 달린 자리뿐이다. 그래서 좌우 가지의 송이에서만 떨어뜨리고,
 * 퍼지는 건 바람에 맡긴다 — 뿌린 대로가 아니라 불린 대로 퍼진다.
 *
 * ── 가끔 ───────────────────────────────────────
 * 돌풍을 두 사인의 합으로 만들되 주기를 서로 나누어떨어지지 않게 둔다.
 * 문턱을 넘을 때만 몰아치므로, 같은 간격으로 반복되지 않는다.
 */
const PETAL_PATH = 'M0 3.6C-3 1.9-3.6-1.8-1.3-3.5L0-2.4 1.3-3.5C3.6-1.8 3 1.9 0 3.6Z'

// 꽃이 달린 자리. 꽃잎은 여기서만 진다
const PETAL_SOURCES = [
  [786, 10],
  [726, 20],
  [672, 30],
  [620, 36],
  [566, 42],
  [508, 52],
  [456, 64],
  [416, 74],
  [700, 52],
  [600, 58],
  [496, 74],
  [384, 92],
  [10, 20],
  [66, 30],
  [116, 44],
  [156, 60],
  [128, 78],
]

/*
 * 봄바람.
 *
 * 공간에서 세 겹, 시간에서 세 박자. 서로 나누어떨어지지 않아
 * 같은 무늬가 되풀이되지 않는다.
 */
const windAt = (x, y, t) => [
  0.92 * Math.sin(x * 0.0135 + t * 0.55) +
    0.58 * Math.sin(y * 0.021 - t * 0.83 + 1.7) +
    0.44 * Math.sin((x + y * 1.7) * 0.008 + t * 0.31 + 4.1),
  0.48 * Math.sin(y * 0.017 + t * 0.62 + 2.3) + 0.32 * Math.cos(x * 0.011 - t * 0.44),
]

/*
 * 돌풍.
 *
 * 문턱을 높게 잡는다. 낮게 뒀더니 열에 넷은 몰아치는 중이어서
 * 잦아드는 때가 없었다 — 잦아드는 때가 있어야 몰아치는 때가 산다.
 * 두 주기(약 60초 · 101초)가 나누어떨어지지 않아 같은 간격으로
 * 되풀이되지 않는다. 주기를 두 배로 길게 뒀더니 한 번 보려면 이 분을
 * 기다려야 해서, 마당을 잠깐 열어 본 사람은 평생 못 보는 비가 됐다.
 */
const gustAt = (t) => {
  const v = 0.6 * Math.sin(t * 0.105) + 0.55 * Math.sin(t * 0.062 + 1.9)
  return Math.min(Math.max((v - 0.54) / 0.5, 0), 1)
}

/*
 * 한 번에 스물두 장까지.
 *
 * 마흔을 띄웠더니 꽃잎비가 아니라 눈보라였고, 스물여섯도 많았다.
 * 열여섯은 성글어서 비로 읽히지 않았다. 그 사이가 스물둘이다.
 *
 * 몽환은 빽빽함에서 오지 않는다 — 성글어야 한 장 한 장이 보이고,
 * 보여야 떠다니는 것으로 읽힌다. 빽빽하면 개별 꽃잎은 사라지고
 * 흰 알갱이 무리만 남는다.
 */
const PETAL_MAX = 22
const petalState = ref([])
let petalPool = []
let petalTint = []
let petalSeq = 0
let petalDebt = 0

const hexRgb = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]

const spawnPetal = (rr) => {
  const [sx, sy] = PETAL_SOURCES[Math.floor(rr() * PETAL_SOURCES.length) % PETAL_SOURCES.length]
  const z = rr()
  return {
    id: `p${petalSeq++}`,
    x: sx + (rr() - 0.5) * 26,
    y: sy + (rr() - 0.5) * 16,
    vx: (rr() - 0.5) * 6,
    vy: 4 + rr() * 6,
    z,
    // 먼 꽃잎은 천천히 내려앉고 가까운 것은 빨리 지나간다
    term: 16 + (1 - z) * 22,
    drag: 1.4 + rr() * 1.8,
    sc: 0.66 + 0.92 * (1 - z),
    spin: rr() * 360,
    spinRate: (rr() - 0.5) * 70,
    tumble: rr() * 6.283,
    tumbleRate: 1.2 + rr() * 2.6,
    c: petalTint[Math.floor(rr() * petalTint.length) % petalTint.length],
    age: 0,
  }
}

/*
 * 후광.
 *
 * 꽃잎이 정면으로 돌아서는 찰나에 햇빛을 되쏜다. 그 순간만 흰빛이
 * 번지는데, 이 번짐 하나가 판을 또렷한 그림에서 몽환으로 옮긴다.
 * 볕이 있는 쪽(오른쪽 위)에 가까울수록 세게 받는다.
 */
const SUN_AT = [592, 54]
const petalHalo = (x, y, glint) => {
  const d = Math.hypot(x - SUN_AT[0], y - SUN_AT[1])
  /*
   * 세게 뒀더니 꽃잎이 지나갈 때마다 판이 번쩍였다.
   * 후광은 '있는 줄 모르게 있어야' 몽환이고, 눈에 띄면 반딧불이다.
   */
  return glint * (0.42 + 0.58 * Math.max(0, 1 - d / 520)) * 0.6
}

const stepPetals = (t, dt) => {
  if (!petalTint.length) return []
  const rr = petalRng
  const gust = gustAt(t)

  // 몰아칠 때 많이, 잠잠할 때 이따금 한 장
  /*
   * 잠잠할 때는 여덟 초에 한 장쯤. 몰아칠 때만 우수수.
   * 바닥값을 높여 뒀더니 쉬는 사이가 사라져서 늘 내리는 비가 됐다.
   */
  petalDebt += dt * (0.16 + gust * 6.5)
  while (petalDebt >= 1 && petalPool.length < PETAL_MAX) {
    petalDebt -= 1
    petalPool.push(spawnPetal(rr))
  }
  if (petalDebt > 4) petalDebt = 4

  const out = []
  const next = []
  for (const p of petalPool) {
    p.age += dt
    const [wx, wy] = windAt(p.x, p.y, t)
    /*
     * 먼 꽃잎은 바람을 덜 받는 것처럼 보인다. 실제로 덜 받아서가 아니라
     * 같은 거리를 움직여도 화면에서는 적게 움직여서다.
     */
    const reach = 1 - 0.42 * p.z
    const airX = wx * (14 + 34 * gust) * reach - gust * 26 * reach
    const airY = wy * (6 + 11 * gust)
    p.vx += (airX - p.vx) * Math.min(dt * p.drag, 1)
    p.vy += (airY + p.term - p.vy) * Math.min(dt * p.drag, 1)
    p.x += p.vx * dt
    p.y += p.vy * dt

    // 바람이 셀수록 빨리 뒤집힌다. 뒤집힘이 곧 바람의 세기다
    const stir = Math.abs(wx) * 1.5 + gust * 1.2
    p.tumble += (p.tumbleRate + stir) * dt
    p.spin += (p.spinRate + (wx * 26 - 0) * (1 - p.z)) * dt

    if (p.y > 278 || p.x < -90 || p.x > 890) continue
    next.push(p)

    const kx = Math.cos(p.tumble)
    const face = Math.abs(kx)
    const glint = Math.pow(Math.max(kx, 0), 9)
    const [cr, cg, cb] = p.c
    // 정면으로 돌아설 때 희어지는 정도. 끝까지 하얘지면 번쩍임이 튄다
    const lift = glint * 0.58
    const fadeIn = Math.min(p.age / 0.7, 1)
    const fadeOut = Math.min(Math.max((278 - p.y) / 34, 0), 1)
    out.push({
      id: p.id,
      x: p.x,
      y: p.y,
      rot: p.spin,
      kx,
      sc: p.sc,
      c: `rgb(${Math.round(cr + (255 - cr) * lift)} ${Math.round(cg + (255 - cg) * lift)} ${Math.round(cb + (255 - cb) * lift)})`,
      o: fadeIn * fadeOut * (0.95 - 0.3 * p.z) * (0.4 + 0.6 * face),
      h: petalHalo(p.x, p.y, glint) * fadeIn * fadeOut * (1 - 0.4 * p.z),
      hr: (5 + 7 * glint) * p.sc,
    })
  }
  petalPool = next
  return out
}

const petalRng = rng(7331)

const RAD = Math.PI / 180
const bfState = ref(
  BF_DEFS.map((d) => ({ id: d.id, x: 0, y: 0, sc: 0, op: 0, rot: 0, kFar: 1, kNear: -1 })),
)
const bfHeading = BF_DEFS.map(() => 0)
const bfPhase = BF_DEFS.map(() => 0)

/*
 * 한 프레임.
 *
 * 자리에서 속도를 얻고, 속도에서 세 가지를 얻는다 —
 * 어느 쪽을 향하는지(돌림), 얼마나 나는 중인지(날갯짓의 세기),
 * 그리고 우리가 어느 각도에서 보고 있는지(φ).
 *
 * φ 는 판을 가로지를수록 커진다. 옆으로 지나갈 때는 옆에서 보게 되고,
 * 멀어지거나 오르내릴 때는 위에서 보게 된다 — 실제로 그렇다.
 */
const stepButterfly = (def, idx, time, frame) => {
  const t = (time + def.offset) % def.loop
  const [x, y] = trackAt(def.keys, t)
  const dt = 0.05
  const [x2, y2] = trackAt(def.keys, Math.min(t + dt, def.loop))
  const vx = (x2 - x) / dt
  const vy = (y2 - y) / dt
  const z = depthAt(y)
  const vz = ((depthAt(y2) - z) / dt) * 320

  const speed = Math.hypot(vx, vy)
  // 나는 정도. 멈추면 0 이 되어 날갯짓이 저절로 잦아든다
  const w = Math.min(speed / 26, 1)

  if (speed > 1.5) bfHeading[idx] = Math.atan2(vy, vx)

  const across = Math.abs(vx)
  const other = Math.hypot(vy, vz)
  /*
   * 완전히 옆으로 두지 않는다.
   *
   * 계산대로면 판을 가로지를 때 φ 가 80도까지 올라가 나비가 실 한 오라기가
   * 된다. 옳긴 한데, 실제로 옆으로 나는 나비를 정확히 옆에서 보는 일은
   * 없다 — 나비는 늘 조금 기울어 있고 우리 눈높이도 조금 위에 있다.
   * 그래서 폭의 바닥을 4할로 둔다.
   */
  let span = 0.42 + 0.58 * (other / (across + other + 1e-3))
  span = 0.86 + w * (span - 0.86)
  const phi = Math.acos(Math.min(Math.max(span, 0), 1))

  /*
   * 날갯짓.
   *
   * 세기(drive)가 빠르기와 폭을 함께 정한다. 위상은 누적한다 —
   * 빠르기가 매 프레임 달라지므로 시각을 나눠서는 이어지지 않고,
   * 나눠 쓰면 빠르기가 바뀔 때마다 날개가 튄다.
   */
  /*
   * 세기를 한 번 더 눌러 둔다(제곱).
   * 그냥 쓰면 절반쯤은 세게 치고 있는 셈인데, 나비는 대부분의 시간을
   * 활공으로 보내고 가끔 몇 번 친다. 눌러 두면 치는 때가 드물어진다.
   */
  const drive = Math.pow(beatDrive(time, def.seed), 1.5)
  bfPhase[idx] = (bfPhase[idx] + (frame * (0.34 + 1.0 * drive)) / def.beat) % 1
  const swing = 0.16 + 0.84 * drive
  const flap = GLIDE + swing * (beatAngle(bfPhase[idx]) - GLIDE)
  const rest = perchAngle(t, def)
  const th = (rest + w * (flap - rest)) * RAD

  /*
   * 오르내림.
   *
   * 나비는 내리칠 때 떠오르고 사이에 가라앉는다. 그래서 앞으로 곧게
   * 가지 않고 물결을 그리며 간다 — 나비를 나비로 보이게 하는 데
   * 날개의 생김만큼이나 이 오르내림이 크다.
   *
   * 날갯짓 위상에서 바로 가져오므로 날개와 몸이 어긋나지 않는다.
   */
  const bob = Math.cos(bfPhase[idx] * 2 * Math.PI) * 2.6 * swing * w

  return {
    id: def.id,
    x,
    y: y + bob,
    /*
     * 멀어져도 너무 작아지지는 않게.
     *
     * 원근을 곧이곧대로 넣었더니 멀리 간 나비가 판에서 사라졌다.
     * 800 폭 화폭에서 나비는 원래 작아서, 여기서 절반으로 더 줄면
     * 있는지 없는지 알 수 없는 점이 된다.
     * 깊이는 남기되 기울기를 눕힌다.
     */
    sc: def.sc / (1 + 0.85 * z),
    op: 1 - 0.24 * z,
    rot: bfHeading[idx] / RAD + 90,
    kFar: Math.cos(th - phi),
    kNear: -Math.cos(th + phi),
  }
}

let bfRaf = 0
let bfStart = 0
let bfLast = 0
const bfRun = (now) => {
  if (!bfStart) {
    bfStart = now
    bfLast = now
  }
  const time = (now - bfStart) / 1000
  const frame = Math.min(Math.max((now - bfLast) / 1000, 0), 0.06)
  bfLast = now
  if (props.stage.butterflies)
    bfState.value = BF_DEFS.map((d, i) => stepButterfly(d, i, time, frame))
  if (props.stage.plane) planeState.value = stepPlane(time)
  if (props.stage.petalRain) petalState.value = stepPetals(time, frame)
  bfRaf = requestAnimationFrame(bfRun)
}
const bfStop = () => {
  if (bfRaf) cancelAnimationFrame(bfRaf)
  bfRaf = 0
}
/*
 * 접혀 있을 때는 재우고, 펼치면 깨운다.
 * 접힌 띠에서는 나비가 보이지 않는데 계속 계산하고 있을 이유가 없다.
 */
const bfSync = () => {
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (props.stage.petalRain) petalTint = props.stage.petalRain.map(hexRgb)
  const wants = props.stage.butterflies || props.stage.plane || props.stage.petalRain
  if (props.open && wants && !still) {
    if (!bfRaf) bfRaf = requestAnimationFrame(bfRun)
  } else {
    bfStop()
    if (still) {
      bfState.value = BF_DEFS.map((d, i) => stepButterfly(d, i, 1.2, 0))
      planeState.value = stepPlane(26)
      if (props.stage.petalRain) petalState.value = stepPetals(3, 0.016)
    }
  }
}
watch(() => [props.open, props.stage.butterflies, props.stage.plane, props.stage.petalRain], bfSync)
onMounted(bfSync)
onUnmounted(bfStop)

const ridges = computed(() => {
  const s = props.stage
  const n = s.mountains ?? 0
  const base = seedOf(s.id)
  return Array.from({ length: n }, (_, i) => ({
    i,
    d: ridge(150 + i * 12, 46 - i * 12, base + i * 977),
    o: 0.3 + i * 0.2,
  }))
})
</script>

<template>
  <!--
    화폭을 판에 앉히는 방식.

    늘 slice 다 — 어느 쪽이 넘치든 판을 꽉 채우고 넘친 쪽을 잘라낸다.
    어느 쪽을 남길지(xMidYMax·xMaxYMid)만 마당이 재서 정해 준다.

    한동안 펼친 상태에서는 meet 를 썼다. 전체가 다 들어오니 모티프가
    통째로 드러나서 넓은 화면에서는 그게 맞았다 — 860px 판에서는 그림
    비율과 판 비율이 거의 같아 남는 자리가 2px 뿐이었다.

    좁은 화면에서 무너졌다. 358px 판을 200px 로 펼치면 그림은 116px 밖에
    안 그려진다. 위아래로 84px, 판의 4할이 빈칸이 된다. 펼쳤는데 그림은
    그대로고 여백만 늘어난 꼴이라, 넓게 보려고 누른 사람에게는
    아무 일도 일어나지 않은 것으로 보인다.

    게다가 사람들은 판 바닥에서 재는데 그림 바닥은 42px 위에 있어서,
    열두 명이 그림 아래 빈칸에 서 있었다.

    그래서 채우기로 했다. 좁은 화면에서는 좌우가 잘리지만, 잘리는 대신
    그림이 커진다 — 작은 화면에서는 그쪽이 낫다.
  -->
  <svg
    class="scene"
    viewBox="0 0 800 260"
    :preserveAspectRatio="fit"
    :class="[stage.lang, { open }]"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`sky-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="stage.sky" />
        <stop offset="58%" :stop-color="stage.mid" />
        <!--
          하늘 맨 아래만 살짝 안개를 섞는다.
          처음에는 안개 색을 그대로 끝에 뒀더니 하늘 절반이 뿌옇게 죽었다.
          안개는 지평선 띠에서 하는 일이지 하늘 전체가 할 일이 아니다.
        -->
        <stop offset="100%" :stop-color="stage.haze" stop-opacity="0.55" />
      </linearGradient>
      <radialGradient :id="`glow-${uid}`" cx="0.72" cy="0.24" r="0.55">
        <stop offset="0%" :stop-color="stage.bloom" stop-opacity="0.5" />
        <stop offset="100%" :stop-color="stage.bloom" stop-opacity="0" />
      </radialGradient>
      <linearGradient :id="`mist-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="stage.haze" stop-opacity="0" />
        <stop offset="45%" :stop-color="stage.haze" stop-opacity="0.62" />
        <stop offset="100%" :stop-color="stage.haze" stop-opacity="0" />
      </linearGradient>
      <radialGradient :id="`vig-${uid}`" cx="0.5" cy="0.45" r="0.78">
        <stop offset="55%" stop-color="#000" stop-opacity="0" />
        <stop offset="100%" stop-color="#000" stop-opacity="0.42" />
      </radialGradient>
      <filter :id="`soft-${uid}`" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <filter :id="`grain-${uid}`" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <!--
        비행운의 두 결.
        두 끝을 매 프레임 꼬리와 머리에 맞추므로 좌표가 함께 움직인다.
      -->
      <linearGradient
        :id="`trail-${uid}`"
        gradientUnits="userSpaceOnUse"
        :x1="planeState.tx"
        :y1="planeState.ty"
        :x2="planeState.hx"
        :y2="planeState.hy"
      >
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
        <stop offset="46%" stop-color="#ffffff" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
      </linearGradient>
      <linearGradient
        :id="`trailw-${uid}`"
        gradientUnits="userSpaceOnUse"
        :x1="planeState.tx"
        :y1="planeState.ty"
        :x2="planeState.hx"
        :y2="planeState.hy"
      >
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
        <stop offset="54%" stop-color="#ffffff" stop-opacity="0.42" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>
      <!--
        꽃잎의 후광.
        가운데가 밝고 가장자리로 번져 사라진다.
      -->
      <radialGradient :id="`petalglow-${uid}`">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
        <stop offset="42%" stop-color="#ffffff" stop-opacity="0.34" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </radialGradient>

      <!-- 봄 아지랑이. 지평선 언저리에만 걸리고 위아래로 사라진다 -->
      <linearGradient :id="`veil-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
        <stop offset="52%" stop-color="#ffffff" stop-opacity="0.24" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>
      <clipPath :id="`box-${uid}`"><rect x="0" y="0" width="800" height="260" /></clipPath>
    </defs>

    <g :clip-path="`url(#box-${uid})`">
      <!-- ① 하늘 -->
      <rect x="0" y="0" width="800" height="260" :fill="`url(#sky-${uid})`" />

      <!-- ② 빛무리 -->
      <rect x="0" y="0" width="800" height="260" :fill="`url(#glow-${uid})`" />

      <!--
        ②' 봄볕.

        빛무리만으로는 '밝은 하늘' 이지 '볕' 이 아니다. 흐린 원 하나를
        늘어진 가지 뒤에 두면 꽃 사이로 빛이 새어 드는 것이 되고,
        그제야 판이 따뜻해진다. 윤곽을 살리면 해가 되어 버려서
        흐린 채로 둔다 — 이건 해가 아니라 볕이다.
      -->
      <circle
        v-if="stage.sun"
        cx="592"
        cy="54"
        r="42"
        :fill="stage.bloom"
        opacity="0.6"
        :filter="`url(#soft-${uid})`"
      />

      <!--
        ②'' 비행기와 비행운.

        구름보다 뒤에 둔다. 높이 나는 비행기는 구름 위에 있지만,
        여기서 구름은 낮게 뜬 뭉게구름이라 비행기가 그 뒤로 지나가는 게 맞다.
      -->
      <g v-if="stage.plane && planeState.on" class="contrail" :opacity="planeState.op">
        <path
          :d="planeState.d"
          :stroke="`url(#trailw-${uid})`"
          stroke-width="7"
          fill="none"
          stroke-linecap="round"
        />
        <path
          :d="planeState.d"
          :stroke="`url(#trail-${uid})`"
          stroke-width="2.2"
          fill="none"
          stroke-linecap="round"
        />
        <!--
          비행기.

          이 높이에서는 점 하나다. 그래도 날개와 꼬리를 뒀다 —
          점만 있으면 비행운 끝에 먼지가 붙은 것으로 보인다.
        -->
        <g
          v-if="planeState.fly"
          :transform="`translate(${planeState.px} ${planeState.py}) rotate(${planeState.rot})`"
          :fill="stage.accent"
          opacity="0.6"
        >
          <path d="M-5.4 0 2.4-.85 6.2 0 2.4 .85Z" />
          <path d="M.6 0-3.4-4.6-1.1-4.8 2.3-.5Z" />
          <path d="M.6 0-3.4 4.6-1.1 4.8 2.3 .5Z" />
          <path d="M-4.6 0-6.6-2.4-5.5-2.5-3.6-.3Z" />
          <path d="M-4.6 0-6.6 2.4-5.5 2.5-3.6 .3Z" />
        </g>
      </g>

      <!-- ③ 빛줄기. 구름 사이로 내리는 빛 -->
      <g v-if="stage.rays" class="rays" :fill="stage.bloom">
        <path
          v-for="k in 5"
          :key="k"
          :d="`M${520 + k * 26} 8 L${430 + k * 34} 260 L${470 + k * 34} 260Z`"
        />
      </g>

      <!-- ④ 먼 산. 뒤로 갈수록 옅다 -->
      <path
        v-for="m in ridges"
        :key="`m${m.i}`"
        class="ridge"
        :d="m.d"
        :fill="stage.veg2"
        :opacity="m.o"
      />

      <!-- ⑤ 구름 -->
      <g v-if="!stage.under" class="clouds" :fill="stage.bloom">
        <g
          v-for="c in scene.clouds"
          :key="`c${c.i}`"
          class="cloud"
          :style="{ '--x': `${c.x}px`, '--dur': `${c.dur}s` }"
          :opacity="c.o"
        >
          <ellipse :cx="0" :cy="c.y" :rx="c.w * 0.5" :ry="c.h" />
          <ellipse :cx="-c.w * 0.28" :cy="c.y + c.h * 0.28" :rx="c.w * 0.3" :ry="c.h * 0.7" />
          <ellipse :cx="c.w * 0.3" :cy="c.y + c.h * 0.22" :rx="c.w * 0.26" :ry="c.h * 0.62" />
        </g>
      </g>

      <!-- ⑥ 새 떼 -->
      <g v-if="!stage.under && scene.birds.length" class="flock" :stroke="stage.veg">
        <path
          v-for="bd in scene.birds"
          :key="`b${bd.i}`"
          :d="`M${bd.x} ${bd.y} q4 -4 8 0 q4 -4 8 0`"
          :transform="`scale(${bd.s})`"
        />
      </g>

      <!--
        ⑤' 수면. 물속에서만 보인다.

        위에서 들어온 빛이 물결에 흔들려 아래로 어른거린다.
        이 한 겹이 있고 없고가 '파란 배경' 과 '물속' 을 가른다 —
        물은 투명해서 그 자체로는 안 보이고, 빛이 지나갈 때만 보인다.
      -->
      <g v-if="stage.under" class="surface" :stroke="stage.bloom">
        <path
          v-for="k in 6"
          :key="`w${k}`"
          :d="`M-60 ${7 + k * 10} q64 ${k % 2 ? 8 : -8} 128 0 q64 ${k % 2 ? -8 : 8} 128 0 q64 ${k % 2 ? 8 : -8} 128 0 q64 ${k % 2 ? -8 : 8} 128 0 q64 ${k % 2 ? 8 : -8} 128 0 q64 ${k % 2 ? -8 : 8} 128 0 q64 ${k % 2 ? 8 : -8} 128 0`"
          :style="{
            '--dur': `${6 + (k % 4) * 2.2}s`,
            '--delay': `${k * -1.1}s`,
            '--o': 0.34 - k * 0.045,
          }"
        />
      </g>

      <!--
        암초. 능선 대신 둥근 덩어리를 세 겹 세운다.
        능선은 하늘과 맞닿은 선이라 위가 뾰족한데,
        물이 깎은 바위는 위가 둥글고 옆으로 퍼진다.
      -->
      <g v-if="stage.under" class="reef">
        <g v-for="b in scene.reef" :key="`rf${b.band}`" :opacity="b.o" :fill="stage.veg">
          <path
            v-for="(k, i) in b.rocks"
            :key="`rk${i}`"
            :d="`M${k.x} 260 L${k.x} ${b.base} q${k.w * 0.16} ${-k.h} ${k.w * 0.5} ${-k.h * 0.94} q${k.w * 0.34} ${-0.06 * k.h} ${k.w * 0.5} ${k.h * 0.94} L${k.x + k.w} 260Z`"
          />
        </g>
      </g>

      <!-- ⑥' 먼 물고기 떼. 모티프보다 뒤라 작고 흐리다 -->
      <g v-if="stage.under" class="school far" :fill="stage.veg2">
        <g
          v-for="f in scene.fish.filter((x) => x.band === 0)"
          :key="`ff${f.i}`"
          class="fish"
          :style="{
            '--dur': `${f.dur}s`,
            '--delay': `${f.delay}s`,
            '--dir': f.back ? -1 : 1,
          }"
        >
          <g :transform="`translate(${f.x} ${f.y}) scale(${f.sc * 0.7})`">
            <path d="M0 0 q7 -4.4 14 0 q-7 4.4 -14 0Z" />
            <path d="M14 0 l5 -3.4 v6.8Z" />
          </g>
        </g>
      </g>

      <g v-else-if="stage.motif === 'moon'">
        <path d="M628 62a38 38 0 1 0 30 60a30 30 0 1 1-30-60z" />
        <path d="M556 128l4-11 4 11 11 4-11 4-4 11-4-11-11-4z" />
      </g>
      <g v-else-if="stage.motif === 'bareTree'">
        <path d="M600 202V74" />
        <path d="M600 116l-32-28M600 140l34-30M600 94l-24-24M600 160l-28-22M600 106l28-26" />
      </g>
      <g v-else-if="stage.motif === 'lamp'">
        <path d="M616 204V76" />
        <path d="M616 76h-36" />
        <path d="M566 76a13 10 0 0 0 26 0z" />
        <path d="M579 96l-9 18M579 96l9 18M579 96v22" class="dim" />
      </g>
      <g v-else-if="stage.motif === 'voyagerInk'">
        <g :stroke="stage.ink" stroke-width="2.4">
          <path d="M600 118v34M566 96L486 40M636 100l84-52M600 84V40" />
          <path d="M584 118h32l4 14h-40z" />
        </g>
        <ellipse cx="600" cy="88" rx="40" ry="34" :stroke="stage.accent" stroke-width="2.6" />
        <ellipse cx="600" cy="88" rx="19" ry="16" :stroke="stage.accent" stroke-width="1.6" />
      </g>
      <g v-else-if="stage.motif === 'vine'" class="gloss">
        <path d="M470 176c40-6 60-28 66-58c4-22 20-34 40-30" />
        <path d="M536 118a13 13 0 1 0 0-26a13 13 0 0 0 0 26z" />
        <path d="M576 88a11 11 0 1 0 0-22a11 11 0 0 0 0 22z" />
        <path d="M614 108c30-4 46-22 48-46" />
        <path d="M662 62a12 12 0 1 0 0-24a12 12 0 0 0 0 24z" />
        <path d="M500 156c-14-10-16-26-6-38" />
      </g>
      <g v-else-if="stage.motif === 'singularity'">
        <g class="groove">
          <circle v-for="r0 in [30, 48, 66, 84, 102]" :key="r0" cx="600" cy="106" :r="r0" />
        </g>
        <path d="M600 106L742 44" stroke-width="1.2" />
        <circle cx="600" cy="106" r="4.5" :fill="stage.accent" stroke="none" />
      </g>
      <g v-else-if="stage.motif === 'stars'">
        <path d="M576 56c4 22 10 28 32 32c-22 4-28 10-32 32c-4-22-10-28-32-32c22-4 28-10 32-32z" />
        <path
          d="M648 108c2.6 14 6.4 18 20 20c-13.6 2-17.4 6-20 20c-2.6-14-6.4-18-20-20c13.6-2 17.4-6 20-20z"
        />
        <circle cx="690" cy="62" r="9" />
        <ellipse
          cx="690"
          cy="62"
          rx="17"
          ry="5"
          fill="none"
          :stroke="stage.accent"
          stroke-width="1.8"
        />
      </g>
      <g v-else-if="stage.motif === 'glasses'">
        <g v-for="(x, i) in [536, 600, 664]" :key="i">
          <path :d="`M${x - 22} 62h44l-22 26z`" />
          <path :d="`M${x} 88v30`" />
          <path :d="`M${x - 13} 120h26`" />
        </g>
        <circle cx="600" cy="164" r="11" :fill="stage.seal" :stroke="stage.seal" />
      </g>
      <!--
          심해의 주인공. 커다란 해파리 하나.

          갓은 반원 아래에 물결을 물려 닫는다. 그냥 반원이면 버섯이다.
          촉수는 길이를 다 다르게 둔다 — 같으면 빗자루로 보인다.
        -->
      <g v-else-if="stage.motif === 'jelly'" class="bigjelly">
        <path
          class="bell"
          d="M512 128 A72 62 0 0 1 656 128 q-18 14 -36 0 q-18 14 -36 0 q-18 14 -36 0 q-18 14 -36 0Z"
        />
        <g
          class="arms"
          fill="none"
          :stroke="stage.motifColor"
          stroke-width="3"
          stroke-linecap="round"
        >
          <path d="M534 132 q-14 52 4 96" />
          <path d="M556 136 q10 60 -8 106" />
          <path d="M584 138 q-6 66 6 112" />
          <path d="M612 136 q-10 58 8 100" />
          <path d="M634 132 q14 50 -4 92" />
        </g>
        <g class="veil" fill="none" :stroke="stage.bloom" stroke-width="1.6" opacity="0.6">
          <path d="M528 122 A60 50 0 0 1 640 122" />
          <path d="M546 116 A44 36 0 0 1 622 116" />
        </g>
      </g>
      <g v-else-if="stage.motif === 'whale'">
        <path
          d="M512 112c40-32 110-30 142 2c16 16 8 36-14 40c-46 8-104 0-134-18c-10-6-8-18 6-24z"
        />
        <path d="M672 116l30-22-8 32z" />
        <path d="M556 88c8-16 18-26 28-28" fill="none" :stroke="stage.accent" stroke-width="2" />
        <circle cx="538" cy="122" r="3" fill="#f4efe5" stroke="none" />
      </g>
      <g v-else-if="stage.motif === 'piano'">
        <path d="M556 130c0-30 26-52 58-52c30 0 50 18 50 40c0 10-8 16-18 16h-90z" />
        <path d="M556 130h90v10h-90z" />
        <path d="M566 140v14M582 140v14M598 140v14M614 140v14M630 140v14" stroke-width="1.2" />
        <path d="M470 96h74M676 96h74M470 112h74M676 112h74" stroke-width="0.9" class="dim" />
      </g>
      <g v-else-if="stage.motif === 'deadBranch'">
        <path d="M598 200c0-46 6-80 18-106" />
        <path d="M608 152c-22-6-34-20-38-38M612 126c20-8 30-22 32-42M618 100c-16-10-22-24-20-40" />
        <path d="M574 112a7 5 0 1 0 0-10a7 5 0 0 0 0 10z" />
        <path d="M646 82a6 4 0 1 0 0-8a6 4 0 0 0 0 8z" />
        <path d="M600 58a6 5 0 1 0 0-10a6 5 0 0 0 0 10z" />
      </g>
      <g v-else-if="stage.motif === 'voyagerFoil'">
        <ellipse cx="600" cy="96" rx="38" ry="33" />
        <ellipse cx="600" cy="96" rx="18" ry="16" />
        <path d="M600 129v28M562 76L508 38M638 76l56-40M600 63V30M570 122l-40 32M630 122l42 30" />
        <circle cx="600" cy="96" r="4.5" :fill="stage.accent" stroke="none" />
      </g>
      <g v-else-if="stage.motif === 'runner'">
        <circle cx="628" cy="56" r="11" />
        <path d="M622 70l-14 34 16 12-6 34" stroke-width="9" stroke-linecap="round" fill="none" />
        <path
          d="M608 104l-26 6M624 116l26 14"
          stroke-width="8"
          stroke-linecap="round"
          fill="none"
        />
        <path
          d="M618 150l-24 22M618 150l16 26"
          stroke-width="9"
          stroke-linecap="round"
          fill="none"
        />
        <path d="M580 186c8-10 20-10 24 0c-10 8-18 6-24 0z" :fill="stage.accent" stroke="none" />
      </g>
      <g v-else-if="stage.motif === 'gorilla'">
        <path d="M560 128c0-34 22-58 44-58s44 24 44 58c0 26-20 44-44 44s-44-18-44-44z" />
        <path
          d="M580 122c0-16 10-26 24-26s24 10 24 26c0 14-10 24-24 24s-24-10-24-24z"
          fill="#3a2a30"
          stroke="none"
        />
        <path
          d="M566 96h76M566 110h76M566 124h76"
          stroke="#f0d8c4"
          stroke-width="2.4"
          class="collage"
        />
        <circle cx="592" cy="112" r="3" fill="#1c1418" stroke="none" />
        <circle cx="616" cy="112" r="3" fill="#1c1418" stroke="none" />
      </g>
      <g v-else-if="stage.motif === 'wings'">
        <path d="M600 74c-4 26-4 56 0 84" stroke-width="2" />
        <circle cx="600" cy="62" r="9" />
        <path d="M596 88c-30-30-58-34-66-14c-6 18 18 36 62 30z" />
        <path d="M604 88c30-30 58-34 66-14c6 18-18 36-62 30z" />
        <path d="M596 118c-20-10-38-8-42 6c-4 12 14 20 42 6z" />
        <path d="M604 118c20-10 38-8 42 6c4 12-14 20-42 6z" />
      </g>

      <!--
        설날 — 하늘 높이 뜬 방패연.

        가운데 방구멍이 이 연을 방패연으로 만든다. 처음엔 뚫지 않고
        붉은 원만 얹었는데 그건 연이 아니라 과녁이었다 —
        구멍은 무늬가 아니라 바람이 지나가라고 뚫은 자리다.

        얼레줄은 왼쪽 아래로 길게 뺀다. 줄이 없으면 연이 아니라
        하늘에 떠 있는 종이다.
      -->
      <g v-else-if="stage.motif === 'kite'">
        <!-- 기울인 만큼 오른쪽 위로 밀려서 판 끝에 붙었다. 그만큼 되돌린다 -->
        <g transform="translate(-30 10) rotate(-14 600 84)">
          <path d="M558 44h84v78h-84z" :fill="stage.motifColor" />
          <path d="M558 44h84v13h-84z" :fill="stage.accent" />
          <g fill="none" :stroke="stage.accent" stroke-width="1.5" opacity="0.75">
            <path d="M558 44l84 78M642 44l-84 78M600 44v78M558 83h84" />
          </g>
          <circle
            cx="600"
            cy="83"
            r="16"
            :fill="stage.sky"
            :stroke="stage.accent"
            stroke-width="2.4"
          />
          <path d="M558 44h84v78h-84z" fill="none" :stroke="stage.accent" stroke-width="2.4" />
        </g>
        <path
          d="M538 141q-54 30 -122 42"
          fill="none"
          :stroke="stage.veg"
          stroke-width="1.2"
          opacity="0.7"
        />
      </g>

      <!--
        불꽃놀이 — 터지는 불 하나.

        갈래 끝마다 점을 찍는다. 선만 그으면 바퀴살이 되는데
        불꽃은 선이 아니라 흩어지는 불티라 끝이 맺혀 있어야 한다.

        작은 것 둘을 뒤에 더 두되 흐리게 둔다. 같은 밝기로 두었더니
        셋 다 주인공이 되어 어디를 볼지 알 수 없는 판이 됐다.
      -->
      <g v-else-if="stage.motif === 'firework'">
        <g
          v-for="(b, i) in [
            { x: 0, y: 0, s: 1, o: 1 },
            { x: -152, y: -20, s: 0.4, o: 0.5 },
            { x: 118, y: 6, s: 0.3, o: 0.4 },
          ]"
          :key="`fw${i}`"
          :opacity="b.o"
          :transform="`translate(${b.x} ${b.y}) translate(600 88) scale(${b.s}) translate(-600 -88)`"
        >
          <path
            d="M614 88L656 88M612 95L648 116M607 100L628 136M600 102L600 144M593 100L572 136M588 95L552 116M586 88L544 88M588 81L552 60M593 76L572 40M600 74L600 32M607 76L628 40M612 81L648 60"
            fill="none"
            :stroke="stage.motifColor"
            stroke-width="2.4"
            stroke-linecap="round"
          />
          <g :fill="stage.accent">
            <circle
              v-for="(t, k) in [
                [656, 88],
                [648, 116],
                [628, 136],
                [600, 144],
                [572, 136],
                [552, 116],
                [544, 88],
                [552, 60],
                [572, 40],
                [600, 32],
                [628, 40],
                [648, 60],
              ]"
              :key="`fd${k}`"
              :cx="t[0]"
              :cy="t[1]"
              r="3.4"
            />
          </g>
          <circle cx="600" cy="88" r="5" :fill="stage.bloom" />
        </g>
      </g>

      <!--
        추석 — 보름달.

        밤하늘의 달은 초승달이라 둘이 겹치지 않는다.

        달 안에 계수나무와 방아 찧는 토끼를 옅게 넣는다. 흰 원 하나만
        띄웠더니 노을 진 하늘에 뜬 해로 보였다 — 달은 그 자리가
        어른거려야 달이다.
      -->
      <g v-else-if="stage.motif === 'harvestmoon'">
        <circle cx="606" cy="88" r="70" :fill="stage.bloom" opacity="0.22" />
        <circle cx="606" cy="88" r="52" :fill="stage.motifColor" />
        <g :fill="stage.near" opacity="0.3">
          <ellipse cx="586" cy="68" rx="15" ry="11" />
          <rect x="584.6" y="74" width="2.8" height="30" />
          <ellipse cx="622" cy="108" rx="13" ry="8" />
          <circle cx="633" cy="99" r="6" />
          <ellipse cx="634" cy="89" rx="2.2" ry="7" transform="rotate(10 634 89)" />
          <ellipse cx="640" cy="91" rx="2.2" ry="7" transform="rotate(26 640 91)" />
          <rect x="611" y="86" width="2.6" height="18" transform="rotate(-30 611 86)" />
          <ellipse cx="604" cy="114" rx="10" ry="4" />
        </g>
      </g>
    </g>

    <!--
        ⑧' 바다.

        수평선(y 150)에서 물가(y 206)까지 네 겹으로 내려온다.
        먼 물은 짙고 가까운 물은 옅다 — 얕아질수록 바닥이 비쳐서다.
        겹마다 윗선을 다르게 굽혀 두면 한 장의 파란 판이 아니라
        깊이가 다른 물로 읽힌다.
      -->
    <g v-if="stage.beach" class="sea">
      <!-- 먼 물. 수평선 쪽은 하늘빛을 받아 밝다 -->
      <rect x="0" y="150" width="800" height="58" :fill="stage.near" />
      <rect x="0" y="150" width="800" height="9" :fill="stage.mid" opacity="0.5" />
      <!-- 깊은 골. 가운데가 가장 짙다 -->
      <path fill="#0b3a57" opacity="0.2" d="M0 164 q100 -6 200 2 t200 1 t200 -4 t200 4 v22H0z" />
      <!-- 얕아지는 물. 바닥이 비쳐 밝아진다 -->
      <path
        :fill="stage.mid"
        opacity="0.78"
        d="M0 186 q110 7 210 -2 t190 -1 t200 5 t200 -3 v26H0z"
      />
      <path :fill="stage.sky" opacity="0.5" d="M0 198 q120 5 220 -1 t180 0 t200 3 t200 -2 v14H0z" />
    </g>

    <!--
      ④' 먼 화산.

      먼 산 자리(④)에 둔다. 처음에는 구름 다음에 두었는데, 편집을 거치며
      식물보다 뒤로 밀려서 화산이 앞에 있고 나무가 그 뒤에 가렸다.
      먼 것은 먼저 그려야 멀어 보인다.

      공룡 판을 공룡 판으로 만드는 건 화산이다. 산 두 개를 세우고
      꼭대기에서 연기가 천천히 오른다. 터지지는 않는다 —
      터지면 사건이 되고, 사건이 있으면 판이 아니라 장면이 된다.
    -->
    <g v-if="stage.dinoland" class="volcanoes">
      <g v-for="v in scene.volcanoes" :key="`vc${v.i}`">
        <path
          :fill="stage.far"
          :d="`M${v.x - v.w / 2} ${v.base} L${v.x - v.w * 0.16} ${v.base - v.h}
               q${v.w * 0.16} ${-6} ${v.w * 0.32} 0 L${v.x + v.w / 2} ${v.base} Z`"
        />
        <!--
          분화구.

          두 번 고쳤다. 산 위에 시안 호를 그었더니 산에 얹힌 띠였고,
          정상 폭만큼 넓은 그릇을 그렸더니 산 위에 접시를 올려 둔 꼴이었다.

          분화구는 정상에 난 구멍이라 정상보다 훨씬 좁다.
          좁게 파고 그 안이 달아오르게 한다.
        -->
        <ellipse :fill="stage.near" :cx="v.x" :cy="v.base - v.h + 1" :rx="v.w * 0.115" ry="3.4" />
        <ellipse
          class="ember"
          :fill="stage.accent"
          :cx="v.x"
          :cy="v.base - v.h + 0.5"
          :rx="v.w * 0.06"
          ry="1.6"
          :style="{ '--dur': `${v.dur * 0.4}s`, '--delay': `${v.delay}s` }"
        />

        <!--
          연기.

          자리는 바깥 묶음이 잡고 움직임은 안쪽 묶음이 맡는다.
          한 묶음에 둘 다 두었더니 CSS transform 이 SVG transform 속성을
          덮어써서, 연기가 화산 꼭대기가 아니라 화폭 왼쪽 끝에 피어올랐다.
        -->
        <g :transform="`translate(${v.x} ${v.base - v.h - 4})`">
          <g class="fume" :style="{ '--dur': `${v.dur}s`, '--delay': `${v.delay}s` }">
            <circle :fill="stage.haze" cx="0" cy="0" r="7" opacity="0.75" />
            <circle :fill="stage.haze" cx="5" cy="-11" r="9" opacity="0.6" />
            <circle :fill="stage.haze" cx="-3" cy="-24" r="11" opacity="0.44" />
            <circle :fill="stage.haze" cx="6" cy="-38" r="13" opacity="0.3" />
          </g>

          <!--
            분출. 한 바퀴의 대부분은 아무 일도 없다.

            터질 때는 세 가지가 한꺼번에 일어난다 —
            분화구가 밝아지고, 용암이 튀어 오르고, 재가 크게 부푼다.
            셋이 조금씩 어긋난 박자로 와야 터지는 것으로 보인다.
            동시에 나타났다 사라지면 그건 깜빡임이다.
          -->
          <g class="blast" :style="{ '--dur': `${v.blastDur}s`, '--delay': `${v.blastDelay}s` }">
            <g class="ash">
              <circle :fill="stage.haze" cx="0" cy="-6" r="13" opacity="0.7" />
              <circle :fill="stage.haze" cx="11" cy="-20" r="15" opacity="0.55" />
              <circle :fill="stage.haze" cx="-9" cy="-34" r="17" opacity="0.4" />
            </g>
            <g class="lava" :fill="stage.ember">
              <circle
                v-for="(l, k) in v.lava"
                :key="`lv${k}`"
                :r="l.r"
                :style="{ '--dx': `${l.dx}px`, '--dy': `${l.dy}px`, '--ld': l.d }"
              />
            </g>
            <ellipse class="flare" :fill="stage.ember" cx="0" cy="2" :rx="v.w * 0.16" ry="4" />
          </g>
        </g>
      </g>
    </g>

    <!-- ⑧ 원경 언덕 -->
    <path
      v-if="!stage.beach"
      :fill="stage.far"
      d="M0 168c118-26 196-22 296 4s176 20 270-10 158-18 234 12v86H0z"
    />

    <!-- ⑨ 안개 띠. 원경과 중경을 갈라 깊이를 만든다 -->
    <rect
      v-if="!stage.beach"
      x="0"
      y="150"
      width="800"
      height="52"
      :fill="`url(#mist-${uid})`"
      class="mist"
    />

    <!-- ⑩ 나무. 중경에 흩어진다 -->
    <!--
      ⑨' 봄 아지랑이.

      먼 산 밑동에 흰 기운이 한 겹 걸린다. 봄날 낮에 지평선 쪽이
      뿌옇게 뜨는 그것이다. 산과 중경 사이를 갈라 놓아 깊이가 한 단 늘고,
      판에 흰빛이 한 번 더 들어온다.

      나무보다 뒤에 둔다. 앞에 두면 나무까지 뿌예져서 안개 낀 날이 된다.
    -->
    <rect v-if="stage.veil" x="0" y="116" width="800" height="66" :fill="`url(#veil-${uid})`" />

    <g v-if="!stage.under" class="trees">
      <g v-for="t in scene.trees" :key="`t${t.i}`" :transform="`translate(${t.x} ${t.base})`">
        <rect :x="-1.6" :y="-t.h * 0.42" width="3.2" :height="t.h * 0.42" :fill="stage.veg" />
        <ellipse
          cx="0"
          :cy="-t.h * 0.58"
          :rx="t.w * 0.5"
          :ry="t.h * 0.34"
          :fill="t.pale && stage.treePale ? stage.treePale : t.dark ? stage.veg : stage.veg2"
        />
        <ellipse
          cx="-4"
          :cy="-t.h * 0.72"
          :rx="t.w * 0.32"
          :ry="t.h * 0.24"
          :fill="t.pale && stage.treePale ? stage.treePale : stage.veg2"
          opacity="0.7"
        />
      </g>
    </g>

    <!--
      ⑩' 기와 담장.

      나무보다 뒤에 그린다. 앞에 두었더니 나무 밑동이 담벼락 한가운데서
      끝나서, 벚나무 넷이 담 위에 심겨 있었다. 담장 뒤에 두면 밑동이
      담에 가려지고 꽃만 담 위로 넘어온다 — 궁궐 담 옆 벚나무가 그렇다.

      살짝 기울여 둔다. 자로 그은 듯 수평으로 지나가니 판이 위아래로
      잘렸다 — 담 위는 하늘, 담 아래는 길인 두 장이었다.
      실제 궁궐 담도 지형을 따라 오르내린다.

      이 판이 어느 나라 봄인지 정하는 한 겹이다. 벚꽃만 흩어 두면
      그냥 분홍 언덕인데, 담장 한 줄이 지나가면 그 길이 궁궐 담이 된다.

      담장은 사람 키보다 낮게 둔다. 처음에 높이 세웠더니 판을 위아래로
      끊어 놓아서, 담 위는 하늘이고 담 아래는 길인 두 장이 됐다.
      낮게 지나가야 걸어가는 길 옆에 담이 있는 것으로 읽힌다.

      좌우로 판 밖까지 뺀다. 끝이 보이면 담장이 아니라 담장 조각이다.
    -->
    <g v-if="stage.wall" class="wall" transform="rotate(-1.2 400 190)">
      <!--
        밑동은 근경에 묻는다. 담벼락을 근경 위에서 끝냈더니
        벽이 허공에 뜬 채 아래가 잘려 있었다 — 담장은 땅에서 올라온다.
      -->
      <rect x="-20" y="170" width="840" height="46" :fill="stage.wallFace" />
      <!-- 꽃담 전돌 무늬. 잘고 옅게 — 크게 두면 담장이 아니라 벽지가 된다 -->
      <g fill="none" :stroke="stage.wallTile" stroke-width="0.9" opacity="0.16">
        <path v-for="k in 25" :key="`wd${k}`" :d="`M${-20 + (k - 1) * 34} 186l17-8 17 8-17 8z`" />
      </g>
      <!-- 기와 지붕. 처마가 담벼락보다 좌우로 나온다 -->
      <path d="M-26 170l14-9h824l14 9z" :fill="stage.wallTile" />
      <!--
        용마루에 닿는 빛.

        기와는 둥글게 말려 있어서 맨 위 능선만 빛을 받는다. 이 가는 선
        하나가 담장을 '회색 띠' 에서 '기와를 얹은 담' 으로 바꾼다.
      -->
      <path d="M-12 161h824" stroke="#ffffff" stroke-width="0.9" opacity="0.26" fill="none" />

      <!-- 기왓골 -->
      <g :stroke="stage.wallFace" stroke-width="1.1" opacity="0.28">
        <path v-for="k in 41" :key="`wt${k}`" :d="`M${-26 + (k - 1) * 21} 170l6-9`" />
      </g>
      <!-- 처마 그늘. 이 한 줄이 지붕과 담벼락을 갈라 놓는다 -->
      <rect x="-20" y="170" width="840" height="3" fill="#000" opacity="0.12" />
    </g>

    <!-- ⑪ 근경 -->
    <path
      v-if="!stage.beach"
      :fill="stage.near"
      d="M0 196c140-20 214-12 320 10s186 12 316-14 132-10 164 6v62H0z"
    />

    <!--
      ⑪'' 길에 쌓인 꽃잎.

      벚꽃놀이를 벚꽃놀이로 만드는 건 나무보다 이 바닥이다. 나무만
      분홍이고 땅은 맨땅이면 벚나무가 서 있는 들판이지 꽃길이 아니다.

      얕게 눕힌 타원을 흐려서 깐다. 윤곽을 살려 뒀더니 정확히
      그 일이 일어났다 — 길에 분홍 웅덩이 아홉 개가 고여 있었다.
      쌓인 꽃잎에는 가장자리가 없다.
    -->
    <g
      v-if="stage.fallen"
      class="fallen"
      :fill="stage.motifColor"
      opacity="0.5"
      :filter="`url(#soft-${uid})`"
    >
      <ellipse
        v-for="(d, k) in [
          [70, 214, 64, 7],
          [210, 226, 52, 6],
          [360, 208, 72, 8],
          [520, 232, 58, 6],
          [640, 216, 66, 7],
          [770, 228, 48, 6],
          [140, 240, 44, 5],
          [450, 244, 56, 6],
          [700, 246, 40, 5],
        ]"
        :key="`fp${k}`"
        :cx="d[0]"
        :cy="d[1]"
        :rx="d[2]"
        :ry="d[3]"
      />
    </g>

    <!--
        ⑪' 젖은 모래.

        물이 닿았다 간 자리. 마른 모래보다 어둡고 조금 반짝인다.
        이 띠가 없으면 바다와 모래가 자로 그은 듯 갈려서,
        물이 밀려온 적 없는 해변이 된다.
      -->
    <path
      v-if="stage.beach"
      :fill="stage.veg"
      opacity="0.55"
      d="M0 206 q110 7 210 1 t190 -2 t200 5 t200 -3 v54H0z"
    />

    <!-- ⑫ 덤불과 꽃 -->
    <g v-if="!stage.under" class="flowers">
      <g
        v-for="(f, i) in scene.flowers"
        :key="`f${i}`"
        :style="{ '--sway': `${f.sway}s` }"
        class="bloom"
      >
        <path :d="`M${f.x} ${f.y + 8}v-8`" :stroke="stage.veg" stroke-width="1" />
        <circle :cx="f.x" :cy="f.y" :r="f.r" :fill="stage.bloom" />
      </g>
    </g>

    <!--
        ⑪' 가까운 물고기 떼와 해파리.

        해파리는 갓을 오므렸다 펴며 위로 밀려 올라갔다가 다시 가라앉는다.
        박자를 다 다르게 둬야 한 무리가 아니라 각자 떠 있는 것으로 보인다.
      -->
    <g v-if="stage.under" class="school near" :fill="stage.motifColor">
      <g
        v-for="f in scene.fish.filter((x) => x.band > 0)"
        :key="`fn${f.i}`"
        class="fish"
        :style="{
          '--dur': `${f.dur}s`,
          '--delay': `${f.delay}s`,
          '--dir': f.back ? -1 : 1,
        }"
      >
        <g :transform="`translate(${f.x} ${f.y}) scale(${f.sc})`">
          <path d="M0 0 q7 -4.4 14 0 q-7 4.4 -14 0Z" />
          <path d="M14 0 l5 -3.4 v6.8Z" />
        </g>
      </g>
    </g>

    <g v-if="stage.under" class="jellies">
      <g
        v-for="j in scene.jellies"
        :key="`j${j.i}`"
        class="jelly"
        :style="{
          '--dur': `${j.dur}s`,
          '--delay': `${j.delay}s`,
          '--rise': `${j.rise}px`,
        }"
      >
        <g :transform="`translate(${j.x} ${j.y}) scale(${j.sc})`">
          <path
            class="bell"
            :fill="stage.bloom"
            d="M-11 2 A11 10 0 0 1 11 2 q-5.5 3.4 -11 0 q-5.5 3.4 -11 0Z"
          />
          <g class="arms" :stroke="stage.bloom">
            <path d="M-6 3 q-2.5 11 0.6 21" />
            <path d="M-2 4 q1.6 12 -1 22" />
            <path d="M2 4 q-1.6 12 1 22" />
            <path d="M6 3 q2.5 11 -0.6 21" />
          </g>
        </g>
      </g>
    </g>

    <!--
      ⑪''' 돌고래.

      물 밖으로 솟았다 들어간다. 뛰는 순간만 보이고 나머지는 물속이라,
      한 번 뛰는 데 쓰는 시간이 전체의 십 분의 일도 안 된다.
      자주 뛰면 놀랍지 않다.

      ── 모양 ────────────────────────────────────
      돌고래는 매끈한 방추형이다. 주둥이가 뾰족하게 나오고, 이마(멜론)가
      둥글게 솟았다가, 등지느러미를 지나 꼬리자루로 갈수록 가늘어진다.
      이 세 마디가 없으면 돌고래가 아니라 물고기다.

      지느러미는 다 뒤로 젖혀져 있다. 앞으로 뻗은 지느러미를 그리면
      헤엄치는 것이 아니라 서 있는 것으로 보인다.
      꼬리는 가로로 눕고 가운데가 파여 두 갈래다 — 물고기와 갈리는 자리다.

      배는 등보다 밝다. 물속에서 위아래 어디서 봐도 눈에 덜 띄게 하는
      생김새인데, 그림에서는 그 대비가 몸을 둥글어 보이게 한다.
    -->
    <g v-if="stage.beach" class="dolphins">
      <g
        v-for="d in scene.dolphins"
        :key="`dp${d.i}`"
        class="dolphin"
        :style="{ '--dur': `${d.dur}s`, '--delay': `${d.delay}s` }"
      >
        <!-- 물보라. 솟을 때와 들어갈 때만 잠깐 -->
        <g
          class="splash"
          :transform="`translate(${d.x} ${d.y + 6}) scale(${d.sc})`"
          stroke="#ffffff"
          fill="none"
          stroke-linecap="round"
          stroke-width="1.4"
        >
          <path d="M-13 0 q4 -7 7 -9" />
          <path d="M-6 0 q1 -8 2 -11" />
          <path d="M2 0 q2 -7 5 -10" />
          <path d="M9 0 q4 -5 8 -7" />
          <ellipse cx="-1" cy="1" rx="15" ry="2.6" opacity="0.55" />
        </g>

        <g
          class="body"
          :transform="`translate(${d.x} ${d.y}) scale(${d.back ? -d.sc : d.sc} ${d.sc})`"
        >
          <!--
            몸.

            돌고래를 돌고래로 만드는 건 부리다.
            가는 부리가 앞으로 쭉 나오고, 그 뒤에서 이마(멜론)가 둥글게
            솟는다. 둘 사이에 접힌 자국이 있다.
            이 마디 없이 앞을 뾰족하게만 만들면 아무리 다듬어도 참치다.

            그다음이 길이다. 가장 두꺼운 곳의 네 배는 되어야 한다.
            짧고 깊으면 역시 물고기다.

            꼬리는 가로로 눕고 가운데가 파인다. 물고기 꼬리는 세로다.
          -->
          <path
            fill="#3a5c73"
            d="M20.5 0.9 C18.6 0.1 17 -0.2 15.2 -0.4
               C13.4 -1.6 12.4 -2.8 11.4 -3.6
               C7.6 -5 3.4 -5.4 -0.8 -5.1
               C-6 -4.7 -11 -3.4 -15.2 -1.1
               C-14.8 -0.3 -14.8 0.1 -15.2 0.8
               C-11 1.9 -6 2.9 -0.8 3.3
               C4.4 3.6 10 3.2 14.6 2.2
               C16.6 1.8 19 1.4 20.5 0.9 Z"
          />
          <!-- 배와 아래턱. 등보다 밝다. 그 대비가 몸을 둥글어 보이게 한다 -->
          <path
            fill="#dceaf2"
            opacity="0.92"
            d="M19.6 1.2 C15 2.5 9 3.3 3 3.2
               C-2.6 3.1 -8.6 2.4 -14.6 1
               C-9 0.8 -3 0.7 3 0.6 C9 0.5 15 0.7 19.6 1.2 Z"
          />
          <!-- 부리와 이마 사이의 접힌 자국 -->
          <path
            stroke="#24404f"
            stroke-width="0.55"
            fill="none"
            stroke-linecap="round"
            opacity="0.75"
            d="M15.1 -0.5 C14.6 0.2 14.6 0.9 14.9 1.6"
          />
          <!-- 입 -->
          <path
            stroke="#24404f"
            stroke-width="0.55"
            fill="none"
            stroke-linecap="round"
            d="M20.2 1.1 C17.6 1.7 15.8 1.9 14.7 1.9"
          />
          <!-- 등지느러미. 낫처럼 뒤로 휘고 뒷선이 오목하다 -->
          <path
            fill="#2f4f65"
            d="M2.6 -5.3 C1.6 -8.6 -0.8 -11.4 -5.4 -12.4
               C-4.5 -9.5 -3.4 -7 -2.6 -4.9 Z"
          />
          <!-- 가슴지느러미. 뒤아래로 젖혀진다 -->
          <path
            fill="#2a4759"
            d="M6.6 3 C4.8 5.2 2.2 6.5 -0.4 6.9
               C0.6 4.8 2.2 3.3 3.6 2.5 Z"
          />
          <!-- 꼬리. 가로로 눕고 가운데가 파여 두 갈래다 -->
          <path
            fill="#2f4f65"
            d="M-15 -0.5 C-17.8 -2.2 -20.6 -3.2 -23.2 -3.4
               C-21.2 -1.6 -19.8 -0.5 -19.2 0.3
               C-19.8 1.1 -21.2 2.4 -23.2 4.4
               C-20.4 4 -17.6 2.4 -15 0.6 Z"
          />
          <circle cx="12.6" cy="-1.5" r="0.8" fill="#12232f" />
        </g>
      </g>
    </g>

    <!--
      ⑫' 파도.

      밀려왔다 빠진다. 다가올수록 굵어지고 진해지다가 물가에 닿는 순간
      스러진다 — 부서지는 게 아니라 얇아지며 사라진다.
      저마다 다른 박자라야 바다가 숨 쉬는 것으로 보인다.
      다 같이 밀려오면 그건 파도가 아니라 줄무늬다.
    -->
    <g v-if="stage.beach" class="surf" stroke="#ffffff" fill="none" stroke-linecap="round">
      <path
        v-for="w in scene.waves"
        :key="`sf${w.i}`"
        :d="`M-20 ${w.y} q100 -4 200 0 t200 0 t200 0 t240 0`"
        :stroke-width="w.w"
        :style="{ '--dur': `${w.dur}s`, '--delay': `${w.delay}s`, '--o': w.o }"
      />
    </g>

    <!-- ⑬ 지면 -->
    <rect x="0" y="228" width="800" height="32" :fill="stage.ground" />

    <!--
      ⑬''''''' 소철.

      공룡이 살던 때의 식물은 꽃이 아니라 잎이다. 굵은 줄기 하나에
      잎이 부챗살처럼 퍼진다. 잎마다 각도를 조금씩 어긋뜨려야
      한 그루로 보인다 — 고르게 두면 우산이 된다.
    -->
    <!--
      나무고사리. 이 숲에서 가장 큰 것.
      가는 줄기가 곧게 오르고 꼭대기에서만 잎이 우산처럼 펼쳐진다.
      뒤쪽에 몇 그루만 둔다 — 큰 것이 많으면 숲이 아니라 벽이 된다.
    -->
    <g v-if="stage.dinoland" class="treeferns">
      <g
        v-for="t in scene.treeferns"
        :key="`tf${t.i}`"
        class="plant"
        :style="{
          '--sway': `${t.sway}s`,
          '--delay': `${t.delay}s`,
          '--ox': `${t.x}px`,
          '--oy': `${t.y}px`,
        }"
        :transform="`translate(${t.x} ${t.y}) scale(${t.sc})`"
      >
        <ellipse class="root" :fill="stage.near" cx="0" cy="0" rx="7" ry="2" opacity="0.35" />
        <!--
          줄기. 야자보다 굵다. 나무고사리의 줄기는 목재가 아니라
          해묵은 잎자루가 쌓여 굳은 것이라 통통하고 거칠다.
          떨어져 나간 잎자루 자국을 몇 개 남긴다 —
          매끈한 야자 줄기와 갈라지는 자리가 여기다.
        -->
        <path
          :stroke="stage.veg"
          stroke-width="4.6"
          fill="none"
          stroke-linecap="round"
          :d="`M0 0 q-2 ${-t.h * 0.5} 0 ${-t.h}`"
        />
        <path
          :stroke="stage.ink"
          stroke-width="0.7"
          fill="none"
          opacity="0.4"
          stroke-linecap="round"
          :d="`M-1.7 ${-t.h * 0.36} l3.4 -1.1 M-1.8 ${-t.h * 0.54} l3.4 -1.1 M-1.6 ${-t.h * 0.72} l3.4 -1.1`"
        />
        <!--
          잎.

          전에는 -90°~+90°, 즉 오른쪽 반쪽에만 붙었다. 왼쪽이 통째로
          비어서 바람에 쏠린 야자수가 됐다. 위쪽 반원에 고루 펴서
          우산꼴로 만든다. 바깥 잎은 수평보다 조금 아래까지 내려간다 —
          나무고사리의 아래쪽 잎은 처진다.

          다만 같은 잎을 돌려서만 붙이면, 아홉 장이 모두 같은 쪽으로
          휘어서 크라운 전체가 한 방향으로 도는 바람개비가 된다.
          왼쪽 절반은 각도를 접어 쓰고 scale(-1 1) 로 뒤집는다.
          그러면 가운데 잎을 축으로 좌우가 마주 보고, 도는 대신 펼쳐진다.

          날도 바꾼다. 매끈한 칼날은 야자의 것이다. 고사리 잎은 깃꼴이라
          가장자리가 잘게 갈라진다. 바깥쪽 가장자리에만 톱니를 넣는다.
          양쪽에 다 넣으면 이 크기(잎 하나가 22px)에서 형태가 뭉개져
          무엇인지 알 수 없는 얼룩이 된다.

          톱니는 얕게, 대신 여럿. 처음엔 날 너비의 대부분을 파냈더니
          잎이 아니라 톱날이 됐다. 깃꼴로 보이는 것은 골의 깊이가 아니라
          골의 개수다. 날 너비의 1/3 만 파고 아홉 번 반복한다.
        -->
        <g :transform="`translate(0 ${-t.h})`">
          <path
            v-for="k in t.fronds"
            :key="`tfr${k}`"
            :fill="stage.veg2"
            :stroke="stage.ink"
            stroke-width="0.7"
            stroke-linejoin="round"
            :transform="`${k < (t.fronds + 1) / 2 ? 'scale(-1 1) ' : ''}rotate(${-90 + (Math.abs(k - (t.fronds + 1) / 2) * 210) / (t.fronds - 1)})`"
            d="M-0.4 -1.1 C4 -5.2 9.5 -6.1 13.4 -5.5 C18 -4.7 22.5 -2.6 26 2
               L23.1 1.4 L22.6 -0.6 L20.6 0.9 L19.8 -1.1 L17.9 0.5 L17.1 -1.4
               L15.2 0.3 L14.6 -1.6 L13.4 0.3 L12.1 -1.5 L10.7 0.4 L9.4 -1.4
               L8.1 0.6 L6.9 -1.2 L6.3 0.8 L4.2 -0.9 L3.4 1 L1.1 -1.3 Z"
          />
        </g>
      </g>
    </g>

    <!--
      은행. 잎이 부채꼴이고 가지가 성기다.
      소철·나무고사리가 다 방사형이라, 하나쯤은 가지가 갈라지는 것이
      있어야 숲이 한 가지 문법으로만 되어 있지 않게 된다.
    -->
    <g v-if="stage.dinoland" class="ginkgos">
      <g
        v-for="g in scene.ginkgos"
        :key="`gk${g.i}`"
        class="plant"
        :style="{
          '--sway': `${g.sway}s`,
          '--delay': `${g.delay}s`,
          '--ox': `${g.x}px`,
          '--oy': `${g.y}px`,
        }"
        :transform="`translate(${g.x} ${g.y}) scale(${g.sc})`"
      >
        <ellipse class="root" :fill="stage.near" cx="0" cy="0" rx="6" ry="1.8" opacity="0.35" />
        <path
          :stroke="stage.veg"
          stroke-width="2.6"
          fill="none"
          stroke-linecap="round"
          :d="`M0 0 v${-g.h} M0 ${-g.h * 0.55} l-8 -8 M0 ${-g.h * 0.75} l9 -7`"
        />
        <g :fill="stage.veg2" :stroke="stage.ink" stroke-width="0.6">
          <path :transform="`translate(-9 ${-g.h * 0.55 - 8})`" d="M0 0 q-6 -5 0 -9 q6 4 0 9 z" />
          <path :transform="`translate(10 ${-g.h * 0.75 - 7})`" d="M0 0 q-6 -5 0 -9 q6 4 0 9 z" />
          <path :transform="`translate(0 ${-g.h})`" d="M0 0 q-7 -5 0 -10 q7 5 0 10 z" />
        </g>
      </g>
    </g>

    <g v-if="stage.dinoland" class="cycads">
      <g
        v-for="c in scene.cycads"
        :key="`cy${c.i}`"
        class="cycad"
        :style="{
          '--sway': `${c.sway}s`,
          '--delay': `${c.delay}s`,
          '--ox': `${c.x}px`,
          '--oy': `${c.y}px`,
        }"
        :transform="`translate(${c.x} ${c.y}) scale(${c.sc})`"
      >
        <!--
          줄기. 야자보다 짧고 굵다. 소철은 키가 크지 않다.

          그런데 전에는 줄기가 아예 보이지 않았다. 잎이 46° 씩 돌면서
          최대 ±161° 까지, 그러니까 바로 아래쪽까지 뻗어서 제 줄기를
          덮었기 때문이다. 남는 것은 땅에 박힌 바람개비 하나다.
          잎을 위로 올려 줄기를 드러낸다.
        -->
        <path
          :stroke="stage.veg"
          stroke-width="5.2"
          fill="none"
          stroke-linecap="round"
          d="M0 0 v-10"
        />
        <!--
          잎. 나무고사리와 같은 짜임 — 위쪽 반원에 펴고 왼쪽은 뒤집는다.
          바깥 잎은 수평보다 25° 아래에서 멈춘다. 그보다 내리면 다시
          줄기를 덮는다.

          다만 날은 매끈하게 둔다. 소철 잎은 뻣뻣한 가죽질이라
          고사리처럼 잘게 갈라지지 않는다. 배치는 같고 날이 다르다 —
          두 종이 갈리는 자리가 여기다.
        -->
        <path
          v-for="k in c.fronds"
          :key="`fr${k}`"
          :fill="stage.veg2"
          :stroke="stage.ink"
          stroke-width="0.6"
          :transform="`translate(0 -11) ${k < (c.fronds + 1) / 2 ? 'scale(-1 1) ' : ''}rotate(${-90 + (Math.abs(k - (c.fronds + 1) / 2) * 230) / (c.fronds - 1)})`"
          d="M0 0 C7 -5 14 -3 20 6 C13 1 6 0 0 3 Z"
        />
      </g>
    </g>

    <!--
      다른 공룡들.

      나무고사리 · 은행 · 소철 뒤가 아니라 앞에 세운다. 뒤에 두었더니
      나무고사리 줄기가 진초록 공룡의 얼굴을 정확히 세로로 갈랐다.
      멀리 있는 것이 가까운 것에 가리는 것은 깊이지만, 가는 줄기 하나가
      얼굴 한가운데를 지나는 것은 깊이가 아니라 사고다.
      대신 앞의 낮은 것들 — 속새 · 관목 · 바닥고사리 — 보다는 뒤에 남는다.

      식물을 아무리 여러 종 심어도 숲은 숲일 뿐이라, 이 판이 공룡 판이라는
      말은 공룡이 해야 한다. 실루엣이 서로 확실히 다른 셋을 세운다.

      주인공 무리보다 작고 뒤에 선다. 걷지 않고 고개만 움직인다 —
      걸어다니는 것이 여럿이면 눈이 갈 곳을 잃는다.

      어미와 같은 두 겹으로 그려 실루엣에만 선이 남게 한다.
    -->
    <g v-if="stage.dinoland" class="others">
      <g
        v-for="o in scene.others"
        :key="`ot${o.i}`"
        class="other"
        :style="{
          '--bob': `${o.bob}s`,
          '--delay': `${o.delay}s`,
          '--ink': stage.ink,
          '--tail': `${o.tail}s`,
          '--breath': `${o.breath}s`,
        }"
      >
        <g :transform="`translate(${o.x} ${o.y}) scale(${o.back ? -o.sc : o.sc} ${o.sc})`">
          <g v-for="pass in ['edge', 'fill']" :key="pass" :class="pass">
            <!-- 0 · 등에 판이 늘어선 것 -->
            <template v-if="o.kind === 0">
              <path
                class="tail"
                :fill="o.coat"
                d="M-16 -8 C-26 -9 -34 -6 -40 0 C-32 -2 -24 -3 -16 -3 Z"
              />
              <path class="leg a" :fill="o.limb" d="M-11 -4 h5 v10 h-5 z" />
              <path class="leg b" :fill="o.limb" d="M8 -4 h5 v10 h-5 z" />
              <path
                :fill="o.coat"
                d="M-18 -6 C-18 -18 -8 -24 2 -24 C13 -24 20 -18 20 -8 C20 -1 12 2 1 2 C-10 2 -18 0 -18 -6 Z"
              />
              <g class="head">
                <path
                  :fill="o.coat"
                  d="M17 -18 C22 -24 30 -25 34 -21 C37 -18 35 -13 30 -12 C24 -11 19 -14 17 -18 Z"
                />
                <g class="face">
                  <circle fill="#ffffff" cx="28" cy="-19" r="2.4" />
                  <circle :fill="stage.ink" cx="28.8" cy="-18.6" r="1.2" />
                </g>
              </g>
              <g class="plates" :fill="o.trim" :stroke="stage.accent" stroke-width="1.2">
                <path d="M-12 -20 l3 -8 l4 7 z" />
                <path d="M-3 -23 l3 -9 l4 8 z" />
                <path d="M6 -23 l3 -8 l4 7 z" />
              </g>
            </template>

            <!-- 1 · 머리에 뿔과 목도리를 두른 것 -->
            <template v-else-if="o.kind === 1">
              <path
                class="tail"
                :fill="o.coat"
                d="M-16 -8 C-24 -8 -30 -5 -34 0 C-27 -2 -21 -3 -16 -3 Z"
              />
              <path class="leg a" :fill="o.limb" d="M-10 -4 h5.5 v10 h-5.5 z" />
              <path class="leg b" :fill="o.limb" d="M7 -4 h5.5 v10 h-5.5 z" />
              <path
                :fill="o.coat"
                d="M-17 -6 C-17 -17 -8 -22 2 -22 C13 -22 19 -17 19 -8 C19 -1 12 2 1 2 C-10 2 -17 0 -17 -6 Z"
              />
              <g class="head">
                <!-- 목도리 -->
                <path
                  :fill="o.trim"
                  :stroke="stage.accent"
                  stroke-width="1.2"
                  d="M16 -22 C24 -30 34 -28 36 -18 C37 -10 29 -6 21 -9 Z"
                />
                <path
                  :fill="o.coat"
                  d="M24 -20 C31 -24 38 -22 40 -16 C41 -11 36 -8 30 -9 C26 -10 24 -15 24 -20 Z"
                />
                <!-- 뿔 둘 -->
                <path :fill="o.trim" d="M34 -22 l7 -8 l-2 9 z" />
                <path :fill="o.trim" d="M39 -16 l9 -3 l-8 5 z" />
                <g class="face">
                  <circle fill="#ffffff" cx="33" cy="-16" r="2.2" />
                  <circle :fill="stage.ink" cx="33.8" cy="-15.6" r="1.1" />
                </g>
              </g>
            </template>

            <!-- 2 · 두 발로 서서 꼬리를 곧게 뻗은 것 -->
            <template v-else>
              <path
                class="tail"
                :fill="o.coat"
                d="M-8 -14 C-20 -13 -32 -9 -42 -2 C-30 -6 -18 -8 -8 -9 Z"
              />
              <path class="leg a" :fill="o.limb" d="M-4 -8 C0 -8 2 -4 1 2 l-1 6 h-6 l2 -8 z" />
              <path class="leg b" :fill="o.limb" d="M4 -8 C8 -8 10 -4 9 2 l-1 6 h-6 l2 -8 z" />
              <path
                :fill="o.coat"
                d="M-9 -12 C-9 -22 -2 -27 6 -27 C14 -27 18 -22 18 -15 C18 -9 12 -6 3 -6 C-5 -6 -9 -8 -9 -12 Z"
              />
              <g class="head">
                <path
                  :fill="o.coat"
                  d="M14 -26 C16 -34 24 -37 30 -33 C35 -30 34 -24 28 -22 C22 -20 16 -22 14 -26 Z"
                />
                <g class="face">
                  <circle fill="#ffffff" cx="24" cy="-30" r="2.2" />
                  <circle :fill="stage.ink" cx="24.8" cy="-29.6" r="1.1" />
                  <circle :fill="stage.ink" cx="30" cy="-28.5" r="0.7" />
                </g>
              </g>
            </template>
          </g>
        </g>
      </g>
    </g>

    <!--
      ⑬'''''''' 알 둥지.

      하나만 둔다. 여럿 두면 알 가게가 된다.
      가운데 알만 아주 가끔 흔들린다 — 안에 무언가 있다는 뜻이다.
    -->
    <g v-if="stage.dinoland && scene.nest" class="nest">
      <g :transform="`translate(${scene.nest.x} ${scene.nest.y}) scale(${scene.nest.sc})`">
        <path
          :fill="stage.veg"
          :stroke="stage.ink"
          stroke-width="0.8"
          d="M-14 2 q4 -6 14 -6 q10 0 14 6 q-6 3 -14 3 q-8 0 -14 -3 z"
        />
        <ellipse
          :fill="stage.sky"
          :stroke="stage.ink"
          stroke-width="0.9"
          cx="-6.5"
          cy="-3"
          rx="3.6"
          ry="4.6"
        />
        <ellipse
          :fill="stage.sky"
          :stroke="stage.ink"
          stroke-width="0.9"
          cx="6.5"
          cy="-3"
          rx="3.6"
          ry="4.6"
        />
        <ellipse
          class="hatching"
          :fill="stage.sky"
          :stroke="stage.ink"
          stroke-width="0.9"
          cx="0"
          cy="-5"
          rx="4"
          ry="5.2"
        />
      </g>
    </g>

    <!--
      ⑬''''''''' 아기 공룡.

      알 근처를 종종거린다. 어른 공룡은 판 가운데의 모티프 하나로 족하고,
      바닥에는 작은 것들만 둔다 — 큰 것이 여럿이면 눈이 갈 곳을 잃는다.
    -->
    <!--
      ⑬''''''''' 둥지 곁의 아기.

      어미를 따라가는 아기(tot)와 같은 그림을 쓴다.
      전에는 이쪽만 옛 그림이 남아서, 흰자 없이 까만 점 하나에
      코도 입도 없었다. 같은 종인데 하나만 얼굴이 없으면
      그건 다른 것이거나 덜 그린 것이다.
    -->
    <g v-if="stage.dinoland" class="hatchlings">
      <g
        v-for="h in scene.hatchlings"
        :key="`ht${h.i}`"
        class="hatchling"
        :style="{
          '--dur': `${h.dur}s`,
          '--delay': `${h.delay}s`,
          '--span': `${h.span}px`,
          '--step': `${h.step}s`,
          '--dir': h.back ? -1 : 1,
          '--ink': stage.ink,
        }"
      >
        <g :transform="`translate(${h.x} ${h.y}) scale(${h.sc})`">
          <g v-for="pass in ['edge', 'fill']" :key="pass" :class="pass">
            <path :fill="stage.motifColor" d="M-7 0 C-12 -1 -16 -4 -19 -8 C-14 -7 -10 -5 -7 -3 Z" />
            <path class="leg a" :fill="stage.veg" d="M-3.4 1 h3.2 v7.4 h-3.2 z" />
            <path class="leg b" :fill="stage.veg" d="M2 1 h3.2 v7.4 h-3.2 z" />
            <path
              :fill="stage.motifColor"
              d="M-8 -1 C-8 -7 -3 -10 3 -10 C9.5 -10 12.5 -6.5 12.5 -2 C12.5 3 8.5 5.5 2 5.5 C-4 5.5 -8 3.5 -8 -1 Z"
            />
            <path
              :fill="stage.motifColor"
              d="M8 -6 C9 -12 12 -16 16 -17.5 L21 -13 C17.5 -11 14 -8 12.5 -4 Z"
            />
            <path
              :fill="stage.motifColor"
              d="M16 -19 C18 -24 24 -25 27.5 -22 C30.5 -19.5 30 -15 26.5 -13.5 C23 -12 18.5 -13.5 17 -16 Z"
            />
            <g class="plates" :fill="stage.veg2" :stroke="stage.accent" stroke-width="0.8">
              <path d="M-4.4 -7.4 l2 -3.8 l2 3.8 z" />
              <path d="M0.6 -9.4 l2 -3.8 l2 3.8 z" />
            </g>
            <g class="face">
              <circle fill="#ffffff" cx="23.2" cy="-19.4" r="3.6" />
              <circle :fill="stage.ink" cx="24.2" cy="-19" r="1.9" />
              <circle fill="#ffffff" cx="25" cy="-20.2" r="0.7" />
              <circle :fill="stage.ink" cx="29.2" cy="-18.4" r="0.85" />
              <path
                :stroke="stage.ink"
                stroke-width="0.9"
                fill="none"
                stroke-linecap="round"
                d="M29.6 -15.6 C27.6 -13.8 24.6 -13.6 22.6 -14.6"
              />
            </g>
          </g>
        </g>
      </g>
    </g>

    <!--
      속새. 마디로 이어진 대롱이 곧게 선다. 무리 지어 난다.
      곧은 세로선이 몇 개 있어야 방사형 잎들 사이에서 숲이 서 있는
      것으로 보인다 — 전부 퍼지는 모양이면 바닥에 깔린 것 같다.
    -->
    <g v-if="stage.dinoland" class="horsetails">
      <g
        v-for="h in scene.horsetails"
        :key="`hs${h.i}`"
        class="plant"
        :style="{
          '--sway': `${h.sway}s`,
          '--delay': `${h.delay}s`,
          '--ox': `${h.x}px`,
          '--oy': `${h.y}px`,
        }"
        :transform="`translate(${h.x} ${h.y})`"
      >
        <g v-for="k in h.n" :key="`hst${k}`" :transform="`translate(${(k - (h.n + 1) / 2) * 4} 0)`">
          <path
            :stroke="stage.veg"
            stroke-width="1.6"
            fill="none"
            stroke-linecap="round"
            :d="`M0 0 v${-h.h * (0.7 + (k % 3) * 0.15)}`"
          />
          <path
            :stroke="stage.veg2"
            stroke-width="0.9"
            fill="none"
            stroke-linecap="round"
            :d="`M-2 ${-h.h * 0.3} h4 M-2 ${-h.h * 0.5} h4`"
          />
        </g>
      </g>
    </g>

    <!--
      덤불. 잎 몇 장이 뭉쳐 낮게 퍼진다.
      큰 것과 작은 것 사이를 메우는 중간 키다. 이게 없으면
      나무와 바닥 사이가 비어 두 층으로만 보인다.
    -->
    <g v-if="stage.dinoland" class="shrubs">
      <g
        v-for="b in scene.shrubs"
        :key="`sb${b.i}`"
        class="plant"
        :style="{
          '--sway': `${b.sway}s`,
          '--delay': `${b.delay}s`,
          '--ox': `${b.x}px`,
          '--oy': `${b.y}px`,
        }"
        :transform="`translate(${b.x} ${b.y}) scale(${b.sc})`"
      >
        <ellipse class="root" :fill="stage.near" cx="0" cy="0" rx="8" ry="2" opacity="0.3" />
        <path
          v-for="k in b.leaves"
          :key="`sbl${k}`"
          :fill="stage.veg"
          :stroke="stage.ink"
          stroke-width="0.6"
          :transform="`rotate(${(k - (b.leaves + 1) / 2) * 34})`"
          d="M0 0 C-3 -5 -1.6 -10 0 -13 C1.6 -10 3 -5 0 0 Z"
        />
      </g>
    </g>

    <!--
      ⑭'' 전경 고사리.

      풀 대신 고사리다. 잎이 한쪽으로만 갈라져 나가는 깃 모양이라
      풀보다 낮고 넓게 깔린다.
    -->
    <g v-if="stage.dinoland" class="ferns">
      <g
        v-for="(f, i) in scene.ferns"
        :key="`fn${i}`"
        class="fern"
        :style="{
          '--sway': `${f.sway}s`,
          '--delay': `${f.delay}s`,
          '--ox': `${f.x}px`,
          '--oy': `${f.y}px`,
        }"
        :transform="`translate(${f.x} ${f.y}) scale(${f.lean * f.sc} ${f.sc})`"
      >
        <path
          :stroke="stage.veg"
          stroke-width="1.5"
          fill="none"
          stroke-linecap="round"
          d="M0 0 q2 -8 8 -13"
        />
        <path
          :stroke="stage.veg2"
          stroke-width="1.1"
          fill="none"
          stroke-linecap="round"
          d="M1.4 -4 l-3.6 -2.6 M3 -7 l-3.4 -3 M5 -9.6 l-3 -3.4 M7 -11.6 l-2.4 -3.6"
        />
      </g>
    </g>

    <!--
        ⑬'' 소라 · 조개 · 불가사리.

        가만히 있는 것들이라 자리만 정해 주면 된다.
        기울기를 조금씩 달리 두는 게 전부인데, 그것만으로도
        누가 늘어놓은 게 아니라 파도가 밀어 놓은 것으로 보인다.
      -->
    <g v-if="stage.beach" class="shells">
      <g
        v-for="(h, i) in scene.shells"
        :key="`sh${i}`"
        :transform="`translate(${h.x} ${h.y}) rotate(${h.tilt}) scale(${h.sc})`"
      >
        <!-- 소라 -->
        <template v-if="h.kind === 0">
          <path
            :fill="stage.bloom"
            d="M0 3 C-4.4 3 -5.4 -1.4 -2.6 -3.4 C-0.4 -5 3.2 -4 4.4 -1 C5.2 1 3.2 3 0 3 Z"
          />
          <path
            :stroke="stage.veg"
            fill="none"
            stroke-width="0.7"
            d="M-2.4 2.4 q1.6 -3.6 4.4 -4.6 M-0.4 3 q0.6 -4 3.4 -5"
          />
        </template>
        <!-- 조개 -->
        <path
          v-else-if="h.kind === 1"
          :fill="stage.veg2"
          :stroke="stage.veg"
          stroke-width="0.6"
          d="M-4.6 2.4 A4.6 4.2 0 0 1 4.6 2.4 Z M-2.4 2.4 L-1 -1.6 M0 2.4 L0 -1.9 M2.4 2.4 L1 -1.6"
        />
        <!-- 불가사리 -->
        <path
          v-else
          :fill="stage.motifColor"
          opacity="0.72"
          d="M0 -4.6 L1.4 -1.4 L4.6 -1.1 L2.1 1.1 L2.8 4.3 L0 2.6 L-2.8 4.3 L-2.1 1.1 L-4.6 -1.1 L-1.4 -1.4 Z"
        />
      </g>
    </g>

    <!--
        ⑬''' 꽃게.

        옆으로만 걷는다. 앞으로 걷는 꽃게는 꽃게가 아니다.
        집게발을 번갈아 들었다 놓으면 종종거리는 것으로 보인다.
      -->
    <g v-if="stage.beach" class="crabs">
      <g
        v-for="c in scene.crabs"
        :key="`cr${c.i}`"
        class="crab"
        :style="{
          '--dur': `${c.dur}s`,
          '--delay': `${c.delay}s`,
          '--span': `${c.span}px`,
          '--step': `${c.step}s`,
          '--dir': c.back ? -1 : 1,
        }"
      >
        <g :transform="`translate(${c.x} ${c.y}) scale(${c.sc})`" :fill="stage.motifColor">
          <!-- 다리 여섯 -->
          <g :stroke="stage.motifColor" stroke-width="0.85" fill="none" stroke-linecap="round">
            <path d="M-3.4 1.6 l-2.6 2.4 M-1.2 2.1 l-1.4 2.8 M1.2 2.1 l1.4 2.8 M3.4 1.6 l2.6 2.4" />
          </g>
          <!-- 집게발 -->
          <g class="claw one">
            <path
              d="M-4.2 -0.6 q-2.8 -0.6 -3.6 -2.6 q1.6 -0.6 2.8 0.2 q-1.2 -1.4 -0.4 -2.4 q1.8 1 2.4 3z"
            />
          </g>
          <g class="claw two">
            <path
              d="M4.2 -0.6 q2.8 -0.6 3.6 -2.6 q-1.6 -0.6 -2.8 0.2 q1.2 -1.4 0.4 -2.4 q-1.8 1 -2.4 3z"
            />
          </g>
          <!-- 등딱지 -->
          <ellipse cx="0" cy="0" rx="4.6" ry="3" />
          <circle cx="-1.7" cy="-2.4" r="0.75" fill="#2b2b2f" />
          <circle cx="1.7" cy="-2.4" r="0.75" fill="#2b2b2f" />
        </g>
      </g>
    </g>

    <!--
        ⑬''''' 파라솔.

        모티프 자리(⑦)에 두었더니 바다에 잠겼다. 그 자리는 하늘 다음이라
        뒤에 오는 바다가 기둥을 덮어, 파라솔만 수평선에 떠 있었다.
        모래를 다 그린 다음에 꽂아야 모래에 꽂힌 것이 된다.

        비스듬히 꽂는다. 곧게 세우면 심어 놓은 것 같다.
      -->
    <g v-if="stage.beach" class="parasol">
      <g transform="rotate(-9 640 214)">
        <!-- 자루. 갓 꼭대기까지 올라가야 갓이 얹힌 것으로 보인다 -->
        <path :stroke="stage.veg" stroke-width="2.6" stroke-linecap="round" d="M640 214 V118" />
        <!--
          갓. 아래 가장자리는 물결, 위 테두리는 호.
          중심 (640, 154) 에 반지름 56 × 40 인 반타원이고 꼭짓점은 (640, 114) 다.
        -->
        <path
          :fill="stage.motifColor"
          d="M584 154 q11.2 8 22.4 0 q11.2 8 22.4 0 q11.2 8 22.4 0 q11.2 8 22.4 0 q11.2 8 22.4 0 A56 40 0 0 0 584 154 Z"
        />
        <!--
          흰 널 세 장.

          두 번 어긋났다.
          처음에는 꼭짓점까지 곧은 선으로만 잘랐다. 갓의 바깥 테두리는
          호라서 맨 왼쪽 널의 직선 바깥에 빨간 초승달이 남았다.
          그다음엔 양 끝 널만 호로 닫았더니, 그 둘이 초승달까지 삼켜서
          가운데 널이 얇은 쐐기가 됐다. 널 폭이 들쭉날쭉했다.

          이음선을 갓의 곡면을 따라 휘게 긋는다. 실제 파라솔의 이음선도
          곧지 않다 — 돔을 옆에서 보면 바깥쪽 이음선일수록 크게 휜다.
          그러면 널 다섯이 고르게 갈리고 남는 자리도 없다.

          다섯으로 나눈 건 양 끝이 다 흰색이 되게 하려는 것이다.
          짝수로 나누면 한쪽 끝이 빨강으로 끝나 무늬가 어긋나 보인다.
        -->
        <path fill="#fdfaf2" d="M584 154 q11.2 8 22.4 0 Q619.8 126 640 114 Q606.4 126 584 154 Z" />
        <path
          fill="#fdfaf2"
          d="M628.8 154 q11.2 8 22.4 0 Q646.7 126 640 114 Q633.3 126 628.8 154 Z"
        />
        <path
          fill="#fdfaf2"
          d="M673.6 154 q11.2 8 22.4 0 Q673.6 126 640 114 Q660.2 126 673.6 154 Z"
        />
        <circle :fill="stage.veg" cx="640" cy="114" r="2.6" />
      </g>
    </g>

    <!--
        ⑬'''' 모래 위를 걷는 갈매기.

        갈매기는 나는 시간보다 서 있는 시간이 길다. 물가를 따라
        종종거리다 멈춰 서서 모래를 쪼는 게 실제 해변의 모습이다.
        나는 것만 두면 해변이 아니라 하늘이 된다.
      -->
    <g v-if="stage.beach" class="strollers">
      <g
        v-for="g in scene.strollers"
        :key="`st${g.i}`"
        class="stroller"
        :style="{
          '--dur': `${g.dur}s`,
          '--delay': `${g.delay}s`,
          '--span': `${g.span}px`,
          '--step': `${g.step}s`,
          '--dir': g.back ? -1 : 1,
        }"
      >
        <g :transform="`translate(${g.x} ${g.y}) scale(${g.sc})`">
          <g class="legs" :stroke="stage.motifColor" stroke-width="0.8" stroke-linecap="round">
            <path class="leg a" d="M-0.8 3.2 v3" />
            <path class="leg b" d="M1 3.2 v3" />
          </g>
          <path
            fill="#fdfdfb"
            d="M-5.4 1.6 C-5.4 -1.6 -2.6 -3.4 0.4 -3.4 C3.6 -3.4 5.6 -1.4 5.6 0.6 C5.6 2.6 3 3.8 0 3.8 C-3 3.8 -5.4 3.2 -5.4 1.6 Z"
          />
          <path :fill="stage.veg" opacity="0.5" d="M-5.2 1.4 q3 1.6 6.4 1.2 q-2.6 1.2 -6.4 0.4 z" />
          <circle cx="3.4" cy="-2.6" r="2.5" fill="#fdfdfb" />
          <circle cx="4.2" cy="-3.1" r="0.62" fill="#2b2b2f" />
          <path :fill="stage.bloom" d="M5.6 -2.6 l3 0.8 l-3 0.9z" />
        </g>
      </g>
    </g>

    <!-- ⑬' 산호. 지면 다음에 얹는다 — 먼저 그렸더니 바닥에 덮여 하나도 안 보였다 -->
    <g v-if="stage.under" class="corals">
      <g v-for="(c, i) in scene.corals" :key="`c${i}`">
        <path
          v-for="a in c.arms"
          :key="`ca${a}`"
          :d="`M${c.x} ${c.y + 8} q${(a - c.arms / 2) * 5} ${-c.r * 0.7} ${(a - c.arms / 2) * 8} ${-c.r}`"
          :stroke="c.lit ? stage.bloom : stage.veg"
          :opacity="c.lit ? 0.75 : 1"
        />
      </g>
    </g>

    <!--
        ⑭' 해초. 바닥에 뿌리를 두고 물살에 눕는다.

        풀은 바람에 떨듯 흔들리지만 해초는 물에 밀려 천천히 눕는다.
        같은 흔들림을 두 배 느리게, 두 배 크게 준다. 그 차이가 물이다.
      -->
    <g v-if="stage.under" class="kelp" :stroke="stage.veg2">
      <path
        v-for="(k, i) in scene.kelp"
        :key="`k${i}`"
        :d="`M${k.x} 262 c${k.lean * 0.5} ${-k.h * 0.32} ${k.lean * 1.7} ${-k.h * 0.44} ${k.lean * 1.05} ${-k.h * 0.72} c${-k.lean * 1.1} ${-k.h * 0.2} ${k.lean * 0.5} ${-k.h * 0.2} ${k.lean * 1.7} ${-k.h * 0.3}`"
        :style="{
          '--sway': `${k.sway}s`,
          '--delay': `${k.delay}s`,
          '--w': `${k.w}`,
        }"
      />
    </g>

    <!--
      ⑬''' 들꽃.

      봄의 알록달록함을 여기 한 겹에만 담는다. 판 전체를 분홍 한 색의
      명도 단계로 내려오게 짜 두었으므로, 다른 색을 들이려면 아주 적게
      아주 낮은 채도로 들여야 한다. 많으면 색동이 되고 그러면 판이 깨진다.

      풀보다 뒤에 둔다. 풀 사이로 언뜻 보여야 들꽃이고, 앞에 두면
      길바닥에 흩어 놓은 구슬이 된다.
    -->
    <g v-if="scene.wild.length" class="wild">
      <g
        v-for="w in scene.wild"
        :key="`wf${w.i}`"
        class="bloom"
        :style="{ '--sway': `${w.sway}s` }"
      >
        <path :d="`M${w.x} ${w.y + 7}v-7`" :stroke="stage.veg" stroke-width="0.9" opacity="0.6" />
        <circle :cx="w.x" :cy="w.y" :r="w.r" :fill="w.c" :opacity="w.o" />
      </g>
    </g>

    <!-- ⑭ 전경 풀. 바람에 흔들린다 -->
    <g v-if="!stage.under" class="grass" :stroke="stage.veg">
      <path
        v-for="(g, i) in scene.grass"
        :key="`g${i}`"
        :stroke="g.fresh && stage.grassFresh ? stage.grassFresh : undefined"
        :d="`M${g.x} 260 q${g.lean} ${-g.h * 0.6} ${g.lean * 1.6} ${-g.h}`"
        :style="{ '--sway': `${g.sway}s`, '--delay': `${g.delay}s` }"
      />
    </g>

    <!-- ⑮ 떠다니는 것 -->
    <g class="motes" :class="stage.motes" :fill="stage.bloom">
      <circle
        v-for="(m, i) in scene.motes"
        :key="`o${i}`"
        :cx="m.x"
        :cy="m.y"
        :r="m.r"
        :fill="m.pale && stage.motePale ? stage.motePale : undefined"
        :style="{ '--dur': `${m.dur}s`, '--delay': `${m.delay}s`, '--drift': `${m.drift}px` }"
      />
    </g>

    <!--
        ⑮' 마린 스노우.
        심해를 심해로 보이게 하는 건 사실 이것 하나다.
        물이 맑으면 그냥 파란 방이고, 무언가 천천히 가라앉고 있어야 깊이가 생긴다.
      -->
    <g v-if="stage.under" class="marine" fill="#dff3f0">
      <circle
        v-for="(m, i) in scene.marine"
        :key="`ms${i}`"
        :cx="m.x"
        :cy="m.y"
        :r="m.r"
        :style="{
          '--dur': `${m.dur}s`,
          '--delay': `${m.delay}s`,
          '--drift': `${m.drift}px`,
          '--o': m.o,
        }"
      />
    </g>

    <!-- ⑮'' 스스로 빛나는 것들. 깊은 곳의 빛은 위에서 오지 않는다 -->
    <g v-if="stage.under" class="glows" :fill="stage.bloom">
      <circle
        v-for="(g, i) in scene.glows"
        :key="`gl${i}`"
        :cx="g.x"
        :cy="g.y"
        :r="g.r"
        :style="{ '--dur': `${g.dur}s`, '--delay': `${g.delay}s` }"
      />
    </g>

    <!--
        ⑬'''''' 나는 갈매기.

        새 떼(birds)는 한 무리가 대열을 지어 지나간다. 갈매기는 그렇게
        날지 않는다 — 저마다 다른 높이에서 각자 오르내린다.
        그래서 한 마리씩 다른 궤도와 박자를 준다.

        바다보다 나중에 그린다. 하늘 다음 자리(⑥)에 두었더니 뒤에 오는
        바다가 갈매기를 덮어서, 물 위를 나는 동안에는 통째로 사라졌다.
        하늘을 나는 것은 하늘보다 앞이지만 바다보다도 앞이다.

        날개는 갈매기의 전부다. 몸통을 그리지 않고 획 하나로 그린다.
        멀리서 보는 갈매기는 실제로 그렇게만 보인다.
      -->
    <g v-if="stage.beach" class="gulls" fill="none" stroke-linecap="round">
      <g
        v-for="g in scene.gulls"
        :key="`gl${g.i}`"
        class="gull"
        :class="{ back: g.back }"
        :style="{
          '--dur': `${g.dur}s`,
          '--delay': `${g.delay}s`,
          '--rise': `${g.rise}px`,
        }"
      >
        <g :transform="`translate(0 ${g.y}) scale(${g.back ? -g.sc : g.sc} ${g.sc})`">
          <!--
              날개는 갈매기의 전부다. 몸통을 그리지 않고 획 하나로 그린다.
              멀리서 보는 갈매기는 실제로 그렇게만 보인다.

              희게 그린다. 바다색(near)으로 그렸더니 물 위를 날 때
              바다에 묻혀 한 마리도 안 보였다. 갈매기는 원래 희다.
            -->
          <path
            class="wing"
            stroke="#fbfcfd"
            :stroke-width="2.1 / g.sc"
            d="M-9 0 q4.6 -5.2 9 -0.6 q4.4 -4.6 9 0.6"
          />
          <path
            class="wing tip"
            :stroke="stage.near"
            :stroke-width="0.8 / g.sc"
            opacity="0.5"
            d="M-9 0 q4.6 -5.2 9 -0.6 q4.4 -4.6 9 0.6"
          />
        </g>
      </g>
    </g>

    <!--
      ⑥''''' 익룡.

      새와 다르게 그린다. 날개가 몸보다 훨씬 길고, 끝이 뾰족하고,
      뒤통수에 볏이 하나 솟는다. 그 볏 하나가 새와 익룡을 가른다.
    -->
    <g v-if="stage.dinoland" class="pteros">
      <g
        v-for="p in scene.pterosaurs"
        :key="`pt${p.i}`"
        class="ptero"
        :class="{ back: p.back }"
        :style="{ '--dur': `${p.dur}s`, '--delay': `${p.delay}s`, '--rise': `${p.rise}px` }"
      >
        <g :transform="`translate(0 ${p.y}) scale(${p.back ? -p.sc : p.sc} ${p.sc})`">
          <g class="wings" :fill="stage.near" :stroke="stage.ink" stroke-width="0.9">
            <path d="M0 0 C-6 -5 -14 -7 -21 -5 C-14 -1 -7 1 0 1 Z" />
            <path d="M0 0 C6 -5 14 -7 21 -5 C14 -1 7 1 0 1 Z" />
          </g>
          <path :fill="stage.ink" d="M-2 -1 q2 -3 5 -3 q3 0 4 2 l4 -1 l-4 3 q-4 2 -9 1 z" />
        </g>
      </g>
    </g>

    <!-- ⑦ 모티프 — 무대마다 하나 -->
    <g
      class="motif"
      :stroke="stage.lang === 'illustrated' ? stage.motifColor || stage.accent : stage.accent"
      :fill="stage.lang === 'illustrated' ? stage.motifColor || stage.accent : 'none'"
    >
      <g v-if="stage.motif === 'tree'">
        <path d="M596 200V96" />
        <path d="M596 132l-28-22M596 150l30-24M596 114l-20-18" />
        <path d="M548 96a48 36 0 0 1 96 0a48 32 0 0 1-96 0z" />
      </g>
      <g v-else-if="stage.motif === 'gull'">
        <path
          d="M520 96c22-30 44-34 62-12c18-22 40-18 62 12c-24-10-44-4-62 12c-18-16-38-22-62-12z"
        />
      </g>

      <!--
        벚꽃놀이 — 만개한 벚나무 한 그루.

        캐노피를 정확한 타원으로 두면 사탕이 된다. 활짝 핀 벚나무는
        가지마다 부푼 덩어리가 붙어 윤곽이 울퉁불퉁하다.
        그래서 호를 네 번 이어 붙여 닫는다.

        땅에 뿌리내린 모티프라 이쪽 그룹에 둔다 —
        접힌 띠에 나무 밑동만 남아 서 있으면 무슨 장면인지 알 수 없다.
      -->
      <!--
        벚꽃놀이의 주인공 — 위에서 늘어진 가지.

        한 그루를 통째로 세워 봤다. 그건 벚나무를 멀리서 보는 시점이라
        다른 스물네 장과 똑같은 판이 됐다. 벚꽃놀이는 나무를 보러 가는
        날이 아니라 나무 아래로 들어가는 날이다.

        그래서 가지를 판 위쪽 좌우 모서리에서 안으로 늘어뜨렸다.
        오른쪽이 굵고 길게, 왼쪽이 가늘고 짧게 — 같은 무게로 걸면
        액자가 되지만, 한쪽이 무거우면 그건 나무 아래다.
        줄기도 뿌리도 안 보인다. 올려다보는 사람에게는 원래 안 보인다.

        송이는 잘게 나눈다. 큰 덩어리 몇 개로 달았더니 가지에 구름이
        걸린 꼴이었고, 하필 판에 흰 구름이 떠 있어 둘이 같아 보였다.

        송이 색은 한 가지로 둔다. 흰 송이를 섞고 순백 점을 찍어 봤는데,
        가지가 알록달록해지면서 정작 주인공인 가지의 흐름이 흩어졌다.
        흰빛은 흩날리는 꽃잎 쪽에서 맡는다.
      -->
      <g v-else-if="stage.motif === 'blossom'">
        <g fill="none" :stroke="stage.accent" stroke-linecap="round">
          <path d="M814 4C726 14 662 34 590 38 522 42 472 58 414 72" stroke-width="7" />
          <path d="M-14 24C54 28 110 42 158 60" stroke-width="5" />
          <path
            d="M702 22q-8 26-26 38M602 36q-4 26-22 40M498 50q-12 22-32 32M414 72q-12 16-30 20M108 44q4 22 18 32"
            stroke-width="3"
          />
        </g>
        <g>
          <ellipse cx="786" cy="10" rx="34" ry="19" />
          <ellipse cx="726" cy="20" rx="27" ry="15" />
          <ellipse cx="672" cy="30" rx="23" ry="13" />
          <ellipse cx="620" cy="36" rx="26" ry="15" />
          <ellipse cx="566" cy="42" rx="22" ry="13" />
          <ellipse cx="508" cy="52" rx="24" ry="14" />
          <ellipse cx="456" cy="64" rx="19" ry="11" />
          <ellipse cx="416" cy="74" rx="16" ry="10" />
          <ellipse cx="700" cy="52" rx="15" ry="9" />
          <ellipse cx="600" cy="58" rx="13" ry="8" />
          <ellipse cx="496" cy="74" rx="12" ry="7" />
          <ellipse cx="384" cy="92" rx="10" ry="6" />
          <ellipse cx="10" cy="20" rx="28" ry="16" />
          <ellipse cx="66" cy="30" rx="22" ry="13" />
          <ellipse cx="116" cy="44" rx="18" ry="11" />
          <ellipse cx="156" cy="60" rx="14" ry="9" />
          <ellipse cx="128" cy="78" rx="11" ry="7" />
        </g>
      </g>

      <!--
        단오 — 그네.

        줄 길이를 다르게 둔다. 나란히 맞춰 두면 사다리로 보이는데,
        그넷줄은 가지가 뻗은 자리에 매는 것이라 애초에 높이가 다르다.

        발판만 면으로 그리고 나머지는 선이다. 다 면으로 그렸더니
        줄이 굵어져서 그네가 아니라 사다리가 됐다.
      -->
      <g v-else-if="stage.motif === 'swing'">
        <!--
          기둥을 땅까지 내린다.

          가로대와 줄과 발판만 그렸더니 그네가 허공에 걸린 문틀로 보였다.
          그네는 매다는 물건이라 무엇에 매였는지가 함께 보여야 하고,
          그 무엇이 판 밖에 있으면 매인 데 없이 떠 있는 것이 된다.

          기둥은 살짝 바깥으로 벌린다. 수직으로 세우면 사다리가 되는데,
          그네틀은 사람이 굴러도 넘어지지 않게 다리를 벌려 박는다.
        -->
        <g fill="none">
          <path d="M492 46q68 22 156 12" stroke-width="5" />
          <path d="M508 50l-18 156M634 56l24 150" stroke-width="5" />
          <path d="M566 62v84M614 60v86" />
          <path d="M560 152l-6 12M620 152l6 12" />
        </g>
        <rect x="552" y="142" width="76" height="9" rx="3" />
      </g>

      <!--
        크리스마스 — 트리.

        이 목록에서 유일한 각인형이라 면이 아니라 금박 선으로 그린다.
        층은 셋이다. 넷으로 늘려 봤더니 층마다 좁아져서
        전나무가 아니라 탑이 됐다.

        장식은 다섯 알만, 그것도 흐리게. 금선 위에 금알을 또렷하게
        얹으면 어느 것이 나무이고 어느 것이 장식인지 갈리지 않는다.
      -->
      <g v-else-if="stage.motif === 'firtree'">
        <!-- 밑동. 나무 맨 아래 층(y 190)에 물리게 둔다. 띄우면 선 하나가 따로 떠 있다 -->
        <path d="M600 214v-26" />
        <path d="M600 52l-36 50h19l-31 42h25l-33 46h112l-33-46h25l-31-42h19z" />
        <path d="M600 28l4.6 12 12 4.6-12 4.6-4.6 12-4.6-12-12-4.6 12-4.6z" />
        <g class="dim">
          <circle cx="582" cy="124" r="3" />
          <circle cx="620" cy="142" r="3" />
          <circle cx="592" cy="170" r="3" />
          <circle cx="634" cy="178" r="3" />
          <circle cx="566" cy="182" r="3" />
        </g>
      </g>

      <!--
      ⑬'''''''''' 공룡 무리.

      큰 공룡 하나와 아기 둘이 함께 판을 가로질러 간다.
      아주 느리다 — 판 하나 건너는 데 이 분 반이 걸린다.
      빨리 가면 지나가는 것이 되고, 지나가는 것은 배경이 아니라 사건이다.

      셋을 한 묶음으로 옮긴다. 따로 움직이면 앞서거니 뒤서거니 하다가
      결국 흩어져서, 어미와 새끼가 아니라 우연히 같은 방향으로 가는
      남남이 된다. 무리는 간격이 유지되어야 무리다.

      땅을 다 그린 뒤에 세운다. 모티프 자리(⑦)에 두었더니 뒤에 오는
      언덕과 지면이 몸통을 덮어 머리와 목만 하늘에 떠 있었다.
    -->
      <g v-if="stage.dinoland" class="herd">
        <g class="pace">
          <g transform="translate(0 216)">
            <!--
            어미. 목이 길고 등에 골판이 서고 배가 밝다.

            참조한 표지의 공룡은 실루엣이 아니라 만화체 캐릭터다 —
            굵은 외곽선이 있고, 눈이 있고, 웃는다.
            열세 장 중 유일하게 '귀여운' 표지라고 적힌 이유가 그것이다.
          -->
            <!--
              어미.

              부위마다 선을 두르니 조립한 것처럼 보였다. 목과 몸 사이,
              다리와 배 사이에 선이 그어져서 한 마리가 아니라
              여러 조각을 붙여 놓은 그림이 됐다.

              그래서 두 번 그린다.
                edge  모든 부위를 외곽색으로 채우고 굵게 두른다.
                      겹친 자리가 하나로 뭉쳐 실루엣이 된다
                fill  같은 부위를 제 색으로 다시 덮는다. 선은 없다

              바깥에는 선이 남고 안쪽에는 남지 않는다.
              캐릭터의 흰 테두리와 같은 방식이다.

              얼굴선과 골판의 시안선은 fill 겹에만 있다.
              그 둘은 조립선이 아니라 그리려던 무늬다.
            -->
            <g class="bigdino" :style="{ '--ink': stage.ink }">
              <g v-for="pass in ['edge', 'fill']" :key="pass" :class="pass">
                <!-- 꼬리. 몸 뒤로 눕고 끝으로 갈수록 가늘어진다 -->
                <path
                  class="tail"
                  :fill="stage.motifColor"
                  d="M-30 -32 C-54 -32 -78 -22 -98 -6 C-74 -12 -50 -14 -30 -14 Z"
                />
                <!-- 뒷다리. 몸에 가려 반만 보이지만 있어야 걷는 것으로 보인다 -->
                <path
                  class="leg back"
                  :fill="stage.veg"
                  d="M-16 -28 q12 0 14 14 l-1 16 h-16 l1 -16 z"
                />
                <path
                  :fill="stage.motifColor"
                  d="M-36 -22 q-6 -28 20 -38 q22 -8 40 2 q14 8 14 22 q0 16 -18 20 q-30 6 -56 -6 z"
                />
                <!-- 앞다리. 뒷다리보다 조금 앞이고 조금 짧다 -->
                <path
                  class="leg fore"
                  :fill="stage.veg"
                  d="M18 -26 q12 0 13 13 l-1 15 h-15 l1 -15 z"
                />
                <!--
                  배. 아래쪽에 붙인다.
                  가운데에 두었더니 몸을 가로지르는 밝은 얼룩이 됐다.
                  배는 배가 있을 자리에 있어야 배로 보인다.
                -->
                <path :fill="stage.veg2" d="M-30 -14 q28 10 54 0 q-26 10 -54 0 z" />
                <!--
                  목과 머리.

                  전에는 목과 머리가 거의 같은 굵기라 한 줄기 관처럼
                  이어져서, 공룡이 아니라 뱀 같았다.
                  목은 어깨에서 올라가며 가늘어지고, 머리는 그 끝에서
                  다시 부풀어야 목과 머리가 갈린다.

                  코는 주둥이 안에 찍는다. 밖에 두었더니 뿔이 하나
                  돋은 것처럼 보였다.
                -->
                <g class="neck">
                  <path
                    :fill="stage.motifColor"
                    d="M12 -38 C18 -64 32 -84 54 -97 L66 -83 C48 -74 34 -58 28 -36 Z"
                  />
                  <path
                    :fill="stage.motifColor"
                    d="M56 -100 C58 -113 72 -120 86 -116 C98 -113 105 -104 103 -95
                       C101 -87 91 -83 79 -84 C67 -85 57 -91 56 -100 Z"
                  />
                  <g class="face">
                    <circle fill="#ffffff" cx="80" cy="-103" r="6.4" />
                    <circle :fill="stage.ink" cx="81.5" cy="-102.5" r="3.2" />
                    <circle fill="#ffffff" cx="83" cy="-105" r="1.3" />
                    <!-- 콧구멍. 주둥이 끝 안쪽 -->
                    <circle :fill="stage.ink" cx="98" cy="-100" r="1.3" />
                    <!-- 입 -->
                    <path
                      :stroke="stage.ink"
                      stroke-width="2"
                      fill="none"
                      stroke-linecap="round"
                      d="M101 -93 C95 -88 86 -87 79 -89"
                    />
                  </g>
                </g>
                <!--
                  등의 골판. 이 판의 보색이 여기서 한 번 더 나온다.

                  전에는 세 판이 등에서 떠 있었다. 밑변을 등선이 아니라
                  서로 비슷한 높이에 나란히 두었기 때문이다. 등은 가운데가
                  가장 높고(x 0 에서 y -63.5) 어깨로 가며 낮아지는데
                  (x 16 에서 -61, x 24 에서 -58), 밑변은 셋 다 -58~-64 였다.
                  그래서 뒤판은 몸에 파묻히고 앞의 두 판은 등 위로 네댓씩
                  떠서, 등에서 자란 골판이 아니라 등 위 허공에 붙여 놓은
                  뿔 세 개가 됐다. 마지막 판은 등의 오른쪽 끝(x 24)마저
                  넘어가 목 위에 얹혀 있었다.

                  밑변을 등의 곡선에 앉힌다. 직선으로 자르면 등이 굽은 만큼
                  한쪽은 파묻히고 한쪽은 뜨므로, 밑변도 등과 같은 곡선으로
                  긋고 그 선을 등선보다 0.8 아래, 즉 몸 안쪽에 둔다.
                  겹친 만큼이 edge 겹에서 몸과 한 덩이로 뭉친다.

                  오른쪽은 x 16 에서 멈춘다. 그보다 앞은 목이 지나가는
                  자리라, 판을 세우면 목 위에 겹쳐 얹힌다.
                  가운데가 가장 크다. 셋이 같은 크기면 톱니가 되고,
                  가운데가 솟아야 등을 따라 자란 것으로 보인다.
                -->
                <g class="plates" :fill="stage.veg2">
                  <path d="M-24 -55.1 L-17 -70 L-13 -60.2 Q-18.5 -58.5 -24 -55.1 Z" />
                  <path d="M-9 -61.3 L-2 -79 L2 -62.7 Q-3.5 -62.7 -9 -61.3 Z" />
                  <path d="M6 -62.6 L12 -73 L16 -60.7 Q11 -62.2 6 -62.6 Z" />
                </g>
                <!--
                  시안선은 드러난 두 변에만 긋는다.
                  삼각형을 통째로 두르면 밑변의 선이 등을 가로질러서,
                  등에서 자란 판이 아니라 등에 얹어 붙인 조각으로 보인다.
                  판이 등에 닿는 자리에는 선이 없어야 한다.
                -->
                <g
                  class="plateline"
                  fill="none"
                  :stroke="stage.accent"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M-24 -55.1 L-17 -70 L-13 -60.2" />
                  <path d="M-9 -61.3 L-2 -79 L2 -62.7" />
                  <path d="M6 -62.6 L12 -73 L16 -60.7" />
                </g>
              </g>
            </g>

            <!-- 따라가는 아기 둘. 어미보다 반 박자 빠르게 종종거린다 -->
            <!--
            따라가는 아기 둘. 어미와 같은 방식으로 실루엣에만 선을 두른다.
            어미만 매끈하고 아기는 조각조각이면 같은 종으로 안 보인다.
          -->
            <g
              v-for="t in [
                { x: -104, y: 4, sc: 0.9, step: 0.5 },
                { x: -150, y: 2, sc: 0.74, step: 0.42 },
              ]"
              :key="`tot${t.x}`"
              class="tot"
              :style="{ '--step': `${t.step}s`, '--ink': stage.ink }"
              :transform="`translate(${t.x} ${t.y}) scale(${t.sc})`"
            >
              <g v-for="pass in ['edge', 'fill']" :key="pass" :class="pass">
                <!--
                  아기.

                  전에는 몸통 하나에 눈만 찍혀 있어서 덩어리로 보였다.
                  다리를 선으로 그린 것도 문제였다 — edge 겹의 굵은 선이
                  가느다란 선을 통째로 삼켜서 다리가 사라졌다.
                  작은 것에 붙일 선은 선이 아니라 면이어야 한다.

                  어미와 같은 짜임으로 만든다. 꼬리 · 다리 · 몸 · 목 · 머리.
                -->
                <path
                  :fill="stage.motifColor"
                  d="M-7 0 C-12 -1 -16 -4 -19 -8 C-14 -7 -10 -5 -7 -3 Z"
                />
                <path class="leg a" :fill="stage.veg" d="M-3.4 1 h3.2 v7.4 h-3.2 z" />
                <path class="leg b" :fill="stage.veg" d="M2 1 h3.2 v7.4 h-3.2 z" />
                <path
                  :fill="stage.motifColor"
                  d="M-8 -1 C-8 -7 -3 -10 3 -10 C9.5 -10 12.5 -6.5 12.5 -2 C12.5 3 8.5 5.5 2 5.5 C-4 5.5 -8 3.5 -8 -1 Z"
                />
                <path
                  :fill="stage.motifColor"
                  d="M8 -6 C9 -12 12 -16 16 -17.5 L21 -13 C17.5 -11 14 -8 12.5 -4 Z"
                />
                <path
                  :fill="stage.motifColor"
                  d="M16 -19 C18 -24 24 -25 27.5 -22 C30.5 -19.5 30 -15 26.5 -13.5 C23 -12 18.5 -13.5 17 -16 Z"
                />
                <g class="plates" :fill="stage.veg2" :stroke="stage.accent" stroke-width="0.8">
                  <path d="M-4.4 -7.4 l2 -3.8 l2 3.8 z" />
                  <path d="M0.6 -9.4 l2 -3.8 l2 3.8 z" />
                </g>
                <!--
                  얼굴.

                  전에는 흰자 반지름이 2.6 이었다. 아기가 0.74~0.9 로 줄어
                  화면에서는 2px 도 안 됐고, 코와 입은 아예 없었다.
                  머리가 있는데 얼굴이 없으니 초록 덩어리로 보였다.

                  키워도(흰자 3.6) 화면에서는 여전히 눈이 없었다. 재어 보니
                  흰자 지름이 6px, 그 안의 동공이 3px, 남는 흰 테는 1px 였다.
                  1px 짜리 흰 테는 안티에일리어싱에 먹혀서 초록 몸에 섞이고,
                  남는 것은 초록 위의 흐린 점 하나다. 어미의 눈이 보이는 건
                  같은 짜임이 12px 로 그려지기 때문이지 짜임이 좋아서가 아니다.

                  흰자 · 동공 · 반짝임 세 겹을 5px 안에 넣는 것이 애초에
                  무리였다. 그래서 겹을 버리고 점 하나로 찍는다.
                  초록 몸 위의 잉크색 원 하나는 4px 에서도 확실히 읽힌다.
                  작은 것에는 구조가 아니라 대비가 필요하다.

                  어미는 12px 라 흰자와 동공을 그대로 둔다. 짜임이 달라도
                  둘 다 '눈이 있는 얼굴' 로 읽히면 같은 종으로 보인다.
                -->
                <g class="face">
                  <circle :fill="stage.ink" cx="23.6" cy="-19.6" r="2.8" />
                  <!--
                    안광. 검은 점만 있으면 눈이 아니라 구멍이다.
                    점 안쪽 위에 흰 점을 하나 얹으면 그제야 젖은 눈이 된다.

                    크기는 눈의 절반 가까이 준다(2.8 대 1.25). 처음에 0.9 로
                    넣었더니 화면에서 0.8px, 즉 한 픽셀도 안 되어 아예
                    없는 것과 같았다. 작은 것에 얹는 점은 '비율로 작게' 가
                    아니라 '화면에서 두 픽셀은 되게' 로 정해야 한다.
                    눈이 4~5px 인 이상 안광이 눈의 절반이어도 크지 않다.
                  -->
                  <circle fill="#ffffff" cx="24.55" cy="-20.55" r="1.25" />
                  <!-- 코. 주둥이 끝 안쪽 -->
                  <circle :fill="stage.ink" cx="29.2" cy="-18.4" r="0.85" />
                  <!-- 입 -->
                  <path
                    :stroke="stage.ink"
                    stroke-width="0.9"
                    fill="none"
                    stroke-linecap="round"
                    d="M29.6 -15.6 C27.6 -13.8 24.6 -13.6 22.6 -14.6"
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>

      <!--
      ⑮''' 토성.

      참조한 표지 우하단에 작은 토성 아이콘이 하나 있다.
      공룡과 아무 상관이 없는데 거기 있고, 그 뜬금없음이 이 표지를
      어린이 스티커북처럼 보이게 하는 데 한몫한다. 그대로 둔다.

      좌하단 라벨과 우하단 서명이 쓰는 자리를 피해 조금 위에 앉힌다.
    -->
      <g v-if="stage.saturn" class="saturn">
        <circle
          :fill="stage.accent"
          :stroke="stage.ink"
          stroke-width="1.6"
          cx="742"
          cy="52"
          r="11"
        />
        <ellipse
          :stroke="stage.ink"
          stroke-width="1.6"
          fill="none"
          cx="742"
          cy="52"
          rx="19"
          ry="5.4"
          transform="rotate(-18 742 52)"
        />
        <circle :fill="stage.sky" stroke="none" cx="738" cy="48" r="2.6" opacity="0.7" />
      </g>

      <!-- ⑯ 비네트 -->
      <rect x="0" y="0" width="800" height="260" :fill="`url(#vig-${uid})`" class="vig" />

      <!-- ⑰ 결 -->
      <rect class="grain" x="0" y="0" width="800" height="260" :filter="`url(#grain-${uid})`" />
    </g>

    <!--
      ⑱ 나비.

      모티프보다 앞에 둔다. 꽃에 앉는 게 이 나비가 하는 일인데
      뒤에 두면 앉는 순간 꽃에 가려 사라진다.

      겹을 넷으로 나눠 감쌌다. 자리 · 경로 · 향한 쪽 · 날갯짓.
      한 요소에 다 걸면 transform 끼리 덮어써서 마지막 하나만 남는다.

      나는 날개와 앉은 날개를 따로 그려 두고 서로 바꿔 켠다.
      CSS 로는 도는 중에 박자를 바꿀 수 없어서, 한 벌로는 앉아서도
      나는 속도로 파닥이게 된다. 앉은 나비는 천천히 여닫아야 한다.
    -->
    <!--
      ⑱ 나비.

      모티프보다 앞에 둔다. 꽃에 앉는 게 이 나비가 하는 일인데
      뒤에 두면 앉는 순간 꽃에 가려 사라진다.

      자리 · 방향 · 크기 · 두 날개의 폭을 매 프레임 계산해서 그대로 쓴다.
      CSS 로 눌렀다 폈다 하던 것을 전부 걷어냈다 — 각도에 따라 달라지는
      모습을 한 각도로 그려 놓고 변형해서는 만들 수 없기 때문이다.

      먼 날개 · 몸통 · 가까운 날개 순으로 그린다. 우리가 보는 쪽이
      한쪽으로 정해져 있어서 이 순서는 뒤바뀌지 않는다.
    -->
    <!--
      ⑰' 꽃잎비.

      가지보다 앞에 둔다. 가지에서 떨어지는 것인데 뒤에 두면
      가지에 가려 나오다 말고 사라진다.

      떠다니는 것(⑮)과 겹은 다르다. 그쪽은 늘 몇 장이 떠 있는
      잔잔한 흩날림이고, 이쪽은 바람이 지나갈 때만 우수수 쏟아진다.
    -->
    <g v-if="stage.petalRain" class="petalrain">
      <!-- 후광은 전부 꽃잎 뒤에 깔린다. 한 장씩 짝지어 두면 앞뒤가 엇갈린다 -->
      <g :fill="`url(#petalglow-${uid})`">
        <circle
          v-for="p in petalState"
          :key="`ph${p.id}`"
          :cx="p.x"
          :cy="p.y"
          :r="p.hr"
          :opacity="p.h"
        />
      </g>
      <path
        v-for="p in petalState"
        :key="p.id"
        :d="PETAL_PATH"
        :fill="p.c"
        :opacity="p.o"
        :transform="`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.kx * p.sc} ${p.sc})`"
      />
    </g>

    <g v-if="stage.butterflies" class="flutter">
      <g
        v-for="b in bfState"
        :key="b.id"
        :transform="`translate(${b.x} ${b.y}) rotate(${b.rot}) scale(${b.sc})`"
        :opacity="b.op"
      >
        <g :transform="`scale(${b.kFar} 1)`">
          <path :d="BF_HIND" :fill="stage.wingFar" />
          <path :d="BF_FORE" :fill="stage.wingHind" />
          <path :d="BF_TIP" :fill="stage.accent" opacity="0.32" />
        </g>

        <g :fill="stage.accent">
          <path :d="BF_BODY" />
          <ellipse cx="0" cy="-4.2" rx="1.9" ry="2.5" />
          <circle cx="0" cy="-7.4" r="1.6" />
          <circle cx="-5.3" cy="-14.4" r="0.8" />
          <circle cx="5.3" cy="-14.4" r="0.8" />
        </g>
        <!--
          더듬이.

          길게 곧추세웠더니 안테나가 됐다. 나비의 더듬이는 짧고 바깥으로
          휘며 끝이 방망이처럼 부푼다. 그 끝의 작은 알이 곤충 중에서도
          나비를 가리키는 표시다.
        -->
        <path
          d="M-.7-8.2C-2-10.4-3.4-12.2-4.9-13.6M.7-8.2C2-10.4 3.4-12.2 4.9-13.6"
          fill="none"
          :stroke="stage.accent"
          stroke-width="0.62"
          stroke-linecap="round"
        />

        <g :transform="`scale(${b.kNear} 1)`">
          <path :d="BF_HIND" :fill="stage.motifColor" />
          <path :d="BF_FORE" :fill="stage.wing" />
          <path :d="BF_TIP" :fill="stage.accent" opacity="0.42" />
          <circle cx="12.5" cy="-6.4" r="1.5" :fill="stage.accent" opacity="0.38" />
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/* ── 모티프 ── */
.scene.engraved .motif {
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/*
 * 일러스트형도 선은 그린다.
 * 처음에 stroke-width 를 0 으로 뒀더니 나무의 줄기와 가지가 통째로 사라지고
 * 캐노피만 초록 공으로 떠 있었다. 면으로 그린 부분과 선으로 그린 부분이
 * 한 모티프 안에 섞여 있다는 걸 놓쳤다.
 */
.scene.illustrated .motif {
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.motif {
  opacity: 0;
  transition: opacity var(--dur-enter) var(--ease-out);
}
.scene.open .motif {
  opacity: 0.9;
  transition-delay: 90ms;
}
.dim {
  opacity: 0.5;
}
/* 사랑 — 무광 바탕에 유광 인쇄. 각도를 틀어야 무늬가 보인다 */
.gloss {
  opacity: 0.3;
  stroke-width: 2.2;
}
/* 대폭발 — 레코드판 홈처럼 눌린 동심원 */
.groove {
  opacity: 0.22;
  stroke-width: 1;
  fill: none;
}
.collage {
  opacity: 0.55;
}

/*
 * ── 빛줄기 ──
 * 구름 사이로 내리는 빛. 아주 옅게 깔고 천천히 밝기가 흔들린다.
 * 진하게 두면 빛이 아니라 흰 삼각형으로 보인다.
 */
.rays {
  opacity: 0.11;
  mix-blend-mode: screen;
  animation: breathe 11s ease-in-out infinite;
}
@keyframes breathe {
  50% {
    opacity: 0.19;
  }
}

/* ── 구름 ── */
.cloud {
  transform: translateX(var(--x));
  animation: sail var(--dur) linear infinite;
}
@keyframes sail {
  to {
    transform: translateX(calc(var(--x) + 980px));
  }
}

/* ── 새 떼 ── */
.flock {
  fill: none;
  stroke-width: 1.4;
  stroke-linecap: round;
  opacity: 0.5;
  transform: translate(-120px, 52px);
  animation: fly 74s linear infinite;
}
@keyframes fly {
  to {
    transform: translate(880px, 24px);
  }
}

/* 안개 띠는 아주 느리게 숨 쉰다 */
.mist {
  animation: breathe 17s ease-in-out infinite;
}

/*
 * ── 꽃 ──
 * 줄기 끝을 잡고 흔든다. 밑동이 아니라 위쪽만 움직여야 자라 있는 것처럼 보인다.
 */
.bloom {
  transform-origin: center bottom;
  transform-box: fill-box;
  animation: nod var(--sway) ease-in-out infinite alternate;
}
@keyframes nod {
  to {
    transform: rotate(4deg);
  }
}

/* ── 전경 풀 ── */
.grass path {
  fill: none;
  stroke-width: 2.2;
  stroke-linecap: round;
  opacity: 0.95;
  transform-origin: center bottom;
  transform-box: fill-box;
  animation: bend var(--sway) ease-in-out var(--delay) infinite alternate;
}
@keyframes bend {
  to {
    transform: rotate(6deg) scaleY(0.97);
  }
}

/*
 * ── 떠다니는 것 ──
 * 홀씨는 위로 오르고, 눈은 내려오고, 별은 제자리에서 깜빡인다.
 */
.motes circle {
  opacity: 0;
  animation: float var(--dur) linear var(--delay) infinite;
}
@keyframes float {
  10% {
    opacity: 0.65;
  }
  90% {
    opacity: 0.35;
  }
  100% {
    transform: translate(var(--drift), -70px);
    opacity: 0;
  }
}
.motes.snow circle {
  animation-name: fall;
}
@keyframes fall {
  10% {
    opacity: 0.9;
  }
  100% {
    transform: translate(var(--drift), 110px);
    opacity: 0;
  }
}
.motes.star circle {
  animation-name: twinkle;
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.95;
  }
}
.motes.dust circle {
  opacity: 0.3;
}
/* ── 나비 ─────────────────────────────────────────
 *
 * 움직임은 전부 계산해서 그리므로 여기에는 없다.
 * 남은 건 언제 보이느냐 하나다 — 모티프와 같은 규칙으로,
 * 펼쳤을 때만 나온다. 접힌 띠는 지면 쪽만 보이는데 거기서
 * 나비가 파닥이고 있으면 판정을 읽으러 온 사람에게는 방해다.
 */
/*
 * 꽃잎비도 펼쳤을 때만.
 *
 * 접으면 셈을 멈추므로 그대로 두면 꽃잎이 허공에 얼어붙은 채로
 * 띠에 남는다. 떨어지다 만 꽃잎만큼 어색한 것이 없다.
 */
.petalrain,
.flutter {
  opacity: 0;
  transition: opacity var(--dur-enter) var(--ease-out);
}
.scene.open .petalrain,
.scene.open .flutter {
  opacity: 0.96;
  transition-delay: 120ms;
}

/* 기포는 위로만 간다. 물속에서 아래로 떠다니는 것은 없다 */
.motes.bubble circle {
  animation-name: rise;
  fill: none;
  stroke: currentColor;
  stroke-width: 0.8;
}

/* 꽃잎과 낙엽은 눈처럼 내려온다. 무거워서가 아니라 떨어져 나온 것이라서다 */
.motes.petal circle,
.motes.leaf circle {
  animation-name: fall;
}
/* 불티는 올라간다. 터진 자리에서 흩어져 식으며 사라진다 */
.motes.spark circle {
  animation-name: rise;
}

/* ── 바닷가 ───────────────────────────────────────── */

/*
 * 파도.
 *
 * 밀려오면서 굵어지고 진해지다가 물가에서 스러진다.
 * 부서지는 게 아니라 얇아지며 사라진다 — 실제로 잔파도는 그렇다.
 * 저마다 다른 박자라야 바다가 숨 쉬는 것으로 보인다.
 * 다 같이 밀려오면 그건 파도가 아니라 줄무늬다.
 */
.surf path {
  opacity: 0;
  animation: roll var(--dur) ease-out var(--delay) infinite;
}
@keyframes roll {
  0% {
    opacity: 0;
    transform: translateY(-10px) scaleX(0.96);
  }
  18% {
    opacity: calc(var(--o) * 0.7);
  }
  62% {
    opacity: var(--o);
    transform: translateY(6px) scaleX(1);
  }
  100% {
    opacity: 0;
    transform: translateY(15px) scaleX(1.04);
  }
}

/*
 * 나는 갈매기.
 * 가로로 지나가면서 오르내리고, 그러면서 날개를 접었다 편다.
 * 셋이 따로 놀아야 한 마리가 제 뜻대로 나는 것으로 보인다.
 */
/*
 * 방향은 되감기로 뒤집는다.
 *
 * 처음에는 시작점과 끝점에 --dir 을 곱했다. 그랬더니 반대로 나는
 * 갈매기는 +120 에서 시작해 -920 으로 가서, 한 바퀴의 대부분을
 * 화면 밖에서 보냈다. 넷 중 둘이 사실상 없는 셈이었다.
 *
 * 궤도는 하나로 두고 재생만 거꾸로 돌린다. 몸은 scaleX 로 뒤집어
 * 가는 쪽을 보게 한다.
 */
.gull {
  animation:
    glide var(--dur) linear var(--delay) infinite,
    lift calc(var(--dur) / 7) ease-in-out var(--delay) infinite alternate;
}
.gull.back {
  animation-direction: reverse, alternate;
}
.gull .wing {
  animation: flap 1.15s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}
@keyframes glide {
  from {
    transform: translateX(-120px);
  }
  to {
    transform: translateX(920px);
  }
}
@keyframes lift {
  from {
    translate: 0 calc(var(--rise) * -0.5);
  }
  to {
    translate: 0 calc(var(--rise) * 0.5);
  }
}
@keyframes flap {
  0%,
  100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.4);
  }
}

/*
 * 돌고래.
 *
 * 한 번 뛰는 데 전체의 십 분의 일도 안 쓴다. 자주 뛰면 놀랍지 않다.
 *
 * 포물선은 각도로 만든다. 솟을 때 주둥이가 하늘을 보고, 꼭대기에서
 * 수평이 되었다가, 내려올 때 주둥이가 물을 향한다.
 * 각도 없이 위아래로만 움직이면 뛰는 게 아니라 떠오르는 것이 된다.
 *
 * 몸과 물보라는 같은 시계를 쓰되 서로 다른 순간에 나타난다.
 * 물보라는 물을 뚫는 두 순간 — 나올 때와 들어갈 때 — 에만 있다.
 * 공중에 떠 있는 동안에도 물이 튀면 물이 따라 올라간 꼴이 된다.
 */
.dolphin .body {
  animation: leap var(--dur) ease-in-out var(--delay) infinite;
  transform-box: view-box;
}
.dolphin .splash {
  animation: burst var(--dur) linear var(--delay) infinite;
  transform-box: view-box;
}
@keyframes leap {
  0%,
  84%,
  100% {
    translate: 0 18px;
    rotate: 0deg;
    opacity: 0;
  }
  86% {
    translate: 0 6px;
    rotate: -34deg;
    opacity: 1;
  }
  89% {
    translate: 6px -10px;
    rotate: -18deg;
    opacity: 1;
  }
  92% {
    translate: 12px -17px;
    rotate: 2deg;
    opacity: 1;
  }
  95% {
    translate: 18px -10px;
    rotate: 24deg;
    opacity: 1;
  }
  97.5% {
    translate: 22px 6px;
    rotate: 42deg;
    opacity: 1;
  }
  99% {
    translate: 24px 16px;
    rotate: 48deg;
    opacity: 0;
  }
}
@keyframes burst {
  0%,
  83%,
  100% {
    opacity: 0;
    scale: 0.6 0.4;
  }
  85.5% {
    opacity: 0.85;
    scale: 1 1;
  }
  88% {
    opacity: 0;
    scale: 1.25 1.15;
  }
  96.5% {
    opacity: 0;
    scale: 0.6 0.4;
    translate: 22px 0;
  }
  98% {
    opacity: 0.85;
    scale: 1 1;
    translate: 22px 0;
  }
  100% {
    opacity: 0;
    scale: 1.3 1.2;
    translate: 22px 0;
  }
}

/* ── 공룡 판 ─────────────────────────────────────── */

/* 화산 연기. 오르면서 퍼지고 옅어진다 */
.fume {
  animation: fume var(--dur) linear var(--delay) infinite;
}
@keyframes fume {
  0% {
    opacity: 0;
    transform: translateY(6px) scale(0.7);
  }
  20% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translateY(-46px) scale(1.5);
  }
}

/*
 * 분화구가 달아오르는 것.
 * 늘 조금씩 밝아졌다 사그라든다. 터지지 않는 동안에도 아래에서
 * 무언가 끓고 있다는 표시라, 이게 있어야 산이 살아 있는 산이 된다.
 */
/*
 * 분화구가 달아오르는 것.
 *
 * scaleY 로 부풀렸더니 원반이 분화구를 벗어나 위아래로 떠다녔다.
 * SVG 요소의 transform-box 기본값이 view-box 라, 축이 제 도형이 아니라
 * 화폭 한가운데(400, 130)였다. 화폭 중심 기준으로 세로를 늘리니
 * 산꼭대기에 있던 것이 아래로 밀려난 것이다.
 *
 * 크기는 건드리지 않고 밝기만 오르내리게 한다. 분화구 안의 불은
 * 커졌다 작아지는 것이 아니라 밝아졌다 어두워지는 것이다.
 */
.ember {
  transform-box: fill-box;
  transform-origin: center;
  animation: simmer var(--dur) ease-in-out var(--delay) infinite;
}
@keyframes simmer {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.85;
  }
}

/*
 * 분출.
 *
 * 한 바퀴의 90% 는 아무 일도 없다. 자주 터지면 놀랍지 않을뿐더러
 * 이 판이 조용히 지나가는 배경이 아니게 된다.
 *
 * 터질 때는 세 가지가 조금씩 어긋난 박자로 온다 —
 * 분화구가 번쩍하고, 용암이 튀어 오르고, 재가 크게 부푼다.
 * 동시에 나타났다 사라지면 그건 터지는 게 아니라 깜빡임이다.
 */
.blast .flare {
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: flare var(--dur) ease-out var(--delay) infinite;
}
.blast .lava circle {
  opacity: 0;
  animation: fling var(--dur) ease-out calc(var(--delay) + var(--ld) * 1s) infinite;
}
.blast .ash {
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: ash var(--dur) ease-out var(--delay) infinite;
}
@keyframes flare {
  0%,
  90%,
  100% {
    opacity: 0;
    transform: scaleY(0.4);
  }
  91.5% {
    opacity: 0.95;
    transform: scaleY(2.6);
  }
  94% {
    opacity: 0;
    transform: scaleY(1);
  }
}
@keyframes fling {
  0%,
  91%,
  100% {
    opacity: 0;
    transform: translate(0, 0);
  }
  92% {
    opacity: 1;
    transform: translate(calc(var(--dx) * 0.4), calc(var(--dy) * 0.7));
  }
  95% {
    opacity: 1;
    transform: translate(var(--dx), var(--dy));
  }
  98% {
    opacity: 0;
    transform: translate(calc(var(--dx) * 1.3), 10px);
  }
}
@keyframes ash {
  0%,
  91%,
  100% {
    opacity: 0;
    transform: translateY(8px) scale(0.4);
  }
  93% {
    opacity: 0.85;
    transform: translateY(-4px) scale(0.9);
  }
  100% {
    opacity: 0;
    transform: translateY(-54px) scale(1.9);
  }
}

/*
 * 익룡.
 * 갈매기보다 훨씬 느리게 난다. 날개가 길어서 한 번 젓는 데도 오래 걸린다.
 */
.ptero {
  animation:
    soar var(--dur) linear var(--delay) infinite,
    lift calc(var(--dur) / 6) ease-in-out var(--delay) infinite alternate;
}
.ptero.back {
  animation-direction: reverse, alternate;
}
.ptero .wings {
  animation: beat 2.1s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}
@keyframes soar {
  from {
    transform: translateX(-140px);
  }
  to {
    transform: translateX(940px);
  }
}
@keyframes beat {
  0%,
  100% {
    transform: scaleY(1) translateY(0);
  }
  50% {
    transform: scaleY(0.35) translateY(1.5px);
  }
}

/* 소철과 고사리. 바람에 아주 천천히 눕는다 */
/*
 * 심긴 것들은 뿌리를 축으로 흔들린다.
 *
 * 뿌리 자리(0,0)를 축으로 삼는다. fill-box 의 가운데 아래를 쓰면
 * 잎이 넓은 것일수록 축이 잎 쪽으로 끌려가서, 뿌리가 좌우로 미끄러진다 —
 * 살랑거리는 게 아니라 떠다니게 된다.
 */
.plant {
  transform-box: view-box;
  /*
   * 축을 뿌리 자리에 못 박는다.
   *
   * view-box 로 두고 축을 비워 두면 기본값이 화폭 한가운데(400, 130)라,
   * 식물이 제자리에서 흔들리는 게 아니라 화폭 중심을 도는 궤도를 그린다.
   * fill-box 의 '가운데 아래' 도 안 된다 — 잎이 넓은 것일수록 축이
   * 잎 쪽으로 끌려가서 뿌리가 좌우로 미끄러진다.
   *
   * 심은 자리를 그대로 축으로 준다.
   */
  transform-origin: var(--ox) var(--oy);
  animation: frond var(--sway) ease-in-out var(--delay) infinite alternate;
}
/* 그림자는 땅에 붙어 있어야 하므로 같이 흔들리지 않는다 */
.plant .root {
  animation: none;
}

/* 소철과 고사리도 같은 방식. 심은 자리가 축이다 */
.cycad,
.fern {
  transform-box: view-box;
  transform-origin: var(--ox) var(--oy);
  animation: frond var(--sway) ease-in-out var(--delay) infinite alternate;
}
@keyframes frond {
  from {
    rotate: -2.5deg;
  }
  to {
    rotate: 2.5deg;
  }
}

/*
 * 알 하나만 아주 가끔 흔들린다.
 * 한 바퀴의 대부분은 가만히 있다. 계속 흔들리면 안에 있는 것이
 * 나오려는 게 아니라 그냥 흔들리는 알이 된다.
 */
.nest .hatching {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: stir 9s ease-in-out infinite;
}
@keyframes stir {
  0%,
  72%,
  100% {
    rotate: 0deg;
  }
  76% {
    rotate: -7deg;
  }
  80% {
    rotate: 6deg;
  }
  84% {
    rotate: -4deg;
  }
  88% {
    rotate: 2deg;
  }
}

/*
 * 공룡 무리.
 *
 * 판 하나 건너는 데 이 분 반. 빨리 가면 지나가는 것이 되고,
 * 지나가는 것은 배경이 아니라 사건이다.
 * 끝까지 가면 반대쪽에서 다시 들어온다 — 한 무리가 계속 도는 셈인데,
 * 이 분 반이면 같은 무리가 두 번 지나가는 걸 알아채기 어렵다.
 */
.herd .pace {
  /*
   * 음수 지연으로 중간부터 시작한다.
   * 0 초부터 돌리면 무리가 화면 밖 왼쪽에서 출발해서, 판을 처음 열었을 때
   * 이십 초 넘게 아무도 없는 벌판만 보인다.
   */
  animation: trek 150s linear -46s infinite;
}
@keyframes trek {
  from {
    transform: translateX(-190px);
  }
  to {
    transform: translateX(990px);
  }
}

/*
 * 실루엣에만 선을 두른다.
 *
 * edge 겹은 모든 부위를 외곽색으로 채우고 굵게 두른다. 부위끼리
 * 겹친 자리가 하나로 뭉쳐 한 덩이 실루엣이 된다.
 * fill 겹은 같은 부위를 제 색으로 덮는다. 선은 없다.
 * 그러면 바깥에는 선이 남고 안쪽에는 남지 않는다.
 *
 * 두 겹은 같은 클래스를 달고 있어서 걸음 애니메이션도 똑같이 받는다.
 * 따로 맞출 필요가 없다.
 */
.bigdino .edge :is(path, circle, ellipse) {
  fill: var(--ink);
  stroke: var(--ink);
  stroke-width: 5.4;
  stroke-linejoin: round;
  stroke-linecap: round;
}
/* 얼굴은 실루엣에 아무것도 더하지 않는다. edge 에서는 없는 셈 친다 */
.bigdino .edge .face,
.tot .edge .face {
  display: none;
}

/* 아기도 같은 방식. 몸이 작으니 테두리도 얇다 */
.tot .edge :is(path, circle) {
  fill: var(--ink);
  stroke: var(--ink);
  stroke-width: 2.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}

/*
 * 다른 공룡들.
 * 걷지 않는다. 고개만 아주 느리게 들었다 내린다 —
 * 풀을 뜯다가 한 번씩 주위를 살피는 몸짓이다.
 */
.other .edge :is(path, circle) {
  fill: var(--ink);
  stroke: var(--ink);
  stroke-width: 3;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.other .edge .face {
  display: none;
}
/*
 * 다른 공룡들은 서 있는다.
 *
 * 좁게 오가게 해 봤는데, 좌우로 왕복하면서 몸은 뒤집히지 않으니
 * 절반은 뒤로 걷는 꼴이었다. 방향을 뒤집으면 무리처럼 부산해지고,
 * 안 뒤집으면 뒷걸음이다. 걷는 것은 주인공 무리 하나로 족하다.
 *
 * 서서 할 수 있는 것만 시킨다.
 *   풀 뜯기   고개를 깊이 내려 한참 머물다 든다. 내리는 시간이 길어야
 *             먹고 있는 것으로 보인다 — 까딱거리면 조는 것이다
 *   꼬리      느리게 좌우로. 살아 있다는 표시다
 *   숨        몸이 아주 조금 부풀었다 꺼진다
 *
 * 셋의 주기를 다 다르게 둔다. 한 박자로 움직이면 인형 셋이 된다.
 */
.other .head {
  transform-box: fill-box;
  transform-origin: left bottom;
  animation: graze var(--bob) ease-in-out var(--delay) infinite;
}
.other .tail {
  transform-box: fill-box;
  transform-origin: right center;
  animation: swish var(--tail) ease-in-out infinite;
}
.other {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: breathe2 var(--breath) ease-in-out infinite;
}
@keyframes graze {
  0%,
  100% {
    rotate: 0deg;
  }
  14% {
    rotate: 26deg;
  }
  54% {
    rotate: 26deg;
  }
  68% {
    rotate: -6deg;
  }
  82% {
    rotate: -2deg;
  }
}
@keyframes swish {
  0%,
  100% {
    rotate: -5deg;
  }
  50% {
    rotate: 5deg;
  }
}
@keyframes breathe2 {
  0%,
  100% {
    scale: 1 1;
  }
  50% {
    scale: 1.012 0.99;
  }
}

/*
 * 어미의 걸음.
 *
 * 다리 둘이 번갈아 앞뒤로 흔들리고, 그에 맞춰 몸이 아주 조금 오르내린다.
 * 꼬리는 다리와 반대로 흔들린다 — 그래야 균형을 잡는 것으로 보인다.
 * 목은 한 박자 늦게 따라온다. 큰 짐승은 목이 몸을 따라 흔들린다.
 */
.bigdino .leg {
  transform-box: fill-box;
  transform-origin: top center;
}
.bigdino .leg.back {
  animation: stride 2.4s ease-in-out infinite;
}
.bigdino .leg.fore {
  animation: stride 2.4s ease-in-out -1.2s infinite;
}
.bigdino .tail {
  transform-box: fill-box;
  transform-origin: right center;
  animation: tailsway 2.4s ease-in-out -1.2s infinite;
}
.bigdino .neck {
  transform-box: fill-box;
  transform-origin: left bottom;
  animation: neckbob 2.4s ease-in-out -0.6s infinite;
}
.bigdino {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: lumber 2.4s ease-in-out infinite;
}
@keyframes stride {
  0%,
  100% {
    rotate: 13deg;
  }
  50% {
    rotate: -13deg;
  }
}
@keyframes tailsway {
  0%,
  100% {
    rotate: -4deg;
  }
  50% {
    rotate: 4deg;
  }
}
@keyframes neckbob {
  0%,
  100% {
    rotate: -1.6deg;
  }
  50% {
    rotate: 1.6deg;
  }
}
@keyframes lumber {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -2px;
  }
}

/* 따라가는 아기. 어미보다 반 박자 빠르게 종종거린다 */
.tot .leg {
  transform-origin: top center;
  transform-box: fill-box;
}
.tot .leg.a {
  animation: peg var(--step) ease-in-out infinite;
}
.tot .leg.b {
  animation: peg var(--step) ease-in-out calc(var(--step) / -2) infinite;
}
.tot {
  animation: toddle calc(var(--step) * 2) ease-in-out infinite;
}
@keyframes toddle {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -1.2px;
  }
}

/* 아기 공룡. 좁은 자리를 종종거린다 */
.hatchling {
  animation: patrol var(--dur) ease-in-out var(--delay) infinite alternate;
}
.hatchling .edge :is(path, circle) {
  fill: var(--ink);
  stroke: var(--ink);
  stroke-width: 2.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.hatchling .edge .face {
  display: none;
}
.hatchling .leg {
  transform-origin: top center;
  transform-box: fill-box;
}
.hatchling .leg.a {
  animation: peg var(--step) ease-in-out infinite;
}
.hatchling .leg.b {
  animation: peg var(--step) ease-in-out calc(var(--step) / -2) infinite;
}

/*
 * 토성은 아주 느리게 기운다. 아이콘이 살아 있다는 표시만.
 *
 * 기울기와 자리는 따로 움직인다. rotate 와 translate 는 각각 독립된
 * 속성이라 애니메이션 둘을 겹쳐도 서로를 덮어쓰지 않는다.
 */
.saturn {
  transform-box: view-box;
  transform-origin: 742px 52px;
  animation:
    tilt 14s ease-in-out infinite,
    ufo 45s cubic-bezier(0.7, 0, 0.25, 1) infinite;
}
@keyframes tilt {
  0%,
  100% {
    rotate: -3deg;
  }
  50% {
    rotate: 3deg;
  }
}

/*
 * 가끔 자리를 옮긴다.
 *
 * 한 바퀴 45초를 셋으로 나눠, 13초쯤 가만히 있다가 한 번 움직인다.
 * 처음에는 40초 중 28초를 통째로 세워 두고 마지막에 몰아서 세 번
 * 움직이게 했는데, 첫 움직임까지 28초를 기다려야 해서 판을 보는
 * 동안 한 번도 안 움직이는 일이 생겼다. 가끔이란 '보다 보면 나오는'
 * 것이지 '기다려야 나오는' 것이 아니다.
 *
 * 옮기기 전에 먼저 희미해지고 옮긴 뒤에 다시 짙어진다. 짙은 채로
 * 미끄러지면 날아가는 물체가 되지만, 사라졌다 저기서 나타나면
 * 그건 다른 것이 된다. 한 번의 이동은 0.6초 — 그보다 느리면
 * 이동이 보이고, 이 속도부터 슉 하고 건너뛴 것으로 보인다.
 *
 * 자리는 셋뿐이고 마지막에는 제자리로 돌아온다. 계속 떠돌면
 * 하늘 한구석의 아이콘이 아니라 화면을 가로지르는 것이 된다.
 * 왼쪽 위로만 다닌다 — 오른쪽 아래는 서명이 쓰는 자리다.
 */
@keyframes ufo {
  0%,
  29% {
    translate: 0 0;
    opacity: 1;
  }
  30.5% {
    translate: 0 0;
    opacity: 0.12;
  }
  31.8% {
    translate: -34px 7px;
    opacity: 0.12;
  }
  33%,
  62% {
    translate: -34px 7px;
    opacity: 1;
  }
  63.5% {
    translate: -34px 7px;
    opacity: 0.12;
  }
  64.8% {
    translate: -14px -13px;
    opacity: 0.12;
  }
  66%,
  95% {
    translate: -14px -13px;
    opacity: 1;
  }
  96.5% {
    translate: -14px -13px;
    opacity: 0.12;
  }
  97.8% {
    translate: 0 0;
    opacity: 0.12;
  }
  99%,
  100% {
    translate: 0 0;
    opacity: 1;
  }
}

/*
 * 모래를 걷는 갈매기와 꽃게.
 *
 * 둘 다 좁은 자리를 오간다. 판을 가로지르게 두면 물가를 따라
 * 산책하는 게 아니라 화면을 건너가는 것이 된다.
 */
.stroller,
.crab {
  animation: patrol var(--dur) ease-in-out var(--delay) infinite alternate;
}
@keyframes patrol {
  from {
    transform: translateX(calc(var(--span) * -0.5 * var(--dir))) scaleX(var(--dir));
  }
  to {
    transform: translateX(calc(var(--span) * 0.5 * var(--dir))) scaleX(var(--dir));
  }
}

/* 갈매기 다리는 번갈아. 종종거리는 박자가 몸보다 빨라야 걷는 것으로 보인다 */
.stroller .leg.a {
  animation: peg var(--step) ease-in-out infinite;
}
.stroller .leg.b {
  animation: peg var(--step) ease-in-out calc(var(--step) / -2) infinite;
}
@keyframes peg {
  0%,
  100% {
    transform: rotate(-13deg);
  }
  50% {
    transform: rotate(13deg);
  }
}
.stroller .leg {
  transform-origin: top center;
  transform-box: fill-box;
}

/* 꽃게는 집게발을 번갈아 든다 */
.crab .claw {
  transform-origin: center;
  transform-box: fill-box;
}
.crab .claw.one {
  animation: pinch var(--step) ease-in-out infinite;
}
.crab .claw.two {
  animation: pinch var(--step) ease-in-out calc(var(--step) / -2) infinite;
}
@keyframes pinch {
  0%,
  100% {
    transform: rotate(-9deg) translateY(0.3px);
  }
  50% {
    transform: rotate(9deg) translateY(-0.4px);
  }
}

/* 파라솔은 바람에 아주 조금 흔들린다 */
.parasol {
  animation: sunshade 6.5s ease-in-out infinite;
  transform-origin: 640px 214px;
  transform-box: view-box;
}
@keyframes sunshade {
  0%,
  100% {
    transform: rotate(-0.8deg);
  }
  50% {
    transform: rotate(0.8deg);
  }
}

/* ── 물속 ─────────────────────────────────────────── */

/*
 * 수면의 일렁임.
 * 물은 투명해서 그 자체로는 안 보이고 빛이 지나갈 때만 보인다.
 * 세로로 늘어진 빛의 결이 좌우로 아주 느리게 미끄러진다.
 */
.surface path {
  fill: none;
  stroke-width: 2.3;
  stroke-linecap: round;
  opacity: var(--o);
  animation: slide var(--dur) ease-in-out var(--delay) infinite alternate;
}
@keyframes slide {
  from {
    transform: translateX(-46px) scaleY(0.88);
  }
  to {
    transform: translateX(46px) scaleY(1.12);
  }
}

/* 물고기 떼. 한 방향으로 천천히 흐르다 판을 벗어나면 되돌아온다 */
.fish {
  animation: swimBy var(--dur) linear var(--delay) infinite;
}
.school.far .fish {
  opacity: 0.5;
}
@keyframes swimBy {
  from {
    transform: translateX(calc(-260px * var(--dir)));
  }
  to {
    transform: translateX(calc(260px * var(--dir)));
  }
}

/*
 * 해파리.
 * 갓을 오므리면 위로 밀리고, 펴면서 가라앉는다.
 * 미는 순간과 뜨는 순간을 어긋나게 둬야 헤엄치는 것으로 보인다.
 */
.jelly {
  animation: pulse var(--dur) ease-in-out var(--delay) infinite;
}
.jelly .bell {
  opacity: 0.5;
}
.jelly .arms {
  fill: none;
  stroke-width: 1.2;
  stroke-linecap: round;
  opacity: 0.45;
}
@keyframes pulse {
  0%,
  100% {
    transform: translateY(0) scale(1, 1);
  }
  22% {
    transform: translateY(calc(var(--rise) * -0.55)) scale(0.86, 1.14);
  }
  46% {
    transform: translateY(calc(var(--rise) * -1)) scale(1.1, 0.9);
  }
  75% {
    transform: translateY(calc(var(--rise) * -0.4)) scale(1, 1);
  }
}

/* 큰 해파리도 같은 박자로 숨 쉰다. 다만 훨씬 느리다 */
.bigjelly {
  animation: pulse 11s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
  --rise: 16px;
}
.bigjelly .bell {
  opacity: 0.42;
}

/* 산호 */
.corals path {
  fill: none;
  stroke-width: 3.2;
  stroke-linecap: round;
}

/* 해초. 풀보다 두껍고 두 배 느리게 눕는다 */
.kelp path {
  fill: none;
  stroke-width: calc(var(--w) * 1px);
  stroke-linecap: round;
  opacity: 0.8;
  transform-origin: center bottom;
  transform-box: fill-box;
  animation: lean var(--sway) ease-in-out var(--delay) infinite alternate;
}
/* 풀은 바람에 떨듯 흔들리지만 해초는 물에 밀려 뿌리부터 눕는다 */
@keyframes lean {
  from {
    transform: rotate(-5deg) scaleY(0.97);
  }
  to {
    transform: rotate(5deg) scaleY(1.03);
  }
}

/* 마린 스노우. 아주 느리게 내려앉는다 */
.marine circle {
  opacity: 0;
  animation: sink var(--dur) linear var(--delay) infinite;
}
@keyframes sink {
  0% {
    opacity: 0;
    transform: translateY(-40px);
  }
  10%,
  86% {
    opacity: var(--o);
  }
  100% {
    opacity: 0;
    transform: translateY(300px) translateX(var(--drift));
  }
}

/* 발광. 숨 쉬듯 밝아졌다 사그라든다 */
.glows circle {
  animation: bio var(--dur) ease-in-out var(--delay) infinite;
}
@keyframes bio {
  0%,
  100% {
    opacity: 0.12;
    transform: scale(0.7);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.25);
  }
}

@keyframes rise {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  12% {
    opacity: 0.55;
  }
  88% {
    opacity: 0.4;
  }
  100% {
    opacity: 0;
    transform: translateY(-180px) translateX(var(--drift));
  }
}

.vig {
  pointer-events: none;
}
/* 결. 아주 옅게만 얹는다. 진하면 그림이 지저분해진다 */
.grain {
  opacity: 0.055;
  mix-blend-mode: multiply;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .rays,
  .cloud,
  .flock,
  .mist,
  .bloom,
  .grass path,
  .motes circle,
  /* 튀는 움직임이라 여기서 가장 먼저 꺼야 하는 것 */
  .saturn {
    animation: none;
  }
  .motes circle {
    opacity: 0.4;
  }
}
</style>
