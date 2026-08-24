// 이 화면의 스타일시트는 이 하나뿐이다. 토큰과 바탕이 전부 여기 있다.
import './assets/app.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
