<script setup>
import { ref, watch } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import PersonCard from './PersonCard.vue'
import TwinkleMark from './TwinkleMark.vue'
import PeopleAmbient from './PeopleAmbient.vue'

const configStore = useConfigStore()

const props = defineProps({
  people: { type: Array, required: true },
  isSample: { type: Boolean, default: false },
  weatherById: { type: Object, required: true },
  adviceById: { type: Object, required: true },
  labelById: { type: Object, required: true },
  selectedId: { type: String, default: '' },
})

defineEmits(['select', 'setup'])

/*
 * 사람이 늘거나 줄면 액자가 한 번 반응한다.
 * 배경에 계속 움직이는 것을 두는 대신 내가 뭘 했을 때만 반응하게 했다.
 * 아침에 판정을 읽는 화면이라 시선을 끌고 있으면 안 된다.
 */
const stirred = ref(false)
let timer = null

watch(
  () => props.people.length,
  (now, before) => {
    // 처음 그릴 때는 변화가 아니다
    if (before === undefined) return
    stirred.value = false
    clearTimeout(timer)
    // 클래스를 뗐다 붙여야 같은 동작을 연달아 다시 재생할 수 있다
    requestAnimationFrame(() => {
      stirred.value = true
      timer = setTimeout(() => (stirred.value = false), 900)
    })
  },
)
</script>

<template>
  <section class="board">
    <div class="head">
      <div class="title">
        <h2>
          {{ configStore.t('people.today') }}
          <span class="mark">
            {{ configStore.t('people.mine') }}
            <TwinkleMark class="spark" :size="22" />
          </span>
        </h2>
        <p class="sub">{{ configStore.t('people.count', { n: people.length }) }}</p>
      </div>

      <button type="button" class="setup" @click="$emit('setup')">
        {{ configStore.t(isSample ? 'people.setup' : 'people.setupMore') }}
      </button>
    </div>

    <!--
      흩어 놓지 않고 한 판에 담는다.
      각자 다른 곳에 있어도 아침에 한 번은 같이 보는 사람들이라
      카드가 따로 노는 것보다 한 액자에 들어가 있는 편이 맞다.
    -->
    <div class="frame" :class="{ stirred }">
      <TransitionGroup tag="div" class="grid" name="card">
        <PersonCard
          v-for="(person, i) in people"
          :key="person.id"
          :index="i"
          :person="person"
          :weather="weatherById[person.id]"
          :advice-list="adviceById[person.id] ?? []"
          :mode-label="labelById[person.modeId] ?? ''"
          :selected="person.id === selectedId"
          @select="$emit('select', person)"
        />
      </TransitionGroup>
    </div>

    <PeopleAmbient :people="people" />
  </section>
</template>

<style scoped>
.board {
  /* 아래 '무엇을 볼까요' 와 붙어 있으면 마당이 그쪽에 딸린 것처럼 보인다 */
  margin-bottom: 30px;
}
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
h2 {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.3;
}

/*
 * 이름 옆에 작은 반짝임 하나.
 * 밑줄을 그어봤더니 자로 잰 선처럼 뻣뻣해서, 아껴 두는 것에 표시를 남기듯 바꿨다.
 * 두 별의 박자를 어긋나게 해서 규칙적으로 깜빡이지 않게 했다.
 */
.mark {
  position: relative;
  white-space: nowrap;
  padding-right: 20px;
}
.spark {
  position: absolute;
  right: -2px;
  top: -8px;
  color: var(--color-ink);
}

.sub {
  margin: 14px 0 0;
  font-size: 12.5px;
  color: var(--color-ink-3);
}

.setup {
  font-family: inherit;
  font-size: 12px;
  color: var(--color-ink);
  background: none;
  border: 0;
  border-bottom: 1px solid var(--color-line-2);
  padding: 0 0 2px;
  cursor: pointer;
  white-space: nowrap;
}
.setup:hover {
  border-bottom-color: var(--color-ink);
}

