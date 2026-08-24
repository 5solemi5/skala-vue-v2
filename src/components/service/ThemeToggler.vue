<script setup>
import { computed, useId } from 'vue'
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()

/*
 * 낮 / 밤 / 자동 을 도는 단추 하나.
 *
 * ── 왜 또 다른 모양인가 ────────────────────────────
 * 헤더에 이미 스위치가 둘 있다.
 * 언어는 활자를 고르듯 테두리 친 글자, 단위는 눌리는 알약이다.
 * 셋째를 둘 중 하나와 같은 모양으로 만들면 여섯 칸짜리 스위치 하나처럼 붙어 보인다.
 * (언어 토글을 만들 때 이미 한 번 겪은 일이다)
 *
 * 그래서 이건 그림을 쓴다. 셋 중 유일하게 값이 셋이라 글자로 늘어놓을 자리도 없고,
 * 해와 달은 설명 없이 읽히는 몇 안 되는 그림이다.
 *
 * ── 왜 아이콘 라이브러리를 안 썼나 ──────────────────
 * lucide 가 package.json 에 있지만 이 화면은 표식을 직접 그려 왔다
 * (로고, 반짝임, 헤더의 하늘). 남의 선 굵기를 하나만 섞으면 그 하나가 튄다.
 *
 * ── 판정은 글자로 쓰는데 여기는 왜 그림인가 ─────────
 * 판정에서 그림을 뺀 건 '하지 마세요' 와 '조심하세요' 가 아이콘으로 구분이
 * 안 되기 때문이었다. 해와 달은 서로 닮은 데가 없어서 그 문제가 없다.
 * 그래도 그림만 두지는 않고 옆에 글자를 붙였다. 화면이 좁을 때만 그림만 남는다.
 */
const uid = useId()

const glyph = computed(() => {
  if (configStore.theme === 'light') return 'sun'
  if (configStore.theme === 'dark') return 'moon'
  return 'auto'
})

const label = computed(() => configStore.t(`theme.${configStore.theme}`))

// 지금 무슨 상태인지 말로 알려준다. 그림만으로는 '자동' 이 안 읽힌다.
const hint = computed(() => {
  const key = { system: 'nowSystem', light: 'nowLight', dark: 'nowDark' }[configStore.theme]
  return configStore.t(`theme.${key}`)
})
</script>

<template>
  <button
    type="button"
    class="theme"
    :class="glyph"
    :title="hint"
    :aria-label="`${configStore.t('theme.aria')} — ${label}. ${hint}`"
    @click="configStore.cycleTheme"
  >
    <span class="glyph-slot" aria-hidden="true">
      <Transition name="swap" mode="out-in">
        <!-- 낮 — 해 -->
        <svg v-if="glyph === 'sun'" key="sun" viewBox="0 0 24 24" class="g">
          <circle class="orb" cx="12" cy="12" r="4.4" />
          <g class="rays">
            <line x1="12" y1="1.8" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22.2" />
            <line x1="1.8" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22.2" y2="12" />
            <line x1="4.8" y1="4.8" x2="6.4" y2="6.4" />
            <line x1="17.6" y1="17.6" x2="19.2" y2="19.2" />
            <line x1="4.8" y1="19.2" x2="6.4" y2="17.6" />
            <line x1="17.6" y1="6.4" x2="19.2" y2="4.8" />
          </g>
        </svg>

        <!-- 밤 — 달과 별 하나 -->
        <svg v-else-if="glyph === 'moon'" key="moon" viewBox="0 0 24 24" class="g">
          <defs>
            <!--
              달은 원 두 개로 만든다.
              한쪽을 베어 내는 방식이라 뒤에 무슨 색이 깔려도 초승달로 보인다.
              배경색으로 덮어 그리면 헤더의 하늘이 비칠 때 자리가 드러난다.
            -->
            <mask :id="`crescent-${uid}`">
              <rect x="0" y="0" width="24" height="24" fill="black" />
              <circle cx="12" cy="12" r="8.2" fill="white" />
              <circle cx="17.4" cy="7.6" r="7.2" fill="black" />
            </mask>
          </defs>
          <circle class="orb" cx="12" cy="12" r="8.2" :mask="`url(#crescent-${uid})`" />
          <circle class="spark" cx="18.6" cy="17.4" r="1.15" />
        </svg>

        <!-- 자동 — 반은 차오르고 반은 비어 있다 -->
        <svg v-else key="auto" viewBox="0 0 24 24" class="g">
          <!-- 비어 있는 쪽 -->
          <circle class="ring" cx="12" cy="12" r="7.4" />
          <!-- 차오른 쪽. 왼쪽 반원만 메운다 -->
          <path class="orb" d="M12 4.6a7.4 7.4 0 0 0 0 14.8Z" />
        </svg>
      </Transition>
    </span>

    <span class="label">{{ label }}</span>
  </button>
