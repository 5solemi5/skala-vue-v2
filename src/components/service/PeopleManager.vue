<script setup>
import { ref, computed } from 'vue'
import { searchCity } from '@/api/weatherApi'
import { usePeopleStore, MAX_PEOPLE } from '@/stores/peopleStore'
import { useConfigStore } from '@/stores/configStore'

const peopleStore = usePeopleStore()
const configStore = useConfigStore()

const emit = defineEmits(['changed'])

const isOpen = ref(false)
const editingId = ref('')

// 편집 중인 내용
const form = ref({ who: '', modeId: 'site', city: null })
const query = ref('')
const results = ref([])
const isSearching = ref(false)
const message = ref('')

const modeLabel = (id) => configStore.modeList.find((m) => m.id === id)?.label ?? ''
const isNew = computed(() => editingId.value === 'new')

const startEdit = (person) => {
  editingId.value = person.id
  form.value = { who: person.who, modeId: person.modeId, city: { ...person.city } }
  query.value = ''
  results.value = []
  message.value = ''
}

const startAdd = () => {
  if (peopleStore.isFull) {
    message.value = configStore.t('edit.fullRemove', { max: MAX_PEOPLE })
    return
  }
  editingId.value = 'new'
  form.value = { who: '', modeId: configStore.workModeList[0].id, city: null }
  query.value = ''
  results.value = []
  message.value = ''
}

const cancel = () => {
  editingId.value = ''
  message.value = ''
}

const handleSearch = async () => {
  const q = query.value.trim()
  if (!q) return
  isSearching.value = true
  message.value = ''
  results.value = []
  try {
    const found = await searchCity(q, configStore.lang)
    results.value = found
    if (!found.length)
      message.value = configStore.t('edit.noResult', { query: q })
  } catch (error) {
    console.error('지역 검색 실패:', error)
    message.value = configStore.t('edit.searchFail')
  } finally {
    isSearching.value = false
  }
}

const pickCity = (city) => {
  form.value.city = city
  results.value = []
  query.value = ''
}

const save = () => {
  const who = form.value.who.trim()
  if (!who) {
    message.value = configStore.t('edit.needWho')
    return
  }
  if (!form.value.city) {
    message.value = configStore.t('edit.needCity')
    return
  }

  if (isNew.value) {
    const added = peopleStore.addPerson({ who, modeId: form.value.modeId, city: form.value.city })
    if (!added) {
      message.value = configStore.t('edit.fullShort', { max: MAX_PEOPLE })
      return
    }
  } else {
    peopleStore.updatePerson(editingId.value, {
      who,
      modeId: form.value.modeId,
      city: form.value.city,
    })
  }
  editingId.value = ''
  emit('changed')
}

const resetToSample = () => {
  peopleStore.resetPeople()
  editingId.value = ''
  emit('changed')
}

const remove = (person) => {
  peopleStore.removePerson(person.id)
  if (editingId.value === person.id) editingId.value = ''
  emit('changed')
}
</script>

