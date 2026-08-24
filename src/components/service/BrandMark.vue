<script setup>
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()

// 세 획이 같은 높이에서 시작하고 아래쪽 색이 차오른 만큼이 판정의 무게다.
// 서비스가 하는 말("같은 하늘, 다른 판단")을 그대로 형태로 옮겼다.
defineProps({
  size: { type: Number, default: 28 },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    role="img"
    :aria-label="configStore.t('brand.name')"
    class="mark"
  >
    <rect class="plate" width="32" height="32" rx="7" />
    <!-- 밤에는 판이 바닥에 묻히므로 아주 얇은 테두리로 경계를 살린다 -->
    <rect class="edge" x="0.5" y="0.5" width="31" height="31" rx="6.5" />
    <rect x="5.5" y="6" width="6" height="20" rx="2" fill="#8C99A6" />
    <rect x="5.5" y="20" width="6" height="6" rx="2" fill="#3E9B7C" />
    <rect x="13" y="6" width="6" height="20" rx="2" fill="#8C99A6" />
    <rect x="13" y="15" width="6" height="11" rx="2" fill="#D9922C" />
    <rect x="20.5" y="6" width="6" height="20" rx="2" fill="#8C99A6" />
    <rect x="20.5" y="10" width="6" height="16" rx="2" fill="#D14A41" />
  </svg>
</template>

<style scoped>
.mark {
  display: block;
  flex: none;
}

/*
 * 판 색을 값으로 박아 두었더니 어두운 화면에서 로고가 사라졌다.
 * 짙은 남색 판(#101C26)이 어두운 바닥과 거의 같은 밝기여서,
 * 남는 건 회색 획 세 개뿐이라 무슨 표식인지 알 수 없었다.
 *
 * 밤에는 판을 한 단 띄우고 테두리를 아주 얇게 둘렀다.
 * 획의 색(초록·주황·빨강)은 그대로 뒀다. 그게 이 표식의 알맹이다.
 */
.plate {
  fill: #101c26;
}
.edge {
  fill: none;
  stroke: none;
}
:root[data-theme='dark'] .plate {
  fill: #1e2c3a;
}
:root[data-theme='dark'] .edge {
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 1;
}
</style>
