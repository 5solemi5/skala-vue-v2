<script setup>
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()

// 값을 바꾸는 스위치라 눌리는 알약 모양으로 뒀다.
// 옆의 언어(활자형)와 밝기(그림형)와 생김새가 겹치지 않게 셋을 갈라 놓았다.
const label = (unit) => (unit === 'celsius' ? configStore.t('unit.c') : configStore.t('unit.f'))
</script>

<template>
  <button
    type="button"
    class="unit"
    :aria-label="`${configStore.t('unit.aria')} — ${label(configStore.unit)}`"
    @click="configStore.toggleUnit"
  >
    <span :class="{ on: configStore.unit === 'celsius' }">℃</span>
    <span :class="{ on: configStore.unit === 'fahrenheit' }">℉</span>
    <span class="sr">{{ label(configStore.unit) }}</span>
  </button>
</template>

<style scoped>
.unit {
  display: inline-flex;
  padding: 2px;
  font-family: inherit;
  background: var(--color-paper-3);
  border: 0;
  border-radius: 999px;
  cursor: pointer;
}
.unit span {
  padding: 3px 8px;
  font-size: var(--fs-2xs);
  font-weight: 500;
  color: var(--color-ink-3);
  border-radius: 999px;
  transition:
    color var(--dur-state) var(--ease-out),
    background-color var(--dur-state) var(--ease-out),
    box-shadow var(--dur-state) var(--ease-out);
}
.unit span.on {
  color: var(--color-ink);
  background: var(--color-paper);
  box-shadow: var(--shadow-1);
}
.unit:active {
  transform: translateY(0.5px);
}

/* 화면에는 안 보이고 읽어 주는 기계에만 들리는 글자 */
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .unit:active {
    transform: none;
  }
}
</style>
