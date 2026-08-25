<script setup>
import { useSkyStore } from '@/stores/skyStore'
import { useConfigStore } from '@/stores/configStore'

/*
 * 창밖을 어떻게 볼까.
 *
 * 처음에는 하늘 열두 판을 고르게 했다. 지금은 두 가지를 고른다.
 *
 *   언제  그곳의 실제 일출·일몰로 계산한 시각. 그 시각의 실제 예보를 쓴다.
 *
 * 구름·비·바람은 고르게 하지 않는다.
 * 한때 '렌즈' 로 무엇을 도드라지게 볼지 고르게 해 봤는데,
 * 바람이 세면 하늘이 이미 바람 부는 것처럼 보여야지
 * 그걸 보려고 손잡이를 돌릴 이유가 없었다. 값이 그대로 그림이 된다.
 *
 * 그래서 남는 손잡이는 '언제' 하나뿐이다.
 * 지금 말고 다른 시각은 눌러 보지 않으면 볼 방법이 없어서 이건 남겼다.
 */
const skyStore = useSkyStore()
const configStore = useConfigStore()
</script>

<template>
  <div class="picker">
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

@media (max-width: 560px) {
  .t {
    padding: 4px 7px;
  }
}
</style>
