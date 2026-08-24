<script setup>
import { ref, watch } from 'vue'
import { searchCity } from '@/api/weatherApi'
import { useCityStore } from '@/stores/cityStore'
import { useConfigStore } from '@/stores/configStore'

/*
 * 내 지역을 더하고 빼는 칸.
 *
 * 예전 판에서는 shadcn 의 Button 과 bg-background / text-muted-foreground 같은
 * 유틸리티를 썼는데, 그 토큰이 어디에도 정의돼 있지 않았다.
 * 클래스는 붙어 있고 색은 안 나오니 테두리 없는 입력칸과 맨 글자 버튼이 나왔다.
 * 이 화면의 잉크·지면 토큰으로 다시 짰다. 낮과 밤이 함께 따라온다.
 */
const cityStore = useCityStore()
const configStore = useConfigStore()

const query = ref('')
const results = ref([])
const isSearching = ref(false)
const message = ref('')
const isOpen = ref(false)
const inputEl = ref(null)

const handleSearch = async () => {
  const q = query.value.trim()
  if (!q) return

  isSearching.value = true
  message.value = ''
  results.value = []

  try {
    const found = await searchCity(q)
    if (found.length === 0) message.value = configStore.t('city.notFound', { query: q })
    results.value = found
  } catch (error) {
    console.error('지역 검색 실패:', error)
    message.value = configStore.t('city.searchFail')
  } finally {
    isSearching.value = false
  }
}

const handleAdd = (city) => {
  const added = cityStore.addCity(city)
  message.value = configStore.t(added ? 'city.added' : 'city.exists', { name: city.name })
  if (added) {
    query.value = ''
    results.value = []
  }
}

const emit = defineEmits(['changed'])
const handleRemove = (city) => {
  cityStore.removeCity(city.id)
  message.value = configStore.t('city.removed', { name: city.name })
  emit('changed')
}

// 패널을 열면 바로 칠 수 있게 커서를 넣어 준다
const toggle = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await Promise.resolve()
    inputEl.value?.focus()
  }
}

// 위쪽 목록에서 '이 이름으로 지역 추가' 를 누르면 패널을 열고 그 이름으로 바로 찾는다
watch(
  () => cityStore.pendingQuery,
  async (q) => {
    if (!q) return
    isOpen.value = true
    query.value = q
    cityStore.clearPending()
    await handleSearch()
  },
)
</script>

<template>
  <div class="wrap">
    <header class="head">
      <h3>{{ configStore.t('city.title') }}</h3>
      <button type="button" class="ghost" :aria-expanded="isOpen" @click="toggle">
        {{ configStore.t(isOpen ? 'city.close' : 'city.manage') }}
      </button>
    </header>

    <!-- 지금 보고 있는 지역들 -->
    <ul class="chips">
      <li v-for="city in cityStore.cities" :key="city.id" class="chip">
        {{ city.name }}
        <button
          v-if="isOpen"
          type="button"
          class="x"
          :aria-label="configStore.t('city.removeAria', { name: city.name })"
          @click="handleRemove(city)"
        >
          ×
        </button>
      </li>
      <li v-if="cityStore.count === 0" class="dim">{{ configStore.t('city.empty') }}</li>
    </ul>

    <!-- 더하는 칸 -->
    <div v-if="isOpen" class="panel">
      <form class="row" @submit.prevent="handleSearch">
        <input
          ref="inputEl"
          v-model="query"
          type="text"
          class="field"
          :placeholder="configStore.t('city.searchPlaceholder')"
          :aria-label="configStore.t('city.searchLabel')"
        />
        <button type="submit" class="solid" :disabled="isSearching">
          {{ configStore.t(isSearching ? 'city.searching' : 'city.search') }}
        </button>
      </form>

      <ul v-if="results.length" class="results">
        <li v-for="city in results" :key="city.id">
          <span class="found">
            {{ city.name }}
            <span class="region">{{ city.region }}</span>
          </span>
          <button
            v-if="!cityStore.has(city.id)"
            type="button"
            class="outline"
            @click="handleAdd(city)"
          >
            {{ configStore.t('city.add') }}
          </button>
          <span v-else class="dim">{{ configStore.t('city.already') }}</span>
        </li>
      </ul>

      <!-- 결과를 알려 주는 줄. 읽어 주는 기계도 바뀔 때마다 듣는다 -->
      <p v-if="message" class="msg" role="status" aria-live="polite">{{ message }}</p>

      <button type="button" class="reset" @click="cityStore.resetCities()">
        {{ configStore.t('city.reset') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}
h3 {
  margin: 0;
  font-size: var(--fs-md);
  font-weight: 600;
  color: var(--color-ink);
}

/* ── 지금 목록. 알약으로 늘어놓는다 ── */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin: var(--sp-3) 0 0;
  padding: 0;
  list-style: none;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 4px 6px 4px 10px;
  font-size: var(--fs-xs);
  color: var(--color-ink-2);
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: 999px;
}
/* 지우는 단추는 패널을 열 때만 나온다. 평소에는 알약이 글자만 남는다 */
.x {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1;
  color: var(--color-ink-3);
  background: none;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition:
    color var(--dur-state) var(--ease-out),
    background-color var(--dur-state) var(--ease-out);
}
.x:hover {
  color: var(--color-paper);
  background: var(--color-stop);
}

