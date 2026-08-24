/*
 * 하늘 한 장.
 *
 * 그림 전체를 프래그먼트 셰이더 하나로 그린다.
 * 화면을 덮는 사각형 하나를 세우고, 픽셀마다 "여기는 무슨 색인가" 를 계산한다.
 *
 * ── 왜 라이브러리를 안 썼나 ─────────────────────────
 * three.js 는 600KB 가 넘는다. 우리가 쓰는 건 화면 덮는 사각형 하나와
 * 셰이더 하나뿐이라, 씬 그래프도 카메라도 지오메트리도 필요가 없다.
 * WebGL 을 직접 부르면 이 파일과 SkyCanvas.vue 두 개로 끝난다.
 *
 * ── 왜 프리셋을 셰이더 안에 안 넣었나 ────────────────
 * 배경을 여러 가지로 고르게 하려면 보통 셰이더에 if 를 늘어놓는데,
 * 그러면 고르지도 않은 하늘의 계산까지 픽셀마다 따라다닌다.
 * 여기서는 색과 세기를 전부 uniform 으로 뺐다.
 * 프리셋은 그냥 숫자 묶음(아래 SKY_PRESETS)이라 새로 만드는 데 드는 값이 없다.
 * 사용자가 손잡이를 돌려 만든 하늘도 프리셋과 똑같은 모양의 숫자 묶음이다.
 */

export const VERTEX_SRC = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

