<script setup>
import { ref } from 'vue'
import { useSkyStore } from '@/stores/skyStore'
import { useConfigStore } from '@/stores/configStore'

/*
 * 창밖을 어떻게 볼까.
 *
 * 처음에는 하늘 열두 판을 고르게 했다. 지금은 두 가지를 고른다.
 *
 *   언제  그곳의 실제 일출·일몰로 계산한 시각. 그 시각의 실제 예보를 쓴다.
 *   렌즈  하늘은 그대로 두고 구름·비·바람 중 무엇을 도드라지게 볼지만 바꾼다.
 *
 * 둘 다 그 사람의 실제 값이라 고를수록 그 사람에게 가까워진다.
 * 지어낸 하늘을 고르면 그 아래 새겨 둔 좌표가 거짓말이 된다.
 *
 * 시각은 늘 보이게 두고 렌즈는 접어 뒀다.
 * 아홉 개를 한 줄에 늘어놓으면 정작 봐야 할 하늘을 손잡이가 가린다.
 */
const skyStore = useSkyStore()
const configStore = useConfigStore()

const lensOpen = ref(false)
</script>

<template>
  <div class="picker">
    <!-- 언제의 하늘 -->
    <div class="times" role="tablist" :aria-label="configStore.t('view.aria')">
      <button
        v-for="v in skyStore.views"
        :key="v.id"
        type="button"
        role="tab"
        :aria-selected="v.id === skyStore.view"
        class="t"
        :class="{ on: v.id === skyStore.view }"
        @click="skyStore.setView(v.id)"
      >
        {{ v.ko }}
      </button>
    </div>

    <!-- 무엇을 도드라지게 -->
    <div class="lens-wrap">
      <button
        type="button"
        class="lens-btn"
        :class="{ on: skyStore.lens !== 'plain' }"
        :aria-expanded="lensOpen"
        :aria-label="configStore.t('lens.aria')"
        @click="lensOpen = !lensOpen"
      >
        <!-- 렌즈. 동그란 알 하나 -->
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.6" />
          <path d="M10.4 10.4 14 14" />
        </svg>
        <span v-if="skyStore.lens !== 'plain'" class="lens-name">
          {{ skyStore.lenses.find((l) => l.id === skyStore.lens)?.ko }}
        </span>
      </button>

      <Transition name="pop">
        <div v-if="lensOpen" class="lens-menu" role="listbox">
          <button
            v-for="l in skyStore.lenses"
            :key="l.id"
            type="button"
            role="option"
            :aria-selected="l.id === skyStore.lens"
            class="l"
            :class="{ on: l.id === skyStore.lens }"
            @click="skyStore.setLens(l.id)"
          >
            {{ l.ko }}
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/*
 * 하늘 위에 얹히는 손잡이.
 * 창밖이 한낮이면 하얗고 밤이면 검다. 어느 쪽이든 읽히도록
 * 어두운 유리를 한 겹 깔고 글자는 밝게 둔다.
 */
.times {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 2px;
  background: rgba(10, 14, 20, 0.34);
  border: 1px solid rgba(242, 234, 217, 0.22);
  border-radius: 999px;
  backdrop-filter: blur(6px);
}
.t {
  padding: 4px 9px;
  font-family: inherit;
  font-size: var(--fs-2xs);
  letter-spacing: 0.02em;
  white-space: nowrap;
  color: rgba(242, 234, 217, 0.66);
  background: none;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition:
    color var(--dur-state) var(--ease-out),
    background-color var(--dur-state) var(--ease-out);
}
.t:hover {
  color: #f2ead9;
}
.t.on {
  color: #1a1c20;
  background: var(--color-gold-lit);
  font-weight: 600;
}

/* ── 렌즈 ── */
.lens-wrap {
  position: relative;
}
.lens-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  font-family: inherit;
  font-size: var(--fs-2xs);
  color: rgba(242, 234, 217, 0.7);
  background: rgba(10, 14, 20, 0.34);
  border: 1px solid rgba(242, 234, 217, 0.22);
  border-radius: 999px;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition:
    color var(--dur-state) var(--ease-out),
    border-color var(--dur-state) var(--ease-out);
}
.lens-btn:hover {
  color: #f2ead9;
}
.lens-btn.on {
  color: var(--color-gold-lit);
  border-color: color-mix(in srgb, var(--color-gold-lit) 55%, transparent);
}
.lens-btn svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
}
.lens-name {
  letter-spacing: 0.02em;
}

.lens-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 3px;
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-3);
}
.l {
  padding: 5px 12px;
  font-family: inherit;
  font-size: var(--fs-xs);
  white-space: nowrap;
  text-align: left;
  color: var(--color-ink-2);
  background: none;
  border: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.l:hover {
  background: var(--color-paper-2);
}
.l.on {
  color: var(--color-ink);
  font-weight: 600;
  background: var(--color-paper-2);
}

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity var(--dur-state) var(--ease-out),
    transform var(--dur-state) var(--ease-out);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 560px) {
  .t {
    padding: 4px 7px;
  }
}
</style>
