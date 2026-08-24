<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount, watch } from 'vue'
import { VERTEX_SRC, FRAGMENT_SRC } from './skyShader'
import { hexToRgb } from './skyPresets'

/*
 * 하늘이 보이는 창문.
 *
 * 화면 전체를 덮지 않고 창처럼 한 칸에 앉힌다.
 * 이 화면은 판정을 읽으러 오는 곳이라, 글자 뒤에서 계속 움직이는 것이 있으면
 * 읽는 내내 시야 구석이 시끄럽다. 창으로 잘라 두면
 * 볼 때는 보고 읽을 때는 안 보게 된다.
 *
 * 값은 전부 uniform 으로 들어간다. 셰이더는 다시 만들지 않는다.
 * 하늘을 바꾸면 숫자만 갈아 끼우므로 끊기지 않고 그 자리에서 물든다.
 */
const props = defineProps({
  // skyPresets.resolveSky 가 만들어 준 값 한 벌
  sky: { type: Object, required: true },
  // 보이지 않을 때는 멈춘다
  paused: { type: Boolean, default: false },
})

const holder = ref(null)
const canvas = ref(null)
const failed = ref(false)

const gl = shallowRef(null)
const program = shallowRef(null)
const uniforms = shallowRef({})
let raf = 0
let start = 0
let visible = true
let observer = null
let ro = null

/*
 * 값이 바뀔 때 툭 끊기지 않게 천천히 따라가게 한다.
 * 하늘을 고르는 순간 색이 즉시 바뀌면 화면이 깜빡인 것처럼 보인다.
 * 지금 그리는 값(cur)이 목표 값(target)을 매 프레임 조금씩 쫓는다.
 */
const cur = {}
const NUM_KEYS = [
  'night', 'moon', 'cloud', 'rain', 'snow', 'wind',
  'aurora', 'stars', 'haze', 'intensity', 'speed', 'grain', 'scroll',
  'orb', 'glow', 'illum', 'waxing',
]
const COL_KEYS = ['skyTop', 'skyMid', 'skyBot', 'sunCol', 'cloudLit', 'cloudDark']

const seed = () => {
  const s = props.sky
  NUM_KEYS.forEach((k) => (cur[k] = Number(s[k] ?? 0)))
  COL_KEYS.forEach((k) => (cur[k] = hexToRgb(s[k] ?? '#000000')))
  cur.sun = [...(s.sun ?? [0.5, 0.7])]
}

const compile = (ctx, type, src) => {
  const sh = ctx.createShader(type)
  ctx.shaderSource(sh, src)
  ctx.compileShader(sh)
  if (!ctx.getShaderParameter(sh, ctx.COMPILE_STATUS)) {
    console.error('하늘 셰이더를 못 만들었습니다:', ctx.getShaderInfoLog(sh))
    ctx.deleteShader(sh)
    return null
  }
  return sh
}

const setup = () => {
  const el = canvas.value
  if (!el) return false

  const ctx =
    el.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }) ||
    el.getContext('experimental-webgl')
  if (!ctx) return false

  const vs = compile(ctx, ctx.VERTEX_SHADER, VERTEX_SRC)
  const fs = compile(ctx, ctx.FRAGMENT_SHADER, FRAGMENT_SRC)
  if (!vs || !fs) return false

  const prog = ctx.createProgram()
  ctx.attachShader(prog, vs)
  ctx.attachShader(prog, fs)
  ctx.linkProgram(prog)
  if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) {
    console.error('하늘 셰이더를 못 이었습니다:', ctx.getProgramInfoLog(prog))
    return false
  }
  ctx.useProgram(prog)

  // 화면을 덮는 삼각형 두 장. 이 그림에 필요한 기하는 이게 전부다
  const buf = ctx.createBuffer()
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buf)
  ctx.bufferData(
    ctx.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    ctx.STATIC_DRAW,
  )
  const loc = ctx.getAttribLocation(prog, 'aPos')
  ctx.enableVertexAttribArray(loc)
  ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0)

  const names = [
    'uRes', 'uTime', 'uSpeed', 'uIntensity',
    'uSkyTop', 'uSkyMid', 'uSkyBot', 'uSunCol', 'uCloudLit', 'uCloudDark',
    'uSun', 'uNight', 'uMoon', 'uCloud', 'uRain', 'uSnow',
    'uWind', 'uAurora', 'uStars', 'uHaze', 'uGrain', 'uScroll',
    'uOrb', 'uGlow', 'uIllum', 'uWaxing',
  ]
  const u = {}
  names.forEach((n) => (u[n] = ctx.getUniformLocation(prog, n)))

  gl.value = ctx
  program.value = prog
  uniforms.value = u
  return true
}

const resize = () => {
  const ctx = gl.value
  const el = canvas.value
  if (!ctx || !el) return
  const box = el.getBoundingClientRect()
  // 화력 우선으로 두되 2배까지만. 3배는 눈에 안 보이고 열만 난다
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.max(1, Math.round(box.width * dpr))
  const h = Math.max(1, Math.round(box.height * dpr))
  if (el.width !== w || el.height !== h) {
    el.width = w
    el.height = h
    ctx.viewport(0, 0, w, h)
  }
}