/*
 * 액자 테두리.
 * 1px 그라디언트를 깔고 각도를 돌려서 빛이 테두리를 한 바퀴 도는 것처럼 보이게 했다.
 * 밝은 지점을 두 곳에 둬서 한쪽이 사라질 때 반대쪽이 들어온다.
 * 속도는 일부러 느리게 뒀다. 눈에 띄려고 넣은 게 아니라
 * 가만히 보고 있을 때 알아채는 정도가 맞다고 봤다.
 */
@property --sheen {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.frame {
  position: relative;
  padding: 1.5px;
  border-radius: 13px;
  background: conic-gradient(
    from var(--sheen),
    var(--color-line) 0deg,
    var(--color-line-2) 40deg,
    var(--gloss-edge) 68deg,
    var(--color-line-2) 96deg,
    var(--color-line) 150deg,
    var(--color-line) 210deg,
    var(--color-line-2) 244deg,
    var(--gloss-edge) 272deg,
    var(--color-line-2) 300deg,
    var(--color-line) 360deg
  );
  box-shadow:
    var(--shadow-1),
    var(--shadow-3);
  animation: sheen 9s linear infinite;
  /*
   * 테두리를 돌 때 가장 밝아지는 지점.
   * 낮에는 흰빛이 지나가는 것처럼 보이지만, 어두운 화면에서 흰 선을 그으면
   * 판이 아니라 유리 액자처럼 튀어서 한 단 눌러 둔다.
   */
  --gloss-edge: #ffffff;
}
:root[data-theme='dark'] .frame {
  --gloss-edge: color-mix(in srgb, var(--color-line-2) 70%, #ffffff);
}
@keyframes sheen {
  to {
    --sheen: 360deg;
  }
}

/* 판 안쪽 맨 위에 얇은 흰 선을 둬서 유리가 얹힌 것처럼 보이게 한다 */
.frame::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  top: 1.5px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--gloss) 30%,
    var(--gloss) 70%,
    transparent
  );
  pointer-events: none;
  z-index: 2;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(190px, 100%), 1fr));
  gap: 1px;
  background: var(--color-line);
  border-radius: 11.5px;
  overflow: hidden;
}

/*
 * 사람이 들어오고 나가는 움직임.
 *
 * 들어올 때는 아래에서 살짝 올라오며 자리를 잡고,
 * 나갈 때는 그 자리에서 조용히 물러난다.
 * 물러나는 동안 칸은 자리를 지키고, 다 물러난 뒤에 남은 칸들이 미끄러져 메운다.
 * 순서를 이렇게 둬야 "빠졌다 -> 메웠다" 로 읽힌다.
 */
.card-enter-active {
  transition:
    opacity 0.34s ease,
    transform 0.34s cubic-bezier(0.22, 1, 0.36, 1);
}
.card-leave-active {
  transition:
    opacity 0.26s ease,
    transform 0.26s ease;
}
.card-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.97);
}
.card-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
/* 남은 칸들이 새 자리로 미끄러진다 */
.card-move {
  transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}

/*
 * 액자가 한 번 반응한다.
 * 테두리에서 잉크빛 파문이 한 겹 번졌다 사라진다. 색은 쓰지 않았다.
 */
.frame::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 13px;
  pointer-events: none;
  opacity: 0;
  z-index: 3;
}
.frame.stirred::before {
  animation: stir 0.85s ease-out;
}
@keyframes stir {
  0% {
    opacity: 1;
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-ink) 22%, transparent);
  }
  100% {
    opacity: 0;
    box-shadow: 0 0 0 12px color-mix(in srgb, var(--color-ink) 0%, transparent);
  }
}

/* 폭이 좁아도 한 줄에 하나씩 쌓이면 열두 칸이 너무 길어진다. 두 칸씩 붙인다 */
@media (max-width: 520px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 움직임을 끈 사람에게는 자리만 바뀌고 동작은 없다 */
@media (prefers-reduced-motion: reduce) {
  .card-enter-active,
  .card-leave-active,
  .card-move {
    transition: none;
  }
  .frame.stirred::before {
    animation: none;
  }
}
</style>
