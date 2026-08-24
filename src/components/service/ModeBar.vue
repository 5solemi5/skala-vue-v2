<script setup>
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()

/*
 * 값을 위에서 내려받지 않고 스토어에서 바로 읽는다.
 * 이 칸은 화면 어디에 놓이든 하는 일이 같아서, 놓는 자리마다
 * 값을 넘겨 주는 배선을 따라다니게 할 이유가 없었다.
 */
</script>

<template>
  <div class="modebar">
    <p class="eyebrow">{{ configStore.t('mode.eyebrow') }}</p>
    <div class="seg" role="tablist" :aria-label="configStore.t('mode.aria')">
      <button
        v-for="mode in configStore.modeList"
        :key="mode.id"
        type="button"
        role="tab"
        :aria-selected="configStore.currentMode === mode.id"
        class="seg-item"
        :class="{ on: configStore.currentMode === mode.id }"
        @click="configStore.setMode(mode.id)"
      >
        <span class="what">{{ mode.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.modebar {
  display: flex;
  align-items: flex-end;
  gap: var(--sp-5);
  flex-wrap: wrap;
}
.eyebrow {
  margin: 0 0 10px;
  font-size: var(--fs-xs);
  letter-spacing: 0.14em;
  color: var(--color-ink-3);
  white-space: nowrap;
}
.seg {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}
.seg-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 2px 10px;
  margin-right: 24px;
  font-family: inherit;
  text-align: left;
  color: var(--color-ink-3);
  background: none;
  border: 0;
  cursor: pointer;
  transition: color var(--dur-state) var(--ease-out);
}
.what {
  font-size: var(--fs-base);
  font-weight: 500;
  white-space: nowrap;
}
.seg-item:last-child {
  margin-right: 0;
}
.seg-item:hover {
  color: var(--color-ink-2);
}
.seg-item.on .what {
  color: var(--color-ink);
  font-weight: 600;
}
/* 선택된 항목만 아래에 굵은 밑줄 */
.seg-item.on::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--color-ink);
}

/*
 * ── 좁은 화면 ────────────────────────────────────
 *
 * 전에는 간격만 좁혀 두 줄로 접었다. 두 가지가 걸렸다.
 *
 * 하나는 자리를 너무 먹는 것. 제목 줄과 두 줄짜리 탭이 겹쳐
 * 여는 순간 화면의 3할이 '무엇을 볼까요' 로 차 있었다.
 * 정작 봐야 하는 판정은 그만큼 아래로 밀렸다.
 *
 * 다른 하나는 접히는 자리가 폭에 따라 달라지는 것.
 * 어떤 폭에서는 '야구' 가 둘째 줄 맨 앞에 혼자 남아, 일곱 중 여섯과 하나로
 * 갈라진 것처럼 보였다. 일곱은 다 같은 급이라 그렇게 보이면 안 된다.
 *
 * 한 줄로 묶고 넘치면 옆으로 밀게 했다. 어디서 잘리든 급은 하나로 남는다.
 */
@media (max-width: 560px) {
  .modebar {
    flex-direction: column;
    align-items: stretch;
    gap: var(--sp-1);
  }
  .eyebrow {
    margin-bottom: 0;
  }
  .seg {
    flex-wrap: nowrap;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    /* 밀리는 항목이 잘려 보이도록 스크롤바는 감춘다 */
    scrollbar-width: none;
  }
  .seg::-webkit-scrollbar {
    display: none;
  }
  .seg-item {
    flex: none;
    scroll-snap-align: start;
    margin-right: 18px;
    padding-bottom: 8px;
  }
  .what {
    font-size: var(--fs-sm);
  }
}
</style>
