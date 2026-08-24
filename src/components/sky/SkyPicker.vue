<script setup>
import { ref } from 'vue'
import { useSkyStore } from '@/stores/skyStore'
import { useConfigStore } from '@/stores/configStore'

/*
 * 어느 판을 펼칠까.
 *
 * 설정 항목처럼 두지 않았다.
 * 배경 고르기를 설정에 넣으면 한 번 고르고 다시 안 본다.
 * 여기서는 번호가 붙은 판을 넘겨 보는 일에 가깝게 만들었다.
 *
 * 고르면 배경만 바뀌지 않는다. 지면 색과 액센트, 표제 서체까지 따라 바뀐다.
 * 표지만 갈아 끼우고 속은 그대로면 고른 보람이 없다.
 */
const skyStore = useSkyStore()
const configStore = useConfigStore()

const isOpen = ref(false)
const showKnobs = ref(false)
</script>

<template>
  <div class="picker">
    <button
      type="button"
      class="tab"
      :aria-expanded="isOpen"
      :aria-label="configStore.t('sky.aria')"
      @click="isOpen = !isOpen"
    >
      <span class="no">#{{ skyStore.preset.no }}</span>
      <span class="en">{{ skyStore.preset.en }}</span>
      <span class="chev" :class="{ up: isOpen }" aria-hidden="true">▾</span>
    </button>

    <Transition name="drawer">
      <div v-if="isOpen" class="drawer">
        <!-- 제사. 판마다 한 줄씩 붙어 있다 -->
        <p class="epigraph">{{ skyStore.epigraph }}</p>

        <ul class="grid" role="listbox" :aria-label="configStore.t('sky.aria')">
          <li v-for="e in skyStore.editions" :key="e.id">
            <button
              type="button"
              role="option"
              :aria-selected="e.id === skyStore.skyId"
              class="card"
              :class="{ on: e.id === skyStore.skyId }"
              @click="skyStore.setSky(e.id)"
            >
              <!-- 판의 색 세 개를 미리 보여 준다 -->
              <span
                class="swatch"
                aria-hidden="true"
                :style="{
                  background: `linear-gradient(160deg, ${e.swatch[0]} 0%, ${e.swatch[1]} 52%, ${e.swatch[2]} 100%)`,
                }"
              >
                <span class="dot" :style="{ background: e.accent }"></span>
              </span>
              <span class="meta">
                <span class="cno">#{{ e.no }}</span>
                <span class="cen">{{ e.en }}</span>
                <span class="cko">{{ e.ko }}</span>
              </span>
            </button>
          </li>
        </ul>

        <p v-if="skyStore.skyId === 'live'" class="note">{{ configStore.t('sky.liveNote') }}</p>

        <!-- 손잡이. 어느 판을 골랐든 그 위에 얹힌다 -->
        <button type="button" class="knob-toggle" @click="showKnobs = !showKnobs">
          {{ configStore.t('sky.knobs') }}
          <span class="chev" :class="{ up: showKnobs }" aria-hidden="true">▾</span>
        </button>

        <div v-if="showKnobs" class="knobs">
          <label v-for="k in ['intensity', 'speed', 'grain']" :key="k" class="knob">
            <span class="kname">{{ configStore.t(`sky.${k}`) }}</span>
            <input
              type="range"
              min="0"
              max="1.6"
              step="0.05"
              :value="skyStore.knobs[k]"
              @input="skyStore.setKnob(k, Number($event.target.value))"
            />
            <span class="kval tnum">{{ Math.round(skyStore.knobs[k] * 100) }}</span>
          </label>
          <button type="button" class="reset" @click="skyStore.resetKnobs()">
            {{ configStore.t('sky.reset') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.picker {
  position: relative;
}

/* 창 위에 얹히는 손잡이. 하늘을 가리지 않게 테두리만 있다 */
.tab {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 9px;
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  letter-spacing: 0.08em;
  color: var(--color-gold-lit);
  background: rgba(10, 14, 20, 0.32);
  border: 1px solid color-mix(in srgb, var(--color-gold-lit) 38%, transparent);
  border-radius: 999px;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition:
    background-color var(--dur-state) var(--ease-out),
    border-color var(--dur-state) var(--ease-out);
}
.tab:hover {
  background: rgba(10, 14, 20, 0.5);
  border-color: var(--color-gold-lit);
}
.tab .no {
  font-weight: 600;
}
.tab .en {
  letter-spacing: 0.16em;
}
.chev {
  font-size: 9px;
  transition: transform var(--dur-move) var(--ease-out);
}
.chev.up {
  transform: rotate(180deg);
}

/* ── 펼친 서랍 ── */
.drawer {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 20;
  width: min(430px, calc(100vw - 40px));
  padding: 16px;
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-3);
}
.drawer-enter-active,
.drawer-leave-active {
  transition:
    opacity var(--dur-move) var(--ease-out),
    transform var(--dur-move) var(--ease-out);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.99);
}

/* 판마다 붙은 한 줄 */
.epigraph {
  margin: 0 0 14px;
  padding-bottom: 12px;
  font-family: var(--font-serif);
  font-size: var(--fs-sm);
  font-style: italic;
  line-height: 1.5;
  color: var(--color-ink-2);
  border-bottom: 1px solid var(--color-gold);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px;
  text-align: left;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    border-color var(--dur-state) var(--ease-out),
    background-color var(--dur-state) var(--ease-out);
}
.card:hover {
  background: var(--color-paper-2);
}
.card.on {
  border-color: var(--color-accent);
  background: var(--color-paper-2);
}

/* 판의 색을 미리 보여 주는 조각 */
.swatch {
  position: relative;
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
}
/* 액센트는 점 하나로. 이 색이 화면 전체로 번진다 */
.dot {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.25);
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.cno {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  color: var(--color-gold);
}
.cen {
  font-size: var(--fs-2xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cko {
  font-size: var(--fs-2xs);
  color: var(--color-ink-3);
}

.note {
  margin: 10px 0 0;
  font-size: var(--fs-2xs);
  color: var(--color-ink-3);
}

/* ── 손잡이 ── */
.knob-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 12px;
  padding: 0;
  font-family: inherit;
  font-size: var(--fs-2xs);
  color: var(--color-ink-3);
  background: none;
  border: 0;
  cursor: pointer;
}
.knob-toggle:hover {
  color: var(--color-ink);
}

.knobs {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-line);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.knob {
  display: grid;
  grid-template-columns: 44px 1fr 28px;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-2xs);
  color: var(--color-ink-2);
}
.kval {
  font-family: var(--font-mono);
  color: var(--color-ink-3);
  text-align: right;
}
input[type='range'] {
  width: 100%;
  height: 3px;
  appearance: none;
  background: var(--color-line-2);
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 999px;
  background: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-paper);
  cursor: pointer;
}
input[type='range']::-moz-range-thumb {
  width: 13px;
  height: 13px;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent);
  cursor: pointer;
}
.reset {
  align-self: flex-start;
  padding: 0;
  font-family: inherit;
  font-size: var(--fs-2xs);
  color: var(--color-ink-3);
  background: none;
  border: 0;
  text-decoration: underline;
  text-underline-offset: 0.22em;
  cursor: pointer;
}
.reset:hover {
  color: var(--color-ink);
}

@media (max-width: 520px) {
  .drawer {
    width: min(320px, calc(100vw - 32px));
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