<template>
  <div>
    <div class="head">
      <div>
        <h3>
          {{ configStore.t('edit.title') }} <span class="cnt tnum">{{ peopleStore.count }}/{{ MAX_PEOPLE }}</span>
        </h3>
        <p class="hint">{{ configStore.t('edit.hint') }}</p>
      </div>
      <button type="button" class="ghost" @click="isOpen = !isOpen">
        {{ configStore.t(isOpen ? 'edit.close' : 'edit.open') }}
      </button>
    </div>

    <ul v-if="isOpen" class="list">
      <li v-for="person in peopleStore.people" :key="person.id" class="item">
        <!-- 편집 중이 아닐 때 -->
        <div v-if="editingId !== person.id" class="view">
          <span class="who">{{ person.who }}</span>
          <span class="meta">{{ modeLabel(person.modeId) }} · {{ person.city.name }}</span>
          <button type="button" class="ghost sm" @click="startEdit(person)">{{ configStore.t('edit.edit') }}</button>
          <button type="button" class="ghost sm danger" @click="remove(person)">{{ configStore.t('edit.delete') }}</button>
        </div>

        <!-- 편집 중 -->
        <form v-else class="edit" @submit.prevent="save">
          <label class="field">
            <span>{{ configStore.t('edit.who') }}</span>
            <input v-model="form.who" type="text" :placeholder="configStore.t('edit.whoPlaceholder')" />
          </label>

          <fieldset class="field">
            <legend>{{ configStore.t('edit.what') }}</legend>
            <div class="modes">
              <label v-for="mode in configStore.workModeList" :key="mode.id" class="radio">
                <input v-model="form.modeId" type="radio" :value="mode.id" />
                <span>{{ mode.label }}</span>
              </label>
            </div>
          </fieldset>

          <div class="field">
            <span class="lb">{{ configStore.t('edit.where') }}</span>
            <p v-if="form.city" class="picked">
              {{ form.city.name }}
              <small>{{ form.city.region }}</small>
              <button type="button" class="ghost sm" @click="form.city = null">{{ configStore.t('edit.change') }}</button>
            </p>
            <div v-else class="search">
              <input
                v-model="query"
                type="text"
                :placeholder="configStore.t('edit.cityPlaceholder')"
                @keydown.enter.prevent="handleSearch"
              />
              <button type="button" class="ghost sm" :disabled="isSearching" @click="handleSearch">
                {{ configStore.t(isSearching ? 'edit.searching' : 'edit.search') }}
              </button>
            </div>
            <ul v-if="results.length" class="results">
              <li v-for="c in results" :key="c.id">
                <button type="button" @click="pickCity(c)">
                  {{ c.name }} <small>{{ c.region }}</small>
                </button>
              </li>
            </ul>
          </div>

          <p v-if="message" class="msg">{{ message }}</p>

          <div class="actions">
            <button type="submit" class="primary">{{ configStore.t('edit.save') }}</button>
            <button type="button" class="ghost sm" @click="cancel">{{ configStore.t('edit.cancel') }}</button>
          </div>
        </form>
      </li>

      <!-- 새로 추가 -->
      <li v-if="isNew" class="item">
        <form class="edit" @submit.prevent="save">
          <label class="field">
            <span>{{ configStore.t('edit.who') }}</span>
            <input v-model="form.who" type="text" :placeholder="configStore.t('edit.whoPlaceholder')" />
          </label>

          <fieldset class="field">
            <legend>{{ configStore.t('edit.what') }}</legend>
            <div class="modes">
              <label v-for="mode in configStore.workModeList" :key="mode.id" class="radio">
                <input v-model="form.modeId" type="radio" :value="mode.id" />
                <span>{{ mode.label }}</span>
              </label>
            </div>
          </fieldset>

          <div class="field">
            <span class="lb">{{ configStore.t('edit.where') }}</span>
            <p v-if="form.city" class="picked">
              {{ form.city.name }}
              <small>{{ form.city.region }}</small>
              <button type="button" class="ghost sm" @click="form.city = null">{{ configStore.t('edit.change') }}</button>
            </p>
            <div v-else class="search">
              <input
                v-model="query"
                type="text"
                :placeholder="configStore.t('edit.cityPlaceholder')"
                @keydown.enter.prevent="handleSearch"
              />
              <button type="button" class="ghost sm" :disabled="isSearching" @click="handleSearch">
                {{ configStore.t(isSearching ? 'edit.searching' : 'edit.search') }}
              </button>
            </div>
            <ul v-if="results.length" class="results">
              <li v-for="c in results" :key="c.id">
                <button type="button" @click="pickCity(c)">
                  {{ c.name }} <small>{{ c.region }}</small>
                </button>
              </li>
            </ul>
          </div>

          <p v-if="message" class="msg">{{ message }}</p>

          <div class="actions">
            <button type="submit" class="primary">{{ configStore.t('edit.add') }}</button>
            <button type="button" class="ghost sm" @click="cancel">{{ configStore.t('edit.cancel') }}</button>
          </div>
        </form>
      </li>
    </ul>

    <div v-if="isOpen && !isNew" class="foot">
      <button v-if="!peopleStore.isFull" type="button" class="ghost sm" @click="startAdd">
        {{ configStore.t('edit.addPerson') }}
      </button>
      <span v-else class="full"
        >{{ configStore.t('edit.full', { max: MAX_PEOPLE }) }}</span
      >
      <button type="button" class="ghost sm dim" @click="resetToSample">{{ configStore.t('edit.reset') }}</button>
    </div>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}