export const FRAGMENT_SRC = `
precision highp float;

varying vec2 vUv;

uniform vec2  uRes;
uniform float uTime;
uniform float uSpeed;      // 움직임 빠르기 손잡이
uniform float uIntensity;  // 전체 세기 손잡이

uniform vec3  uSkyTop;     // 천정
uniform vec3  uSkyMid;     // 중간
uniform vec3  uSkyBot;     // 지평
uniform vec3  uSunCol;     // 해·달 빛
uniform vec3  uCloudLit;   // 구름 밝은 면
uniform vec3  uCloudDark;  // 구름 그늘

uniform vec2  uSun;        // 해가 있는 자리 (0..1 화면 좌표)
uniform float uNight;      // 0 낮 .. 1 밤
uniform float uMoon;       // 1 이면 해 대신 달
uniform float uCloud;      // 구름이 덮은 정도 0..1
uniform float uRain;       // 비 0..1
uniform float uSnow;       // 눈 0..1
uniform float uWind;       // 바람 0..1
uniform float uAurora;     // 대기광 0..1
uniform float uStars;      // 별 0..1
uniform float uHaze;       // 지평선 안개 0..1
uniform float uGrain;      // 필름 결 0..1
uniform float uOrb;        // 해·달 알맹이가 보이는 정도 0..1
uniform float uGlow;       // 노을빛이 남은 정도 0..1
uniform float uIllum;      // 달의 밝은 면 비율 0 삭 .. 1 보름
uniform float uWaxing;     // -1 차는달 / +1 기우는달
uniform float uScroll;     // 페이지를 내린 정도 0..1

// ── 잡음 ───────────────────────────────────────────
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise21(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 6; i++) {
    v += amp * noise21(p);
    p = p * 2.03 + vec2(11.3, 7.7);
    amp *= 0.5;
  }
  return v;
}

/*
 * 구름 한 겹.
 *
 * 잡음을 그대로 쓰면 안개처럼 흐리기만 하다.
 * 잡음으로 좌표를 한 번 밀어 준 다음(도메인 워프) 다시 잡음을 얹으면
 * 뭉치고 갈라지는 결이 생겨서 비로소 구름처럼 보인다.
 */
float clouds(vec2 p, float cover, float t) {
  vec2 warp = vec2(fbm(p * 0.6 + t * 0.06), fbm(p * 0.6 + 17.1 - t * 0.05));
  float n = fbm(p + warp * 2.1);
  // cover 가 0 이면 아무것도, 1 이면 하늘을 덮는다
  float edge = mix(0.78, 0.20, cover);
  return smoothstep(edge, edge + 0.30, n);
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  float t = uTime * uSpeed;

  // ── 바탕 하늘 ────────────────────────────────────
  // 위에서 아래로 세 색을 잇는다. 가운데를 따로 둔 건
  // 두 색만 이으면 해 질 녘의 띠가 안 생기기 때문이다
  vec3 sky = mix(uSkyBot, uSkyMid, smoothstep(0.0, 0.58, uv.y));
  sky = mix(sky, uSkyTop, smoothstep(0.42, 1.0, uv.y));

  /*
   * ── 지평선과 원근 ──────────────────────────────
   *
   * 여기가 이 그림의 핵심이다.
   *
   * 처음에는 화면 좌표에 잡음을 그대로 얹었다. 그랬더니 구름이 아니라
   * 마블링 무늬가 나왔다. 위나 아래나 덩어리 크기가 똑같아서
   * 하늘이 아니라 벽에 칠한 물감으로 보였다.
   *
   * 실제로 구름은 평평한 층에 떠 있고 우리는 그 아래에서 올려다본다.
   * 머리 위 구름은 가깝고 커 보이지만 멀리 있는 구름은
   * 지평선 쪽으로 갈수록 납작하게 눌려서 잘게 깔린다.
   *
   * 그래서 화면 좌표를 그대로 쓰지 않고, 시선이 구름 층과 만나는
   * 자리를 구해서 거기에 잡음을 얹는다. 나누기 한 번이면 된다.
   * 아래로 갈수록 depth 가 커지고, 좌표가 커지면 무늬가 잘아진다.
   *
   * 지평선은 화면 아래 바깥에 둔다. 이 창은 하늘만 잘라 보는 칸이라
   * 땅이 보일 이유가 없다.
   */
  float horizonY = -0.06;
  float look = max(uv.y - horizonY, 0.001);
  float depth = 1.0 / (look * 1.35);

  // 바람을 타고 다가온다. y 로 밀면 구름이 지평선에서 솟아 머리 위로 지나간다
  float flow = t * (0.02 + uWind * 0.16);
  vec2 sp = vec2((uv.x - 0.5) * aspect * depth, depth) + vec2(flow * 0.35, -flow);

  // 지평선에 가까울수록(depth 가 클수록) 무늬가 잘아지는 건 위 나누기가 이미 한다
  float dist = smoothstep(1.0, 7.0, depth);  // 0 머리 위 .. 1 지평선 쪽

  // ── 해 / 달 ─────────────────────────────────────
  vec2 asp2 = vec2(aspect, 1.0);
  vec2 sunP = uSun * asp2;
  vec2 pFlat = uv * asp2;
  float d = length(pFlat - sunP);

  /*
   * 빛무리.
   *
   * 전에는 넓은 번짐 하나만 얹었더니 렌즈에 김이 서린 것처럼 보였다.
   * 가까운 심(core)과 먼 무리(halo)를 나눠 겹치면 빛이 한 점에서
   * 나오는 것처럼 읽힌다.
   */
  float core = exp(-d * 9.0);
  float halo = exp(-d * 2.4) * 0.5 + exp(-d * 0.9) * 0.22;
  float dayGlow = (1.0 - uNight * 0.5);
  /*
   * 노을빛과 알맹이는 따로 사라진다.
   * 해가 지평선 아래로 내려가도 하늘은 한참 더 붉게 남는다.
   * 둘을 같이 껐더니 해가 지는 순간 하늘이 툭 하고 꺼졌다.
   */
  sky += uSunCol * (halo * 0.55 + core * 0.5) * dayGlow * uIntensity * uGlow;

  // 알맹이. 달은 해보다 작고 야무지다
  float discR = mix(0.048, 0.026, uMoon);
  // 가장자리를 아주 얇게만 흐린다. 넓게 흐리면 얼룩처럼 보인다
  float disc = smoothstep(discR, discR * 0.86, d);
  disc *= uOrb;

  /*
   * 달의 위상.
   *
   * 같은 크기의 그림자 원을 옆으로 밀어서 만든다.
   * 하나도 안 밀면 달을 온통 덮어 삭이 되고, 지름의 두 배쯤 밀면
   * 겹치는 데가 없어 보름이 된다. 반쯤 밀면 반달이다.
   * 밝은 면 비율을 그대로 밀어낸 거리로 쓰면 그 사이가 저절로 맞는다.
   *
   * 차는 달은 오른쪽이 밝으므로 그림자를 왼쪽으로 민다 (uWaxing = -1).
   */
  float off = discR * 2.05 * uIllum * uWaxing;
  float shadow = smoothstep(discR, discR * 0.86, length(pFlat - sunP - vec2(off, 0.0)));
  disc *= mix(1.0, 1.0 - shadow, uMoon);
  vec3 discCol = mix(uSunCol, vec3(1.0), 0.55);
  sky = mix(sky, discCol, disc * 0.96);

  // ── 별 ──────────────────────────────────────────
  if (uStars > 0.001) {
    // 원근을 태워서 지평선 쪽 별이 촘촘해 보이게 한다
    vec2 stp = vec2(pFlat.x * 150.0, uv.y * 150.0 + depth * 6.0);
    vec2 gi = floor(stp);
    float rnd = hash21(gi);
    if (rnd > 0.975) {
      vec2 gf = fract(stp) - 0.5;
      gf -= (vec2(hash21(gi + 1.7), hash21(gi + 3.1)) - 0.5) * 0.55;
      float star = smoothstep(0.30, 0.0, length(gf));
      float tw = 0.5 + 0.5 * sin(uTime * 1.9 + rnd * 62.0);
      float up = smoothstep(0.0, 0.35, uv.y);
      sky += vec3(0.86, 0.91, 1.0) * star * tw * uStars * up;
    }
  }

  /*
   * ── 대기광 ──────────────────────────────────────
   *
   * 전에는 거의 안 보였다. 커튼을 만드는 값에 세기를 곱하고 또 곱해서
   * (pow 2.4 × fbm × 0.9 × 구름) 남는 게 없었다.
   * 대기광은 이 판(#005)의 전부인데 배경에 묻히면 안 된다.
   *
   * 세로로 길게 늘인 잡음을 옆으로 흔들면 커튼이 된다.
   * 아래는 밝고 위로 갈수록 사라지게 해서 지평선에서 솟은 것처럼 보이게 했다.
   */
  if (uAurora > 0.001) {
    float band = fbm(vec2(uv.x * 2.6 + t * 0.07, uv.y * 0.6 + t * 0.02));
    // 굵기가 다른 커튼 두 겹
    float c1 = sin(uv.x * 7.0 + band * 5.0 + t * 0.4) * 0.5 + 0.5;
    float c2 = sin(uv.x * 12.0 - band * 3.5 - t * 0.27) * 0.5 + 0.5;
    float curtain = max(pow(c1, 2.0), pow(c2, 2.6) * 0.7);

    // 세로로 흐르는 결
    float streak = fbm(vec2(uv.x * 9.0 + t * 0.1, uv.y * 1.6 - t * 0.5));
    curtain *= 0.45 + streak * 0.9;

    // 아래에서 솟아 위로 사라진다
    curtain *= smoothstep(0.02, 0.35, uv.y) * smoothstep(1.1, 0.45, uv.y);

    vec3 auroraCol = mix(vec3(0.20, 1.0, 0.62), vec3(0.45, 0.42, 1.0), smoothstep(0.25, 0.95, uv.y));
    sky += auroraCol * curtain * uAurora * 1.25 * uIntensity;
  }

  // ── 구름 ────────────────────────────────────────
  // 두 겹을 서로 다른 크기와 빠르기로 흘려 깊이를 만든다
  float far = clouds(sp * 0.85, uCloud * 0.92, t * 0.6);
  float near = clouds(sp * 1.9 + vec2(31.7, 12.3), uCloud, t);

  /*
   * 해 쪽 면이 밝고 반대쪽이 그늘진다.
   * 같은 구름을 해 쪽으로 조금 밀어서 다시 뜬 다음 그 차이를 본다.
   * 차이가 크면 그쪽이 구름의 가장자리라 빛을 받는 자리다.
   */
  vec2 toSun = normalize(sunP - pFlat + 0.0001);
  float litFar = clouds(sp * 0.85 + toSun * 0.30, uCloud * 0.92, t * 0.6);
  float litNear = clouds(sp * 1.9 + vec2(31.7, 12.3) + toSun * 0.45, uCloud, t);

  vec3 cFar = mix(uCloudDark, uCloudLit, clamp((far - litFar) * 2.2 + 0.5, 0.0, 1.0));
  vec3 cNear = mix(uCloudDark, uCloudLit, clamp((near - litNear) * 2.2 + 0.55, 0.0, 1.0));

  // 해 둘레의 구름은 빛을 머금는다
  cFar += uSunCol * halo * 0.5 * dayGlow * uGlow;
  cNear += uSunCol * halo * 0.65 * dayGlow * uGlow;

  // 멀리 있는 구름은 대기에 씻겨 옅어진다. 이게 있어야 거리가 느껴진다
  float wash = dist * 0.75;
  cFar = mix(cFar, uSkyBot, wash);
  cNear = mix(cNear, uSkyBot, wash * 0.8);
  far *= 1.0 - dist * 0.35;

  vec3 col = mix(sky, cFar, far * 0.66);
  col = mix(col, cNear, near * 0.82);

  /*
   * 구름을 통과해 새어 나오는 빛.
   * 구름을 덮고 나면 해가 무조건 가려져서, 구름 사이로 해가 비치는
   * 날에도 그냥 얼룩이 됐다. 덮은 다음에 심을 한 번 더 얹는다.
   */
  col += uSunCol * core * 0.5 * dayGlow * uIntensity * uGlow;
  col = mix(col, discCol, disc * 0.9 * (1.0 - near * 0.75));

  // ── 지평선 안개 ─────────────────────────────────
  // 띠로 긋지 않고 아래로 갈수록 스미게 한다
  float haze = pow(smoothstep(0.75, -0.05, uv.y), 1.6) * uHaze;
  col = mix(col, mix(uSkyBot, uSunCol, 0.18 * dayGlow * uGlow), haze * 0.6);

  // ── 비 ──────────────────────────────────────────
  if (uRain > 0.001) {
    vec2 rp = vec2(pFlat.x * 130.0, uv.y * 30.0 - uTime * (6.0 + uWind * 10.0));
    rp.x += rp.y * 0.2;
    vec2 ri = floor(rp);
    float rr = hash21(ri);
    if (rr > 1.0 - uRain * 0.3) {
      vec2 rf = fract(rp) - 0.5;
      float streak = smoothstep(0.42, 0.0, abs(rf.x) * 6.0) * smoothstep(0.5, 0.05, abs(rf.y));
      col += vec3(0.66, 0.75, 0.88) * streak * 0.42 * uIntensity;
    }
  }

  // ── 눈 ──────────────────────────────────────────
  if (uSnow > 0.001) {
    for (int L = 0; L < 3; L++) {
      float fl = float(L);
      float sc = 30.0 + fl * 24.0;
      vec2 np = vec2(pFlat.x, uv.y) * sc;
      np.y -= uTime * (0.9 + fl * 0.6);
      np.x += sin(uTime * 0.5 + fl * 2.0 + np.y * 0.25) * 0.8;
      vec2 ni = floor(np);
      float nr = hash21(ni + fl * 17.0);
      if (nr > 0.974 - uSnow * 0.02) {
        vec2 nf = fract(np) - 0.5;
        float flake = smoothstep(0.26, 0.0, length(nf));
        col += vec3(1.0) * flake * uSnow * (0.8 - fl * 0.2);
      }
    }
  }

  // ── 마무리 ──────────────────────────────────────
  /*
   * 가장자리 누르기.
   * 전에는 화면 비율을 그대로 써서, 가로로 긴 창에서는
   * 좌우가 과하게 어두워지고 위아래는 아무 일도 안 일어났다.
   * 긴 쪽을 기준으로 재서 어느 비율에서도 같은 정도로만 눌리게 한다.
   */
  vec2 vg = (uv - 0.5) * vec2(min(aspect, 1.6) / 1.6, 1.0);
  float vig = smoothstep(1.05, 0.30, length(vg));
  col *= mix(1.0, vig, 0.34);

  // 페이지를 내리면 배경이 가라앉는다
  col = mix(col, col * 0.42, uScroll);

  // 아주 고운 결. 매끈한 그러데이션에 생기는 띠(밴딩)를 덮는다
  if (uGrain > 0.001) {
    float g = hash21(uv * uRes + fract(uTime) * 91.7) - 0.5;
    col += g * 0.02 * uGrain;
  }

  gl_FragColor = vec4(col, 1.0);
}
`
