<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import TwinkleMark from './TwinkleMark.vue'

const configStore = useConfigStore()

const props = defineProps({
  person: { type: Object, required: true },
  weather: { type: Object, default: null },
  adviceList: { type: Array, default: () => [] },
  selected: { type: Boolean, default: false },
  modeLabel: { type: String, default: '' },
})

defineEmits(['select'])

const order = { stop: 0, warn: 1, info: 2, good: 3 }
const lead = computed(
  () => [...props.adviceList].sort((a, b) => order[a.level] - order[b.level])[0],
)
const displayTemp = computed(() =>
  props.weather ? configStore.convertTemp(props.weather.temp) : null,
)
</script>

<template>
  <button
    type="button"
    class="person"
    :class="[lead?.level, { on: selected }]"
    :aria-pressed="selected"
    @click="$emit('select', person)"
  >
    <TwinkleMark v-if="selected" class="spark" :size="20" />

    <span class="who">
      <i v-if="lead" class="pip" :class="lead.level" aria-hidden="true"></i>
      {{ person.who }}
    </span>

    <span class="place">
      {{ person.city.name }}
      <i class="dot" aria-hidden="true">·</i>
      <span class="job">{{ modeLabel }}</span>
    </span>

    <span v-if="weather" class="now">
      <span class="deg tnum"
        >{{ displayTemp }}<i>{{ configStore.unitSymbol }}</i></span
      >
      <img
        v-if="weather.icon"
        :src="`https://openweathermap.org/img/wn/${weather.icon}.png`"
        :alt="weather.description"
      />
    </span>
    <span v-else class="now dim">{{ configStore.t('people.loading') }}</span>

    <span v-if="lead" class="say">{{ lead.title }}</span>
  </button>
</template>

<style scoped>
.person {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  /* 열두 칸이 한 화면에 들어오도록 여백을 줄였다 */
  padding: 14px 14px 15px;
  font-family: inherit;
  text-align: left;
  background: var(--color-paper);
  border: 0;
  cursor: pointer;
  transition:
    background 0.14s ease,
    box-shadow 0.16s ease;
}
.person:hover {
  background: var(--color-paper-2);
}

/*
 * 처음엔 카드 위에 판정 색 막대를 깔았는데,
 * 네 곳이 모두 같은 등급이면 빨간 줄이 나란히 서서 경고판처럼 보였다.
 * 색은 문구에만 남기고 여기서는 작은 점 하나로 알린다.
 */

/*
 * 지금 보고 있는 칸.
 * 처음엔 나머지 칸을 어둡게 눌러서 대비를 줬는데,
 * 챙기는 사람들인데 고르지 않았다고 흐려지는 게 이상했다.
 * 나머지는 그대로 두고 고른 칸만 테두리를 둘러 또렷하게 한다.
 */
.person.on {
  background:
    radial-gradient(120% 90% at 78% 0%, var(--card-lift) 0%, transparent 62%),
    linear-gradient(168deg, var(--color-paper) 0%, var(--color-paper-2) 100%);
  box-shadow:
    inset 0 0 0 1.5px var(--color-ink),
    var(--shadow-3);
  z-index: 1;
}

/*
 * 고른 칸에는 그 사람의 오늘 판정 색을 옅게 깐다.
 * 색을 넣되 아무 색이나 쓰지 않고 판정 색을 그대로 써서,
 * 화면이 화사해지면서도 색이 여전히 뜻을 갖게 했다.
 */
.person.on.stop {
  background:
    radial-gradient(120% 90% at 78% 0%, var(--card-lift) 0%, transparent 62%),
    linear-gradient(168deg, var(--color-paper) 0%, var(--color-stop-soft) 100%);
}
.person.on.warn {
  background:
    radial-gradient(120% 90% at 78% 0%, var(--card-lift) 0%, transparent 62%),
    linear-gradient(168deg, var(--color-paper) 0%, var(--color-warn-soft) 100%);
}
.person.on.good {
  background:
    radial-gradient(120% 90% at 78% 0%, var(--card-lift) 0%, transparent 62%),
    linear-gradient(168deg, var(--color-paper) 0%, var(--color-good-soft) 100%);
}

/* 아래쪽 표시와 반짝임도 판정 색을 따라간다 */
.person.on.stop::after {
  background: var(--color-stop);
}
.person.on.warn::after {
  background: var(--color-warn);
}
.person.on.good::after {
  background: var(--color-good);
}
.person.on.stop .spark {
  color: var(--color-stop);
}
.person.on.warn .spark {
  color: var(--color-warn);
}
.person.on.good .spark {
  color: var(--color-good);
}

/*
 * 위쪽 빛은 배경 그라디언트로 넣었다.
 * 처음엔 흰 그라디언트를 가상요소로 덮었는데,
 * position: absolute 인 가상요소가 일반 콘텐츠 위에 그려져서 이름이 흐려 보였다.
 */

/* 고른 칸에만 얹히는 반짝임. 제목에 쓴 것과 같은 표시라 서로 이어져 보인다. */
.spark {
  position: absolute;
  right: 12px;
  top: 12px;
  color: var(--color-ink);
  opacity: 0.9;
}

/* 아래 큰 화면이 이 칸의 내용이라는 걸 알리는 표시 */
.person.on::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -1px;
  width: 22px;
  height: 3px;
  transform: translateX(-50%);
  border-radius: 3px 3px 0 0;
  background: var(--color-ink);
}

.who {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
/* 판정 등급을 알리는 작은 점. 지금 보고 있는 카드에서는 옅게 빛난다. */
.pip {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
  background: var(--color-line-2);
}
.pip.stop {
  background: var(--color-stop);
}
.pip.warn {
  background: var(--color-warn);
}
.pip.good {
  background: var(--color-good);
}
.person.on .pip {
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 0%, transparent);
}
.person.on .pip.stop {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-stop) 18%, transparent);
}
.person.on .pip.warn {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-warn) 18%, transparent);
}
.person.on .pip.good {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-good) 18%, transparent);
}
.place {
  margin-top: 4px;
  padding-left: 12px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-ink-2);
}
.place .dot {
  margin: 0 3px;
  font-style: normal;
  color: var(--color-ink-4);
}
.place .job {
  font-weight: 400;
  color: var(--color-ink-3);
}

.now {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 10px 0 9px;
  padding-left: 12px;
}
.deg {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1;
}
.deg i {
  font-size: 12px;
  font-weight: 500;
  font-style: normal;
  color: var(--color-ink-3);
  margin-left: 1px;
}
.now img {
  width: 30px;
  height: 30px;
  opacity: 0.8;
}
.now.dim {
  font-size: 12px;
  color: var(--color-ink-4);
}

.say {
  padding-left: 12px;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--color-ink-2);
}
.person.stop .say {
  color: var(--color-stop);
}
.person.warn .say {
  color: var(--color-warn);
}
.person.good .say {
  color: var(--color-good);
}
</style>
