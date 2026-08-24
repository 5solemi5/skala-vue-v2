<script setup>
import { computed, watch } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useConfigStore } from '@/stores/configStore'
import UnitToggler from './components/service/UnitToggler.vue'
import LangToggler from './components/service/LangToggler.vue'
import ThemeToggler from './components/service/ThemeToggler.vue'
import HereWeather from './components/service/HereWeather.vue'
import BrandMark from './components/service/BrandMark.vue'

const configStore = useConfigStore()

// 이름은 언어를 타므로 경로와 키만 두고 표시용 이름은 그때그때 만든다
const navList = computed(() => [
  { to: '/', label: configStore.t('nav.home') },
  { to: '/about', label: configStore.t('nav.about') },
])


/*
 * 낮과 밤을 바꿀 때만 색이 흐르게 한다.
 *
 * 전체에 transition 을 걸어 두면 화면을 처음 열 때도 색이 스며들듯 들어와서
 * 페이지가 느리게 뜨는 것처럼 보인다. 반대로 아무것도 안 걸면
 * 토글을 눌렀을 때 화면 전체가 툭 하고 뒤집혀 눈이 놀란다.
 *
 * 그래서 누른 순간에만 클래스를 붙이고, 다 바뀌면 뗀다.
 */
let turnTimer = null
watch(
  () => configStore.theme,
  () => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.add('theme-turning')
    clearTimeout(turnTimer)
    turnTimer = setTimeout(() => root.classList.remove('theme-turning'), 320)
  },
)
</script>

<template>
  <div class="site">
    <!--
      키보드로 들어온 사람을 위한 첫 칸.
      헤더에 눌릴 것이 여덟 개라 탭만으로 본문에 닿으려면 여덟 번을 지나야 한다.
      화면에는 안 보이고 탭을 누르면 나타난다.
    -->
    <a href="#main" class="skip">{{ configStore.t('nav.skip') }}</a>

    <!--
      머리.

      전에는 여기에 CSS 로 그린 하늘이 깔려 있었다. 시간대에 따라 물들고
      구름과 빗줄기가 지나가는 판이었는데, 판정 카드 위에 진짜 하늘이 생기고 나니
      같은 것을 두 군데서 하고 있었고 그중 하나는 눈에 띄게 못했다.

      머리는 하늘을 흉내 내는 대신 표지의 가장자리가 되기로 했다.
      금색 실선 한 줄과 이름과 손잡이. 하늘은 창에만 둔다.
    -->
    <header class="site-header">
      <div class="inner">
        <RouterLink to="/" class="brand">
          <BrandMark :size="30" />
          <span class="brand-text">
            <span class="brand-name">{{ configStore.t('brand.name') }}</span>
            <span class="brand-sub">{{ configStore.t('brand.tagline') }}</span>
          </span>
        </RouterLink>

        <nav class="nav" :aria-label="configStore.t('nav.mainAria')">
          <RouterLink v-for="item in navList" :key="item.to" :to="item.to" class="nav-item">
            {{ item.label }}
          </RouterLink>
        </nav>


        <!--
          누르면 값이 바뀌는 것들. nav 밖으로 뺐다.
          이전에는 nav 안에 있었는데, 이건 어디로 가는 링크가 아니라
          보는 방식을 바꾸는 스위치여서 '주요 메뉴' 라고 읽어 주면 안 맞는다.
          좁은 화면에서 메뉴와 따로 줄을 세우기도 이 편이 쉽다.
        -->
        <div class="tools">
          <HereWeather class="here" />
          <div class="switches">
            <ThemeToggler />
            <LangToggler />
            <UnitToggler />
          </div>
        </div>
      </div>
    </header>

    <main id="main" class="site-main">
      <div class="shell">
        <!--
          화면을 옮길 때 아주 짧게 스며들게 한다.
          길게 주면 메뉴를 눌러도 안 바뀐 것 같아서 한 번 더 누르게 된다.
        -->
        <RouterView v-slot="{ Component, route }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </div>
    </main>

    <footer class="site-footer">
      <div class="foot-inner">
        <p class="foot-left">{{ configStore.t('foot.credit') }}</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.site {
  min-height: 100vh;
  /*
   * 모바일 브라우저의 주소창이 접히고 펴질 때 100vh 가 튀어서
   * 화면 아래가 잘렸다 남았다 한다. dvh 를 받는 곳에서는 그걸 쓴다.
   */
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* 탭을 누르면 왼쪽 위에 내려앉는다 */
.skip {
  position: fixed;
  top: 0;
  left: var(--sp-3);
  z-index: 50;
  padding: var(--sp-2) var(--sp-3);
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--color-paper);
  background: var(--color-ink);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  text-decoration: none;
  transform: translateY(-110%);
  transition: transform var(--dur-move) var(--ease-out);
}
.skip:focus-visible {
  transform: translateY(0);
  outline-offset: -4px;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  isolation: isolate;
  background: color-mix(in srgb, var(--color-paper) 88%, transparent);
  backdrop-filter: blur(12px) saturate(118%);
  border-bottom: 1px solid var(--color-line);
}
/*
 * 표지의 금박 실선.
 * 머리와 본문 사이를 가르는 선인데, 회색 한 줄로 두면 그냥 경계선이고
 * 금색이 아주 옅게 섞이면 표지의 각인처럼 읽힌다.
 * 가운데만 진하고 양끝으로 사라지게 해서 선이 끊긴 자리가 안 보이게 했다.
 */