// 목표 값을 조금씩 쫓아간다
const approach = (a, b, k) => a + (b - a) * k
const step = (dt) => {
  const s = props.sky
  // 60fps 든 30fps 든 같은 시간에 도착하도록 프레임 간격을 반영한다
  const k = Math.min(1, dt * 2.2)
  NUM_KEYS.forEach((key) => {
    cur[key] = approach(cur[key], Number(s[key] ?? 0), k)
  })
  COL_KEYS.forEach((key) => {
    const t = hexToRgb(s[key] ?? '#000000')
    cur[key] = cur[key].map((v, i) => approach(v, t[i], k))
  })
  const st = s.sun ?? [0.5, 0.7]
  cur.sun[0] = approach(cur.sun[0], st[0], k)
  cur.sun[1] = approach(cur.sun[1], st[1], k)
}

const draw = (now) => {
  raf = requestAnimationFrame(draw)
  const ctx = gl.value
  if (!ctx || !visible || props.paused) return

  if (!start) start = now
  const t = (now - start) / 1000
  const dt = Math.min(0.05, (now - (draw.last ?? now)) / 1000)
  draw.last = now

  step(dt)
  resize()

  const u = uniforms.value
  const el = canvas.value
  ctx.uniform2f(u.uRes, el.width, el.height)
  ctx.uniform1f(u.uTime, t)
  ctx.uniform1f(u.uSpeed, cur.speed)
  ctx.uniform1f(u.uIntensity, cur.intensity)
  ctx.uniform3fv(u.uSkyTop, cur.skyTop)
  ctx.uniform3fv(u.uSkyMid, cur.skyMid)
  ctx.uniform3fv(u.uSkyBot, cur.skyBot)
  ctx.uniform3fv(u.uSunCol, cur.sunCol)
  ctx.uniform3fv(u.uCloudLit, cur.cloudLit)
  ctx.uniform3fv(u.uCloudDark, cur.cloudDark)
  ctx.uniform2f(u.uSun, cur.sun[0], cur.sun[1])
  ctx.uniform1f(u.uNight, cur.night)
  ctx.uniform1f(u.uMoon, cur.moon)
  ctx.uniform1f(u.uCloud, cur.cloud)
  ctx.uniform1f(u.uRain, cur.rain)
  ctx.uniform1f(u.uSnow, cur.snow)
  ctx.uniform1f(u.uWind, cur.wind)
  ctx.uniform1f(u.uAurora, cur.aurora)
  ctx.uniform1f(u.uStars, cur.stars)
  ctx.uniform1f(u.uHaze, cur.haze)
  ctx.uniform1f(u.uGrain, cur.grain)
  ctx.uniform1f(u.uScroll, cur.scroll)
  ctx.uniform1f(u.uOrb, cur.orb)
  ctx.uniform1f(u.uGlow, cur.glow)
  ctx.uniform1f(u.uIllum, cur.illum)
  ctx.uniform1f(u.uWaxing, cur.waxing)

  ctx.drawArrays(ctx.TRIANGLES, 0, 3)
}

onMounted(() => {
  seed()
  if (!setup()) {
    // WebGL 이 없거나 막힌 환경. 그림은 포기하고 CSS 로 물든 판만 남긴다
    failed.value = true
    return
  }
  resize()

  // 화면 밖으로 나가면 멈춘다. 안 보이는 그림에 전기를 쓰지 않는다
  observer = new IntersectionObserver(
    ([e]) => (visible = e.isIntersecting),
    { rootMargin: '80px' },
  )
  if (holder.value) observer.observe(holder.value)

  ro = new ResizeObserver(resize)
  if (canvas.value) ro.observe(canvas.value)

  raf = requestAnimationFrame(draw)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  ro?.disconnect()
  // 컨텍스트를 놓아 준다. 창을 여러 번 드나들면 WebGL 이 개수 제한에 걸린다
  const ctx = gl.value
  ctx?.getExtension('WEBGL_lose_context')?.loseContext()
})

// 하늘이 통째로 바뀌면 목표만 바꾸고 그리는 값은 그대로 둔다. 그래야 물들듯 넘어간다
watch(() => props.sky, () => {}, { deep: true })
</script>

<template>
  <div ref="holder" class="sky-holder">
    <canvas v-if="!failed" ref="canvas" class="sky-canvas" aria-hidden="true"></canvas>
    <!-- WebGL 이 안 되는 곳에서도 하늘색은 남는다 -->
    <div
      v-else
      class="sky-fallback"
      aria-hidden="true"
      :style="{
        background: `linear-gradient(180deg, ${sky.skyTop} 0%, ${sky.skyMid} 55%, ${sky.skyBot} 100%)`,
      }"
    ></div>
    <slot />
  </div>
</template>

<style scoped>
.sky-holder {
  position: relative;
  isolation: isolate;
}
.sky-canvas,
.sky-fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 0;
}
</style>
