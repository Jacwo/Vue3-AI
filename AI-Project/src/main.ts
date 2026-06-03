import { createApp } from 'vue'
import './assets/main.css'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import VConsole from 'vconsole'

import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'

// 移动端调试工具
new VConsole()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')