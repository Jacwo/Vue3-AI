import { createApp } from 'vue'
import './assets/main.css'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'

// 移动端调试工具 - 动态加载本地 vConsole
const script = document.createElement('script')
script.src = '/vconsole.min.js'
script.onload = () => {
  new (window as any).VConsole()
}
document.head.appendChild(script)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')