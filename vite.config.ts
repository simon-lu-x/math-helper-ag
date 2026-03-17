import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    // 开发环境：代理 /api 到本地 proxy server
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // 生产环境：VITE_API_BASE 注入为全局常量
  // 阿里云部署时在 .env.production 中设置:
  //   VITE_API_BASE=https://api.yourdomain.com
})
