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
uniform float uScroll;     // 페이지를 내린 정도 0..1

// ── 잡음 ───────────────────────────────────────────
// 값 잡음(value noise). 구름과 대기광의 재료다.
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise21(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // 부드럽게 이어 붙인다. 직선으로 이으면 격자가 눈에 보인다
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// 잡음을 크기를 줄여 가며 여러 겹 포갠다. 구름의 결이 여기서 나온다
float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise21(p);
    p *= 2.02;
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
float cloudLayer(vec2 uv, float scale, float t, float cover) {
  vec2 p = uv * scale;
  p.x += t;
  vec2 warp = vec2(fbm(p * 0.5 + t * 0.1), fbm(p * 0.5 + 5.2 - t * 0.08));
  float n = fbm(p + warp * 1.6);
  // cover 가 0 이면 아무것도, 1 이면 하늘을 덮는다
  float edge = mix(0.86, 0.18, cover);
  return smoothstep(edge, edge + 0.34, n);
}

void main() {
  vec2 uv = vUv;
  // 가로세로 비를 맞춘 좌표. 화면이 넓어져도 구름이 늘어지지 않는다
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = uv * asp;

  float t = uTime * uSpeed;
  // 바람이 세면 구름이 빨리 흐른다
  float drift = t * (0.006 + uWind * 0.05);

  // ── 바탕 하늘 ────────────────────────────────────
  // 위에서 아래로 세 색을 잇는다. 가운데를 따로 둔 건
  // 두 색만 이으면 해 질 녘의 띠가 안 생기기 때문이다
  float h = uv.y;
  vec3 sky = mix(uSkyBot, uSkyMid, smoothstep(0.0, 0.55, h));
  sky = mix(sky, uSkyTop, smoothstep(0.45, 1.0, h));

  // ── 해 / 달 ─────────────────────────────────────
  vec2 sunP = uSun * asp;
  float d = length(p - sunP);

  // 해 둘레의 번짐. 하늘 전체가 해 쪽으로 물든다
  float glow = exp(-d * 2.2) * 0.55 + exp(-d * 6.0) * 0.35;
  sky += uSunCol * glow * (1.0 - uNight * 0.55) * uIntensity;

  // 알맹이. 달은 해보다 작고 야무지다
  float discR = mix(0.055, 0.030, uMoon);
  float disc = smoothstep(discR, discR * 0.55, d);
  // 달일 때는 한쪽을 베어 초승달로
  float bite = smoothstep(discR * 0.98, discR * 0.55, length(p - sunP - vec2(0.016, 0.012)));
  disc = mix(disc, max(disc - bite, 0.0), uMoon);
  sky += uSunCol * disc * (0.9 + uIntensity * 0.6);

  // ── 별 ──────────────────────────────────────────
  if (uStars > 0.001) {
    // 화면을 격자로 잘라 칸마다 별을 하나씩 둘지 정한다
    vec2 sp = p * 190.0;
    vec2 gi = floor(sp);
    float rnd = hash21(gi);
    if (rnd > 0.978) {
      vec2 gf = fract(sp) - 0.5;
      // 칸 안에서도 자리를 흩어 둔다. 안 그러면 격자가 보인다
      gf -= (vec2(hash21(gi + 1.7), hash21(gi + 3.1)) - 0.5) * 0.6;
      float star = smoothstep(0.34, 0.0, length(gf));
      // 박자를 별마다 어긋나게 해서 한꺼번에 깜빡이지 않게 한다
      float tw = 0.55 + 0.45 * sin(uTime * 1.7 + rnd * 62.0);
      // 지평선 가까이는 옅고, 구름이 덮으면 가린다
      float up = smoothstep(0.05, 0.5, uv.y);
      sky += vec3(0.85, 0.9, 1.0) * star * tw * uStars * up * (1.0 - uCloud * 0.85);
    }
  }

  // ── 대기광 ──────────────────────────────────────
  if (uAurora > 0.001) {
    // 옆으로 길게 늘인 잡음을 세로로 흔들면 커튼이 된다
    float band = fbm(vec2(p.x * 1.6 + t * 0.05, p.y * 0.5));
    float curtain = sin((uv.x * 5.0) + band * 4.0 + t * 0.35) * 0.5 + 0.5;
    curtain *= smoothstep(0.18, 0.85, uv.y);
    curtain *= smoothstep(1.0, 0.55, uv.y);
    float veil = pow(curtain, 2.4) * fbm(vec2(p.x * 3.0 - t * 0.1, p.y * 2.0 + t * 0.06));
    // 초록에서 보라로 번지게. 위로 갈수록 보라
    vec3 auroraCol = mix(vec3(0.16, 0.92, 0.62), vec3(0.55, 0.35, 0.95), smoothstep(0.3, 0.9, uv.y));
    sky += auroraCol * veil * uAurora * 0.9 * uIntensity * (1.0 - uCloud * 0.7);
  }

  // ── 구름 ────────────────────────────────────────
  // 두 겹을 서로 다른 크기와 빠르기로 흘려 깊이를 만든다.
  // 뒤 겹은 느리고 크게, 앞 겹은 빠르고 잘게.
  float far = cloudLayer(p, 2.2, drift * 0.55, uCloud * 0.9);
  float near = cloudLayer(p + vec2(3.7, 1.3), 4.6, drift, uCloud);

  // 해 쪽 면이 밝고 반대쪽이 그늘진다. 이게 있어야 덩어리로 보인다
  vec2 toSun = normalize(sunP - p + 0.0001);
  float litFar = cloudLayer(p + toSun * 0.05, 2.2, drift * 0.55, uCloud * 0.9);
  float litNear = cloudLayer(p + toSun * 0.04 + vec2(3.7, 1.3), 4.6, drift, uCloud);

  vec3 cFar = mix(uCloudDark, uCloudLit, clamp((far - litFar) * 2.5 + 0.45, 0.0, 1.0));
  vec3 cNear = mix(uCloudDark, uCloudLit, clamp((near - litNear) * 2.5 + 0.5, 0.0, 1.0));

  // 해 둘레의 구름은 빛을 머금는다
  cFar += uSunCol * glow * 0.5;
  cNear += uSunCol * glow * 0.6;

  vec3 col = mix(sky, cFar, far * 0.62);
  col = mix(col, cNear, near * 0.78);

  // ── 지평선 안개 ─────────────────────────────────
  float haze = smoothstep(0.42, 0.0, uv.y) * uHaze;
  col = mix(col, mix(uSkyBot, uSunCol, 0.25), haze * 0.55);

  // ── 비 ──────────────────────────────────────────
  if (uRain > 0.001) {
    // 빗줄기는 비스듬히 흐르는 세로 격자로 만든다
    vec2 rp = vec2(p.x * 120.0, p.y * 26.0 - uTime * (5.0 + uWind * 9.0));
    rp.x += rp.y * 0.22;
    vec2 ri = floor(rp);
    float rr = hash21(ri);
    float streak = 0.0;
    if (rr > 1.0 - uRain * 0.32) {
      vec2 rf = fract(rp) - 0.5;
      streak = smoothstep(0.42, 0.0, abs(rf.x) * 5.5) * smoothstep(0.5, 0.1, abs(rf.y));
    }
    col += vec3(0.62, 0.72, 0.85) * streak * 0.5 * uIntensity;
  }

  // ── 눈 ──────────────────────────────────────────
  if (uSnow > 0.001) {
    for (int L = 0; L < 3; L++) {
      float fl = float(L);
      float sc = 34.0 + fl * 26.0;
      float sp2 = 0.30 + fl * 0.22;
      vec2 np = p * sc;
      // 옆으로 흔들리며 내려온다. 곧게 내려오면 눈이 아니라 점이다
      np.y -= uTime * sp2 * 3.0;
      np.x += sin(uTime * 0.5 + fl * 2.0 + np.y * 0.25) * 0.8;
      vec2 ni = floor(np);
      float nr = hash21(ni + fl * 17.0);
      if (nr > 0.972 - uSnow * 0.02) {
        vec2 nf = fract(np) - 0.5;
        float flake = smoothstep(0.26, 0.0, length(nf));
        col += vec3(1.0) * flake * uSnow * (0.75 - fl * 0.18);
      }
    }
  }

  // ── 마무리 ──────────────────────────────────────
  // 가장자리를 살짝 눌러 가운데로 눈이 모이게
  float vig = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(1.15, 1.0)));
  col *= mix(1.0, vig, 0.55);

  // 페이지를 내리면 배경이 가라앉는다. 읽을 때는 조용해야 한다
  col = mix(col, col * 0.42, uScroll);

  // 아주 고운 결. 매끈한 그러데이션에 생기는 띠(밴딩)를 덮는다
  if (uGrain > 0.001) {
    float g = hash21(uv * uRes + fract(uTime) * 91.7) - 0.5;
    col += g * 0.022 * uGrain;
  }

  gl_FragColor = vec4(col, 1.0);
}
`
