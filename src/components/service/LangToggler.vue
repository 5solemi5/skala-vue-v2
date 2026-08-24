<script setup>
import { useConfigStore } from '@/stores/configStore'
import { LANGS } from '@/locales'

const configStore = useConfigStore()
</script>

<template>
  <!--
    처음에는 단위 토글과 똑같은 모양으로 맞췄다.
    그랬더니 회색 알약 두 개가 나란히 붙어서 네 칸짜리 스위치 하나처럼 보였다.
    무엇을 누르는 건지 알 수 없어서 형태를 갈랐다.

    단위는 값을 바꾸는 것이라 눌리는 스위치로 두고,
    언어는 이 화면이 무슨 말로 쓰였는지 고르는 것이라 활자를 고르듯 만들었다.
    판정을 테두리 친 글자로 보여주는 방식이 이 화면의 표시법이라 그 결을 이어받되,
    판정과 헷갈리지 않게 색은 넣지 않고 잉크색 테두리만 썼다.
  -->
  <div class="lang" role="group" :aria-label="configStore.t('lang.aria')">
    <template v-for="(item, i) in LANGS" :key="item.id">
      <span v-if="i" class="slash" aria-hidden="true">/</span>
      <button
        type="button"
        :class="{ on: configStore.lang === item.id }"
        :aria-pressed="configStore.lang === item.id"
        :title="item.label"
        @click="configStore.setLang(item.id)"
      >
        {{ item.short }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.lang {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

/* 두 글자 사이를 가르는 얇은 빗금. 활자 견본에서 서체를 나란히 두던 방식 */
.slash {
  font-size: 11px;
  font-weight: 300;
  color: var(--color-ink-4);
  user-select: none;
  transform: translateY(-0.5px);
}

.lang button {
  position: relative;
  min-width: 26px;
  padding: 3px 6px 4px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
  line-height: 1;
  color: var(--color-ink-3);
  background: none;
  border: 1px solid transparent;
  border-radius: 2px;
  cursor: pointer;
  transition:
    color 0.14s ease,
    border-color 0.14s ease,
    background 0.14s ease;
}
.lang button:hover {
  color: var(--color-ink-2);
  border-color: var(--color-line);
}

/*
 * 고른 글자에만 테두리를 두른다.
 * 안쪽에 아주 옅은 흰빛을 깔아서 종이에 찍힌 활자처럼 살짝 떠 보이게 했다.
 */
.lang button.on {
  color: var(--color-ink);
  border-color: var(--color-ink);
  background: linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper-2) 100%);
  box-shadow: inset 0 1px 0 var(--gloss);
}
.lang button.on:hover {
  border-color: var(--color-ink);
}

/* 눌리는 순간 살짝 내려앉는다 */
.lang button:active {
  transform: translateY(0.5px);
}

@media (prefers-reduced-motion: reduce) {
  .lang button {
    transition: none;
  }
  .lang button:active {
    transform: none;
  }
}
</style>
