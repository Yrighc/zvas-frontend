import { HeroUIProvider } from '@heroui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'

import { getCurrentUser } from '@/api/adapters/auth'
import { useAuthStore } from '@/store/auth'

const THEME_KEY = 'zvas.console.theme'
const AUTH_ME_STALE_TIME = 30_000
const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// 在模块加载时初始化主题 class（@heroui/use-theme 读取 document.documentElement 的 class）
function initTheme() {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem(THEME_KEY) as 'dark' | 'light' | null
  const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  const initial = stored ?? preferred
  document.documentElement.classList.remove('dark', 'light')
  document.documentElement.classList.add(initial)
}

// 立即执行，确保首次渲染前主题已正确设置
initTheme()

/**
 * AppProviders 统一挂载 HeroUI 和 React Query。
 * 主题切换通过 @heroui/use-theme 的 useTheme() 在组件内完成。
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <HeroUIProvider>
      <QueryClientProvider client={appQueryClient}>
        <AuthBootstrap />
        {children}
      </QueryClientProvider>
    </HeroUIProvider>
  )
}

function AuthBootstrap() {
  const token = useAuthStore((state) => state.token)
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser)
  const setHydrating = useAuthStore((state) => state.setHydrating)
  const clearSession = useAuthStore((state) => state.clearSession)

  useEffect(() => {
    let active = true

    async function syncSession() {
      if (!token) {
        setHydrating(false)
        return
      }

      setHydrating(true)
      try {
        const user = await appQueryClient.fetchQuery({
          queryKey: ['auth', 'me', token],
          queryFn: getCurrentUser,
          staleTime: AUTH_ME_STALE_TIME,
        })
        if (!active) {
          return
        }
        setCurrentUser(user)
        setHydrating(false)
      } catch {
        if (!active) {
          return
        }
        clearSession()
      }
    }

    void syncSession()

    return () => {
      active = false
    }
  }, [clearSession, setCurrentUser, setHydrating, token])

  return null
}
