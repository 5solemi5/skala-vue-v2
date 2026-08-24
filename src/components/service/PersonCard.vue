<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'

/*
 * 챙기는 사람 한 칸.
 *
 * 레코드 뒷면의 수록곡처럼 짰다.
 * 번호가 앞에 서고, 이름, 그 아래 좌표, 아래에 기온.
 *
 * 번호를 붙인 이유가 있다.
 * 카드가 열둘까지 늘어나면 '세 번째 칸' 이라고 부를 수 있어야 하는데
 * 이름만 있으면 세어야 한다. 번호는 세지 않아도 읽힌다.
 *
 * 좌표는 장식이 아니다. 같은 이름의 지역이 여럿일 때
 * (광주광역시와 경기 광주시) 어느 쪽을 보고 있는지 밝히는 값이다.
 */
const configStore = useConfigStore()

const props = defineProps({
  person: { type: Object, required: true },
  weather: { type: Object, default: null },
  adviceList: { type: Array, default: () => [] },
  selected: { type: Boolean, default: false },
  modeLabel: { type: String, default: '' },
  index: { type: Number, default: 0 },
})

defineEmits(['select'])

const order = { stop: 0, warn: 1, info: 2, good: 3 }
const lead = computed(
  () => [...props.adviceList].sort((a, b) => order[a.level] - order[b.level])[0],
)
const displayTemp = computed(() =>
  props.weather ? configStore.convertTemp(props.weather.temp) : null,
)
const no = computed(() => String(props.index + 1).padStart(2, '0'))

// 카드가 좁아서 소수점 두 자리까지만 새긴다. 창의 각인은 네 자리다
const coord = computed(() => {
  const c = props.person.city
  if (!c || c.lat === undefined) return ''
  const ns = c.lat >= 0 ? 'N' : 'S'
  const ew = c.lon >= 0 ? 'E' : 'W'
  return `${Math.abs(c.lat).toFixed(2)}°${ns} ${Math.abs(c.lon).toFixed(2)}°${ew}`
})
</script>

<template>
  <button
    type="button"
    class="person"
    :class="[lead?.level, { on: selected }]"
    :aria-pressed="selected"
    @click="$emit('select', person)"
  >
    <span class="head">
      <span class="no">{{ no }}</span>
      <span class="who">{{ person.who }}</span>
      <i v-if="lead" class="pip" :class="lead.level" aria-hidden="true"></i>
    </span>

    <span class="place">
      {{ person.city.name }}
      <i class="dot" aria-hidden="true">·</i>
      <span class="job">{{ modeLabel }}</span>
    </span>

    <span v-if="coord" class="coord">{{ coord }}</span>

    <span class="foot">
      <span v-if="weather" class="deg tnum">
        {{ displayTemp }}<i>{{ configStore.unitSymbol }}</i>
      </span>
      <span v-else class="deg dim">{{ configStore.t('people.loading') }}</span>
      <img
        v-if="weather?.icon"
        :src="`https://openweathermap.org/img/wn/${weather.icon}.png`"
        :alt="weather.description"
      />
    </span>

    <span v-if="lead" class="say">{{ lead.title }}</span>
  </button>
</template>

<style scoped>
.person {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 15px 15px 16px;
  font-family: inherit;
  text-align: left;
  background: var(--color-paper);
  border: 0;
  cursor: pointer;
  transition:
    background-color var(--dur-state) var(--ease-out),
    box-shadow var(--dur-state) var(--ease-out);
}
.person:hover {
  background: var(--color-paper-2);
}

/* ── 머리: 번호 · 이름 · 판정 점 ── */
.head {
  display: flex;
  align-items: baseline;
  gap: 7px;
  width: 100%;
}
/*
 * 수록곡 번호.
 * 이름보다 한참 옅게 둔다. 세는 데 쓰는 값이지 읽는 값이 아니다.
 */
.no {
  flex: none;
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  color: var(--color-ink-4);
}
.who {
  min-width: 0;
  font-family: var(--font-display);
  font-size: var(--fs-md);
  font-weight: var(--display-weight);
  letter-spacing: var(--display-spacing);
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 판정은 줄 맨 끝에 점 하나로. 카드가 작아 글자를 더 넣을 자리가 없다 */
.pip {
  margin-left: auto;
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--color-ink-4);
  transform: translateY(-1px);
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

.place {
  font-size: var(--fs-xs);
  color: var(--color-ink-2);
}
.dot {
  margin: 0 3px;
  font-style: normal;
  color: var(--color-ink-4);
}
.job {
  color: var(--color-ink-3);
}

/* 금박 각인. 창의 좌표와 같은 표기다 */
.coord {
  margin-top: 3px;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.05em;
  color: var(--color-gold);
}

.foot {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 9px;
}
.deg {
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1;
  color: var(--color-ink);
}
.deg i {
  margin-left: 1px;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  color: var(--color-ink-3);
}
.deg.dim {
  font-size: var(--fs-xs);
  font-weight: 400;
  color: var(--color-ink-3);
}
.foot img {
  width: 30px;
  height: 30px;
  opacity: 0.85;
}

/* 오늘 이 사람이 챙길 말 한마디 */
.say {
  margin-top: 7px;
  font-size: var(--fs-xs);
  line-height: 1.45;
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

/*
 * 지금 보고 있는 칸.
 *
 * 나머지를 흐리게 눌러 대비를 주는 방법도 있지만 쓰지 않았다.
 * 다 챙기는 사람들인데 고르지 않았다고 흐려지는 게 이상하다.
 * 고른 칸만 또렷하게 세운다 — 왼쪽에 굵은 획 하나와 옅은 판정 색.
 */
.person.on {
  box-shadow: inset 3px 0 0 var(--color-ink);
}
.person.on.stop {
  background: linear-gradient(105deg, var(--color-paper) 42%, var(--color-stop-soft) 100%);
  box-shadow: inset 3px 0 0 var(--color-stop);
}
.person.on.warn {
  background: linear-gradient(105deg, var(--color-paper) 42%, var(--color-warn-soft) 100%);
  box-shadow: inset 3px 0 0 var(--color-warn);
}
.person.on.good {
  background: linear-gradient(105deg, var(--color-paper) 42%, var(--color-good-soft) 100%);
  box-shadow: inset 3px 0 0 var(--color-good);
}

@media (max-width: 560px) {
  .person {
    padding: 13px 13px 14px;
  }
  .deg {
    font-size: 22px;
  }
  .foot img {
    width: 26px;
    height: 26px;
  }
}
</style>
