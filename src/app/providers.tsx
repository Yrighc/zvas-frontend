import { HeroUIProvider } from '@heroui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { PropsWithChildren } from 'react'

const THEME_KEY = 'zvas.console.theme'

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
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
    [],
  )

  return (
    <HeroUIProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </HeroUIProvider>
  )
}
