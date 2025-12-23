import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载.env文件
  const env = loadEnv(mode, process.cwd(), '')
  // 安全地解析端口
  const parsePort = (port: string | undefined): number => {
    if (!port) return 8888
    const parsed = parseInt(port, 10)
    return isNaN(parsed) ? 8888 : parsed
  }
  return {
    plugins: [vue(), vueJsx(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: env.VITE_HOST || 'localhost',
      port: parsePort(env.VITE_PORT),
    },
  }
})