.site-header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  z-index: 2;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--color-gold) 55%, transparent) 18%,
    color-mix(in srgb, var(--color-gold) 80%, transparent) 50%,
    color-mix(in srgb, var(--color-gold) 55%, transparent) 82%,
    transparent 100%
  );
  pointer-events: none;
}
/*
 * 로고 / 주요 메뉴 / 스위치 / 수업 산출물 네 덩이를 격자에 앉힌다.
 *
 * flex + wrap 으로 두면 넘칠 때 어느 덩이가 내려갈지 폭이 정한다.
 * 그래서 언어를 바꾸거나 메뉴가 하나 늘면 배치가 저절로 달라졌다.
 * 격자에 자리를 정해 두면 글자 길이와 무관하게 있을 곳에 있는다.
 *
 *   로고  주요메뉴   스위치
 *   로고  수업산출물 수업산출물
 */
.inner {
  position: relative;
  z-index: 1;
  max-width: 860px;
  margin: 0 auto;
  /* 위아래를 넓혀 바탕의 하늘이 보일 자리를 준다 */
  padding: 18px var(--sp-5);
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas:
    'brand nav tools'
    'brand course course';
  align-items: center;
  column-gap: var(--sp-5);
  row-gap: var(--sp-1);
}
.brand {
  grid-area: brand;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  text-decoration: none;
  color: inherit;
}
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.brand-name {
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  font-weight: var(--display-weight);
  letter-spacing: var(--display-spacing);
  line-height: 1.15;
}
.brand-sub {
  font-size: var(--fs-2xs);
  letter-spacing: 0.02em;
  color: var(--color-ink-3);
}

.nav {
  grid-area: nav;
  /* 스위치 쪽에 붙여 둔다. 로고와 메뉴 사이가 벌어지는 편이 급이 읽힌다 */
  justify-self: end;
  display: flex;
  align-items: center;
  gap: var(--sp-4);
}

.course {
  grid-area: course;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.nav-item {
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--color-ink-2);
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 1.5px solid transparent;
  transition:
    color var(--dur-state) var(--ease-out),
    border-color var(--dur-state) var(--ease-out);
}
.nav-item:hover {
  color: var(--color-ink);
}
.nav-item.router-link-exact-active {
  color: var(--color-ink);
  /* 펼친 판의 색이 여기까지 온다 */
  border-bottom-color: var(--color-accent);
}