h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.hint {
  margin: 5px 0 0;
  max-width: 42ch;
  font-size: 12px;
  line-height: 1.65;
  color: var(--color-ink-3);
}

.list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-line);
}
.item {
  border-bottom: 1px solid var(--color-line);
}

.view {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 0;
}
.who {
  font-size: 13.5px;
  font-weight: 600;
  min-width: 5rem;
}
.meta {
  flex: 1;
  font-size: 12.5px;
  color: var(--color-ink-3);
}

.edit {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 0 18px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: 0;
}
.field > span,
.field legend,
.lb {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--color-ink-3);
  padding: 0;
}
input[type='text'] {
  width: 100%;
  padding: 8px 11px;
  font-family: inherit;
  font-size: 13.5px;
  color: var(--color-ink);
  background: var(--color-paper);
  border: 1px solid var(--color-line-2);
  border-radius: 4px;
  outline: none;
}
input[type='text']:focus {
  border-color: var(--color-ink-3);
}

.modes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.radio {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  font-size: 12.5px;
  border: 1px solid var(--color-line-2);
  border-radius: 999px;
  cursor: pointer;
}
.radio input {
  accent-color: var(--color-ink);
  margin: 0;
}
.radio:has(input:checked) {
  border-color: var(--color-ink);
  background: var(--color-paper-2);
  font-weight: 500;
}

.search {
  display: flex;
  gap: 6px;
}
.picked {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13.5px;
  font-weight: 500;
}
.picked small {
  font-size: 11.5px;
  font-weight: 400;
  color: var(--color-ink-3);
}
.results {
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--color-line);
  border-radius: 4px;
  overflow: hidden;
}
.results li + li {
  border-top: 1px solid var(--color-line);
}
.results button {
  width: 100%;
  padding: 9px 11px;
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  background: var(--color-paper);
  border: 0;
  cursor: pointer;
}
.results button:hover {
  background: var(--color-paper-2);
}
.results small {
  margin-left: 6px;
  font-size: 11.5px;
  color: var(--color-ink-3);
}

.msg {
  margin: 0;
  font-size: 12px;
  color: var(--color-stop);
}
.actions {
  display: flex;
  gap: 8px;
}

.cnt {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 400;
  color: var(--color-ink-4);
}
.full {
  font-size: 11.5px;
  color: var(--color-ink-3);
}
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 12px;
}

button {
  font-family: inherit;
  cursor: pointer;
}
.primary {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-paper);
  background: var(--color-ink);
  border: 0;
  border-radius: 4px;
}
.ghost {
  padding: 5px 11px;
  font-size: 12px;
  color: var(--color-ink-2);
  background: none;
  border: 1px solid var(--color-line-2);
  border-radius: 4px;
}
.ghost:hover {
  border-color: var(--color-ink-3);
  color: var(--color-ink);
}
.ghost.sm {
  padding: 4px 9px;
  font-size: 11.5px;
}
.ghost.danger:hover {
  color: var(--color-stop);
  border-color: var(--color-stop);
}
.ghost.dim {
  border-color: transparent;
  color: var(--color-ink-4);
}
.ghost.dim:hover {
  color: var(--color-ink-2);
}
</style>
