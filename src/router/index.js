import { createRouter, createWebHistory } from 'vue-router'
import WeatherHomeView from '../views/WeatherHomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'WeatherHome',
      component: WeatherHomeView,
    },
    {
      // 동적 경로 매칭 — 도시 코드를 파라미터로 받는다
      path: '/weather/:cityId',
      name: 'WeatherDetail',
      // 지연 로딩(Lazy Loading): 이 경로에 처음 들어갈 때 별도 청크를 내려받는다
      component: () => import('../views/WeatherDetailView.vue'),
    },
    {
      path: '/about',
      name: 'WeatherAbout',
      component: () => import('../views/WeatherAboutView.vue'),
    },
    {
      // Catch-all Route — 위 어느 규칙에도 걸리지 않은 주소를 모두 받는다
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

export default router