/* ── 더하는 칸 ── */
.panel {
  margin-top: var(--sp-4);
  padding: var(--sp-4);
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
}
.row {
  display: flex;
  gap: var(--sp-2);
}
.field {
  flex: 1;
  min-width: 0;
  padding: 8px 11px;
  font-family: inherit;
  font-size: var(--fs-sm);
  color: var(--color-ink);
  background: var(--color-paper);
  border: 1px solid var(--color-line-2);
  border-radius: var(--radius-md);
  outline: none;
  transition:
    border-color var(--dur-state) var(--ease-out),
    box-shadow var(--dur-state) var(--ease-out);
}
.field::placeholder {
  color: var(--color-ink-4);
}
/*
 * 커서가 들어온 칸.
 * 테두리를 잉크색으로 바꾸고 바깥에 옅은 띠를 두른다.
 * 색을 쓰지 않은 건 판정 색과 겹치면 '주의' 로 읽히기 때문이다.
 */
.field:focus {
  border-color: var(--color-ink);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-ink) 12%, transparent);
}

/* ── 단추 세 가지 ── */
.solid,
.outline,
.ghost,
.reset {
  font-family: inherit;
  cursor: pointer;
  transition:
    color var(--dur-state) var(--ease-out),
    background-color var(--dur-state) var(--ease-out),
    border-color var(--dur-state) var(--ease-out);
}
.solid {
  flex: none;
  padding: 8px 14px;
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--color-paper);
  background: var(--color-ink);
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-md);
}
.solid:hover:not(:disabled) {
  background: var(--color-ink-2);
  border-color: var(--color-ink-2);
}
.solid:disabled {
  opacity: 0.55;
  cursor: default;
}
.outline {
  padding: 4px 10px;
  font-size: var(--fs-xs);
  font-weight: 500;
  color: var(--color-ink);
  background: none;
  border: 1px solid var(--color-line-2);
  border-radius: var(--radius-md);
}
.outline:hover {
  border-color: var(--color-ink);
}
.ghost {
  padding: 4px 8px;
  font-size: var(--fs-xs);
  color: var(--color-ink-3);
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
}
.ghost:hover {
  color: var(--color-ink);
  border-color: var(--color-line);
}

/* ── 찾은 결과 ── */
.results {
  margin: var(--sp-3) 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.results li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  padding: 6px 8px;
  font-size: var(--fs-sm);
  border-radius: var(--radius-md);
  transition: background-color var(--dur-state) var(--ease-out);
}
.results li:hover {
  background: var(--color-paper-2);
}
.found {
  min-width: 0;
}
/* 동명이지를 가르는 지역명. 이름보다 한 급 낮게 둔다 */
.region {
  margin-left: var(--sp-1);
  font-size: var(--fs-xs);
  color: var(--color-ink-3);
}

.msg {
  margin: var(--sp-3) 0 0;
  font-size: var(--fs-xs);
  color: var(--color-ink-2);
}
.dim {
  font-size: var(--fs-xs);
  color: var(--color-ink-3);
}
.reset {
  margin-top: var(--sp-3);
  padding: 0;
  font-size: var(--fs-xs);
  color: var(--color-ink-3);
  background: none;
  border: 0;
  text-decoration: underline;
  text-underline-offset: 0.22em;
}
.reset:hover {
  color: var(--color-ink);
}
</style>