/* 수업 산출물 링크는 한 급 낮게 */
.sub-item {
  font-size: var(--fs-xs);
  color: var(--color-ink-3);
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 1px solid transparent;
  transition:
    color var(--dur-state) var(--ease-out),
    border-color var(--dur-state) var(--ease-out);
}
.sub-item:hover {
  color: var(--color-ink-2);
  border-bottom-color: var(--color-line-2);
}
.sub-item.router-link-exact-active {
  color: var(--color-ink);
  border-bottom-color: var(--color-ink-3);
}

.tools {
  grid-area: tools;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

/*
 * 언어와 단위와 밝기. 셋 다 보는 방식을 바꾸는 것이지만 생김새를 다르게 뒀다.
 * 사이를 조금 띄워서 서로 다른 스위치라는 게 먼저 읽히게 한다.
 */
.switches {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

/* 지금 있는 곳. 메뉴와 스위치 사이에 둬서 둘 중 어느 쪽도 아니라는 걸 보인다 */
.here {
  margin-right: 2px;
}

.site-main {
  flex: 1;
  padding: 0 var(--sp-5);
}
.shell {
  max-width: 860px;
  margin: var(--sp-8) auto 0;
}

/*
 * 화면 전환.
 * 아래에서 살짝 올라오게만 했다. 옆으로 밀면 뒤로 가는 건지
 * 앞으로 가는 건지를 방향이 말해 버려서, 메뉴로 옮길 때는 맞지 않는다.
 */
.page-enter-active {
  transition:
    opacity var(--dur-move) var(--ease-out),
    transform var(--dur-move) var(--ease-out);
}
.page-leave-active {
  transition: opacity 120ms var(--ease-out);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
}

.site-footer {
  margin-top: var(--sp-14);
  padding: 22px var(--sp-5) var(--sp-10);
  border-top: 1px solid var(--color-line);
}
.foot-inner {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
}
.foot-left {
  margin: 0;
  font-size: var(--fs-2xs);
  color: var(--color-ink-4);
}

/*
 * ── 좁은 화면 ────────────────────────────────────
 *
 * 전에는 브랜드 / 메뉴 / 스위치가 순서대로 접혀서 세 줄이 됐다.
 * 헤더가 붙박이라 세 줄이면 화면의 3할을 계속 차지한다.
 *
 * 지금은 두 줄로 세웠다.
 *   1줄 — 로고와 스위치. 늘 손이 가는 것들
 *   2줄 — 메뉴. 다섯 개가 한 줄에 안 들어가면 옆으로 밀어서 본다
 *
 * 접히게 두지 않고 옆으로 밀게 한 이유가 있다.
 * 접히면 헤더 높이가 언어나 화면 너비에 따라 달라져서,
 * 스크롤할 때 본문이 시작되는 자리가 화면마다 다르게 잡힌다.
 */
@media (max-width: 760px) {
  /*
   * 두 줄로 세운다.
   *   1줄 — 로고와 스위치. 늘 손이 가는 것들
   *   2줄 — 주요 메뉴
   *
   * 수업 산출물은 헤더에서 뺐다.
   * 헤더가 붙박이라 줄이 늘어날수록 본문을 보는 자리가 계속 줄어든다.
   * 세 줄이면 좁은 화면의 3할을 메뉴가 차지한다.
   * 이 링크들은 화면 맨 아래에도 똑같이 있어서 없어지는 게 아니다.
   */
  .inner {
    padding: var(--sp-3) var(--sp-4);
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'brand tools'
      'nav   nav';
    column-gap: var(--sp-2);
    row-gap: var(--sp-2);
  }
  .course {
    display: none;
  }
  .brand {
    min-width: 0;
  }
  .nav {
    justify-self: start;
    gap: var(--sp-4);
  }
  .tools,
  .switches {
    gap: var(--sp-2);
  }
  .site-main {
    padding: 0 var(--sp-4);
  }
  .shell {
    margin-top: var(--sp-5);
  }
  .site-footer {
    margin-top: var(--sp-8);
  }
}

/* 아주 좁을 때는 태그라인을 뺀다. 로고 이름만 있으면 알아본다 */
@media (max-width: 420px) {
  .brand-sub {
    display: none;
  }
  .brand-name {
    font-size: var(--fs-sm);
  }
}
</style>
