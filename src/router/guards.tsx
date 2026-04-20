import type { PropsWithChildren } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/auth'
import { hasAnyPermission } from '@/utils/permissions'

/**
 * RequireAuth 保护需要登录令牌的页面。
 */
export function RequireAuth() {
  const token = useAuthStore((state) => state.token)
  const hydrating = useAuthStore((state) => state.hydrating)
  const location = useLocation()

  if (token && hydrating) {
    return <GuardLoading />
  }

  if (!token) {
    const redirect = `/login?redirect=${encodeURIComponent(location.pathname)}`
    return <Navigate replace to={redirect} />
  }

  return <Outlet />
}

/**
 * RequirePermissions 保护需要特定权限的页面。
 */
export function RequirePermissions({ children, requiredPermissions = [] }: PropsWithChildren<{ requiredPermissions?: string[] }>) {
  const token = useAuthStore((state) => state.token)
  const hydrating = useAuthStore((state) => state.hydrating)
  const currentUser = useAuthStore((state) => state.currentUser)
  const location = useLocation()

  if (token && hydrating) {
    return <GuardLoading />
  }

  if (!token) {
    const redirect = `/login?redirect=${encodeURIComponent(location.pathname)}`
    return <Navigate replace to={redirect} />
  }

  if (!hasAnyPermission(currentUser?.permissions, requiredPermissions)) {
    return <Navigate replace to="/403" />
  }

  return <>{children}</>
}

/**
 * RouterErrorFallback 兜底展示路由级异常。
 */
export function RouterErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-[#f5f5f7]">
      <h1 className="text-2xl font-bold mb-4">页面渲染失败</h1>
      <p className="text-gray-400">前端路由在渲染当前页面时发生未处理异常。</p>
    </div>
  )
}

function GuardLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-apple-blue/20 border-t-apple-blue" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-apple-text-tertiary">
          Syncing_Session...
        </p>
      </div>
    </div>
  )
}
