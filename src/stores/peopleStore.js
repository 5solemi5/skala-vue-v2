import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'skala-chaebi-people'

/**
 * 한 번에 챙길 수 있는 곳의 수.
 * 아침에 한 번 훑어보는 화면이라 스크롤 없이 들어오는 만큼으로 잡았다.
 */
export const MAX_PEOPLE = 12

/**
 * 챙기는 대상 목록.
 *
 * 처음에는 "하는 일"과 "지역"을 따로 골랐다.
 * 그런데 정비소는 전주에 있고 밭은 철원에 있는데
 * 정비소를 골라도 서울 날씨로 판정하고 있었다.
 * 대상마다 지역이 다르니 둘을 하나로 묶어야 맞다.
 *
 * 하나의 항목 = 부르는 이름 + 하는 일 + 지역
 *
 * 아래는 처음 들어온 사람에게 보여줄 예시다.
 * 무엇을 넣는 화면인지 한눈에 알 수 있도록 서로 다른 네 가지를 골랐다.
 */
const DEFAULT_PEOPLE = [
  {
    id: 'p_shop',
    who: '정비소',
    modeId: 'site',
    city: {
      id: 'geo_35.824_127.148',
      name: '전주',
      region: '전라북도',
      lat: 35.8242,
      lon: 127.148,
    },
  },
  {
    id: 'p_farm',
    who: '밭',
    modeId: 'farm',
    city: {
      id: 'geo_38.209_127.218',
      name: '철원',
      region: '강원도 철원군',
      lat: 38.2092,
      lon: 127.2175,
    },
  },
  {
    id: 'p_commute',
    who: '출퇴근길',
    modeId: 'commute',
    city: { id: 'geo_37.567_126.978', name: '서울', region: '수도권', lat: 37.5665, lon: 126.978 },
  },
  {
    id: 'p_game',
    who: '주말 경기',
    modeId: 'baseball',
    city: {
      id: 'geo_37.512_127.072',
      name: '잠실',
      region: '서울 송파구',
      lat: 37.5122,
      lon: 127.0719,
    },
  },
]

export const usePeopleStore = defineStore('people', () => {
/*
 * 저장된 사람의 '하는 일' 을 지금 목록으로 옮긴다.
 *
 * 하는 일을 일(직업·취미)과 일상 둘로 가르면서 목록이 갈렸다.
 * 예전에 저장된 사람은 '자전거' 나 '자동차 정비소' 를 하는 일로 갖고 있는데,
 * 자전거는 이제 일상 쪽이라 사람의 직업 자리에 있으면 안 된다.
 *
 * 그냥 버리면 등록해 둔 사람의 하는 일이 사라지므로 가까운 쪽으로 옮긴다.
 * 자전거로 다니는 사람은 대개 그걸로 출퇴근한다.
 */
const WORK_MODES = ['site', 'farm', 'commute', 'school', 'baseball', 'hike']
const MOVED = { repair: 'site', bike: 'commute', walk: 'commute', workout: 'hike' }

const fixJob = (person) => {
  if (WORK_MODES.includes(person.modeId)) return person
  return { ...person, modeId: MOVED[person.modeId] ?? 'site' }
}

  const load = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return structuredClone(DEFAULT_PEOPLE)
      const parsed = JSON.parse(saved)
      // 저장된 값이 깨졌을 때를 대비해 최소한의 모양만 확인한다
      const ok =
        Array.isArray(parsed) &&
        parsed.every((p) => p?.id && p?.who && p?.modeId && p?.city?.lat !== undefined)
      // 예전에 저장한 목록이 지금 상한보다 길 수도 있어서 잘라 둔다
      return ok ? parsed.slice(0, MAX_PEOPLE).map(fixJob) : structuredClone(DEFAULT_PEOPLE)
    } catch {
      return structuredClone(DEFAULT_PEOPLE)
    }
  }

  const people = ref(load())

  // 한 번도 손대지 않았으면 예시 목록이라는 뜻이다.
  // 버튼 문구를 '내 사람들로 바꾸기' / '사람 고치기' 로 갈라 쓰는 데 사용한다.
  const isSample = ref(localStorage.getItem(STORAGE_KEY) === null)
  const markTouched = () => {
    isSample.value = false
  }

  watch(
    people,
    (list) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
      } catch {
        // 저장이 막힌 환경에서는 넘어간다
      }
    },
    { deep: true },
  )

  const count = computed(() => people.value.length)
  const isFull = computed(() => people.value.length >= MAX_PEOPLE)

  const addPerson = (person) => {
    if (isFull.value) return false
    people.value.push({ ...person, id: `p_${Date.now()}` })
    markTouched()
    return true
  }

  const updatePerson = (id, patch) => {
    const target = people.value.find((p) => p.id === id)
    if (target) Object.assign(target, patch)
    markTouched()
  }

  const removePerson = (id) => {
    people.value = people.value.filter((p) => p.id !== id)
    markTouched()
  }

  const resetPeople = () => {
    people.value = structuredClone(DEFAULT_PEOPLE)
    isSample.value = true
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 저장이 막힌 환경에서는 넘어간다
    }
  }

  return { people, count, isFull, isSample, addPerson, updatePerson, removePerson, resetPeople }
})
