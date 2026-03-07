import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = env.VITE_API_ORIGIN || ''
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8080'
  const useLocalProxy = mode === 'development' && !apiOrigin

  return {
    base: env.VITE_BASE_PATH || '/ui/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: useLocalProxy
      ? {
        proxy: {
          '/api': {
            target: devProxyTarget,
            changeOrigin: true,
          },
          '/healthz': {
            target: devProxyTarget,
            changeOrigin: true,
          },
          '/swagger': {
            target: devProxyTarget,
            changeOrigin: true,
          },
        },
      }
      : undefined,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }

            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/react-router/') ||
              id.includes('/node_modules/react-router-dom/')
            ) {
              return 'react'
            }

            if (id.includes('/node_modules/@tanstack/')) {
              return 'query'
            }

            if (id.includes('/node_modules/framer-motion/')) {
              return 'motion'
            }

            if (id.includes('/node_modules/@heroui/')) {
              return 'heroui'
            }

            if (id.includes('/node_modules/@react-aria/')) {
              return 'react-aria'
            }

            if (id.includes('/node_modules/@react-stately/')) {
              return 'react-stately'
            }

            if (id.includes('/node_modules/@react-types/')) {
              return 'react-types'
            }

            if (
              id.includes('/node_modules/@internationalized/') ||
              id.includes('/node_modules/intl-messageformat/')
            ) {
              return 'i18n'
            }

            return undefined
          },
        },
      },
    },
  }
})