</template>

<style scoped>
.theme {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px 3px 4px;
  font-family: inherit;
  font-size: var(--fs-2xs);
  font-weight: 500;
  line-height: 1;
  color: var(--color-ink-3);
  background: none;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition:
    color var(--dur-state) var(--ease-out),
    border-color var(--dur-state) var(--ease-out),
    background-color var(--dur-state) var(--ease-out);
}
.theme:hover {
  color: var(--color-ink);
  border-color: var(--color-line-2);
  background: color-mix(in srgb, var(--color-paper) 55%, transparent);
}

/* 눌리는 순간 살짝 내려앉는다. 다른 스위치와 같은 손맛 */
.theme:active {
  transform: translateY(0.5px);
}

.label {
  letter-spacing: 0.01em;
  /* 자동/낮/밤은 길이가 달라서 글자 수에 따라 헤더가 흔들린다. 자리를 잡아 둔다 */
  min-width: 1.6em;
  text-align: left;
}

/*
 * 그림이 들어갈 자리.
 * 바뀔 때 겹쳐 놓고 하나가 나가고 하나가 들어와야 해서 자리를 고정한다.
 */
.glyph-slot {
  position: relative;
  display: block;
  width: 15px;
  height: 15px;
  flex: none;
}
.g {
  position: absolute;
  inset: 0;
  width: 15px;
  height: 15px;
}

.orb {
  fill: currentColor;
}
.ring {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  /*
   * 비어 있는 쪽 테두리를 옅게 둔다.
   * 같은 진하기로 두면 반원이 아니라 원 하나에 금이 간 것처럼 보였다.
   */
  opacity: 0.42;
}
.rays {
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
}
.spark {
  fill: currentColor;
  opacity: 0.55;
}

/*
 * 고른 상태는 진하게.
 * 자동은 '내가 정하지 않았다' 는 뜻이라 한 단 옅게 둔다.
 */
.theme.sun,
.theme.moon {
  color: var(--color-ink-2);
}
.theme.sun:hover,
.theme.moon:hover {
  color: var(--color-ink);
}

/*
 * 바뀌는 순간.
 * 해가 지고 달이 뜨는 것처럼 위아래로 지나가게 했다.
 * 페이드만 주면 두 그림이 같은 자리에서 뭉개져서 무엇으로 바뀌었는지 안 보인다.
 */
.swap-enter-active,
.swap-leave-active {
  transition:
    opacity var(--dur-state) var(--ease-out),
    transform var(--dur-move) var(--ease-out);
}
.swap-enter-from {
  opacity: 0;
  transform: translateY(5px) rotate(-40deg) scale(0.7);
}
.swap-leave-to {
  opacity: 0;
  transform: translateY(-5px) rotate(40deg) scale(0.7);
}

@media (prefers-reduced-motion: reduce) {
  .swap-enter-from,
  .swap-leave-to {
    transform: none;
  }
  .theme:active {
    transform: none;
  }
}

/* 아주 좁은 화면에서는 그림만 남긴다 */
@media (max-width: 420px) {
  .label {
    /* 화면에서는 숨기고 읽어 주는 기계에는 남긴다 */
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .theme {
    padding: 4px;
  }
}
</style>
