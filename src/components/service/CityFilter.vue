<script setup>
import { ref, watch } from 'vue'
import { useConfigStore } from '@/stores/configStore'

/*
 * 지역 목록을 이름으로 걸러 보는 칸.
 *
 * 예전에는 이 일을 하는 칸이 화면 맨 아래 '도구' 칸에 있었다.
 * 거르는 대상인 목록은 위에 있고 거르는 손잡이는 저 아래 있어서,
 * 목록을 보다가 하나만 보려면 화면을 끝까지 내려가 치고 다시 올라와야 했다.
 * 손잡이를 그 목록의 제목 줄로 옮겼다.
 *
 * 열두 개까지만 등록되는 목록이라 거를 일이 잦지는 않다.
 * 그래서 늘 펼쳐 두지 않고 돋보기만 놔두고 누를 때 칸이 열린다.
 */
const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const configStore = useConfigStore()
const isOpen = ref(Boolean(props.modelValue))
const inputEl = ref(null)

const open = async () => {
  isOpen.value = true
  await Promise.resolve()
  inputEl.value?.focus()
}

const clear = () => {
  emit('update:modelValue', '')
  isOpen.value = false
}

// 밖에서 검색어가 채워지면(주소로 들어온 경우 등) 칸을 열어 둔다
watch(
  () => props.modelValue,
  (v) => {
    if (v) isOpen.value = true
  },
)
</script>

<template>
  <div class="filter">
    <button
      v-if="!isOpen"
      type="button"
      class="peek"
      :aria-label="configStore.t('filter.label')"
      @click="open"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="6.8" cy="6.8" r="4.4" />
        <line x1="10.2" y1="10.2" x2="14" y2="14" />
      </svg>
    </button>

    <div v-else class="box">
      <svg class="glass" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="6.8" cy="6.8" r="4.4" />
        <line x1="10.2" y1="10.2" x2="14" y2="14" />
      </svg>
      <input
        ref="inputEl"
        type="text"
        class="field"
        :value="modelValue"
        :placeholder="configStore.t('filter.placeholder')"
        :aria-label="configStore.t('filter.label')"
        @input="emit('update:modelValue', $event.target.value)"
        @keydown.escape="clear"
      />
      <button type="button" class="x" :aria-label="configStore.t('filter.clear')" @click="clear">
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter {
  display: flex;
  align-items: center;
}

/* 접혀 있을 때 — 돋보기만 */
.peek {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  color: var(--color-ink-3);
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    color var(--dur-state) var(--ease-out),
    border-color var(--dur-state) var(--ease-out);
}
.peek:hover {
  color: var(--color-ink);
  border-color: var(--color-line);
}

/* 펼쳐진 칸 */
.box {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 0 var(--sp-1) 0 var(--sp-2);
  background: var(--color-paper);
  border: 1px solid var(--color-line-2);
  border-radius: var(--radius-md);
  /* 열릴 때 옆으로 밀려 나오게. 갑자기 나타나면 목록 제목이 튄다 */
  animation: reveal var(--dur-move) var(--ease-out);
}
.box:focus-within {
  border-color: var(--color-ink);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-ink) 12%, transparent);
}
@keyframes reveal {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
}

svg {
  width: 14px;
  height: 14px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
}
.glass {
  color: var(--color-ink-3);
}

.field {
  width: 108px;
  padding: 5px 0;
  font-family: inherit;
  font-size: var(--fs-xs);
  color: var(--color-ink);
  background: none;
  border: 0;
  outline: none;
}
.field::placeholder {
  color: var(--color-ink-4);
}

.x {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1;
  color: var(--color-ink-3);
  background: none;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
}
.x:hover {
  color: var(--color-ink);
  background: var(--color-paper-3);
}

@media (prefers-reduced-motion: reduce) {
  .box {
    animation: none;
  }
}
</style>
