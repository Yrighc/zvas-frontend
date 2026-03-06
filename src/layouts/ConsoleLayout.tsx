import { Avatar, Button } from '@heroui/react'
import {
  CodeBracketIcon,
  HomeIcon,
  ClockIcon,
  PowerIcon,
  Cog6ToothIcon,
  UserIcon,
  UsersIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline'
import { useTheme } from '@heroui/use-theme'
import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { logout } from '@/api/adapters/auth'
import { useAuthStore } from '@/store/auth'

const routeMetaMap = {
  'system-health': { title: '系统健康', kicker: 'SYSTEM HEALTH' },
  'system-version': { title: '系统版本', kicker: 'BUILD METADATA' },
  'system-settings': { title: '系统设置', kicker: 'PLATFORM SETTINGS' },
  'iam-users': { title: '用户管理', kicker: 'IDENTITY & ACCESS' },
  'iam-audits': { title: '审计日志', kicker: 'AUDIT TRAIL' },
} as const

/**
 * ConsoleLayout 提供 ZVAS 控制台的基础导航壳。
 */
export function ConsoleLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = useAuthStore((state) => state.currentUser)
  const clearSession = useAuthStore((state) => state.clearSession)
  const [logoutPending, setLogoutPending] = useState(false)
  const { theme, setTheme } = useTheme()

  const systemItems = useMemo(
    () => [
      { key: 'system-health', path: '/system/health', label: '系统健康', icon: <HomeIcon className="w-[18px] h-[18px]" /> },
      { key: 'system-version', path: '/system/version', label: '系统版本', icon: <CodeBracketIcon className="w-[18px] h-[18px]" /> },
      { key: 'system-settings', path: '/system/settings', label: '系统设置', icon: <Cog6ToothIcon className="w-[18px] h-[18px]" />, permission: 'settings:manage' },
    ],
    [],
  )

  const iamItems = useMemo(
    () => [
      { key: 'iam-users', path: '/iam/users', label: '用户管理', icon: <UsersIcon className="w-[18px] h-[18px]" />, permission: 'user:read' },
      { key: 'iam-audits', path: '/iam/audits', label: '审计日志', icon: <ClockIcon className="w-[18px] h-[18px]" />, permission: 'audit:read' },
    ],
    [],
  )

  const permissions = currentUser?.permissions || []
  const visibleSystemItems = systemItems.filter((item) => !item.permission || permissions.includes(item.permission))
  const visibleIAMItems = iamItems.filter((item) => !item.permission || permissions.includes(item.permission))
  const allItems = [...visibleSystemItems, ...visibleIAMItems]

  const selectedKey = useMemo(() => {
    if (location.pathname.includes('/iam/users')) return 'iam-users'
    if (location.pathname.includes('/iam/audits')) return 'iam-audits'
    if (location.pathname.includes('/system/version')) return 'system-version'
    if (location.pathname.includes('/system/settings')) return 'system-settings'
    return 'system-health'
  }, [location.pathname])

  const routeMeta = routeMetaMap[selectedKey as keyof typeof routeMetaMap] || routeMetaMap['system-health']

  const handleMenuClick = (key: string) => {
    const target = allItems.find((item) => item.key === key)
    if (target) navigate(target.path)
  }

  const handleLogout = async () => {
    setLogoutPending(true)
    try {
      await logout()
    } catch {
      // 后端当前为无状态 JWT，退出接口失败不影响本地清理。
    } finally {
      clearSession()
      setLogoutPending(false)
      navigate('/login', { replace: true })
    }
  }

  const renderMenuItem = (item: typeof allItems[0]) => {
    const isSelected = selectedKey === item.key
    return (
      <button
        key={item.key}
        onClick={() => handleMenuClick(item.key)}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 text-left group relative
          ${isSelected
            ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
            : 'text-apple-text-tertiary hover:bg-white/5 hover:text-apple-text-primary'
          }
        `}
      >
        {/* 选中指示器 */}
        {isSelected && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-apple-blue-light rounded-full" />
        )}
        <span className={`flex-shrink-0 transition-colors duration-200 ${isSelected ? 'text-apple-blue-light' : 'text-apple-text-tertiary group-hover:text-apple-text-secondary'}`}>
          {item.icon}
        </span>
        <span className={`text-[14px] font-medium tracking-tight transition-colors duration-200 ${isSelected ? 'font-semibold' : ''}`}>
          {item.label}
        </span>
      </button>
    )
  }

  return (
    <div className="flex h-screen w-full bg-apple-black overflow-hidden">
      {/* ===== 侧边栏 ===== */}
      <aside className="w-[260px] flex-shrink-0 flex flex-col relative z-20 border-r border-apple-border">
        {/* 磨砂玻璃背景层 */}
        <div className="absolute inset-0 bg-apple-bg/90 backdrop-blur-2xl pointer-events-none" />
        {/* 顶部微光渐变 */}
        <div className="absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-apple-blue/5 to-transparent pointer-events-none" />

        <div className="relative flex flex-col h-full">
          {/* 品牌区 */}
          <div className="px-6 pt-8 pb-6 flex flex-col gap-3">
            {/* Logo Mark */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-apple-blue to-apple-blue-light flex items-center justify-center shadow-lg shadow-apple-blue/30 flex-shrink-0">
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                  <div className="bg-white rounded-[2px] opacity-90" />
                  <div className="bg-white rounded-[2px] opacity-40" />
                  <div className="bg-white rounded-[2px] opacity-40" />
                  <div className="bg-white rounded-[2px] opacity-90" />
                </div>
              </div>
              <div>
                <div className="text-[11px] font-black tracking-[0.25em] text-apple-text-tertiary uppercase">ZVAS</div>
                <div className="text-[13px] font-semibold text-apple-text-primary tracking-tight leading-tight">Control Center</div>
              </div>
            </div>
          </div>

          {/* 分割线 */}
          <div className="mx-6 mb-4 h-px bg-apple-border" />

          {/* 导航区 */}
          <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-5">
            {/* SYSTEM 组 */}
            <div>
              <div className="text-[10px] font-black text-apple-text-tertiary tracking-[0.25em] uppercase mb-2 px-3">System</div>
              <nav className="flex flex-col gap-1">
                {visibleSystemItems.map(renderMenuItem)}
              </nav>
            </div>

            {/* IAM 组 */}
            {visibleIAMItems.length > 0 && (
              <div>
                <div className="text-[10px] font-black text-apple-text-tertiary tracking-[0.25em] uppercase mb-2 px-3">Identity</div>
                <nav className="flex flex-col gap-1">
                  {visibleIAMItems.map(renderMenuItem)}
                </nav>
              </div>
            )}
          </div>

          {/* 底部用户信息区 */}
          <div className="px-4 pt-4 pb-6 flex flex-col gap-3">
            <div className="h-px bg-apple-border" />
            <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/[0.04] border border-white/5">
              <Avatar
                size="sm"
                icon={<UserIcon className="w-4 h-4" />}
                classNames={{ base: "bg-gradient-to-br from-apple-blue to-apple-blue-light shadow shadow-apple-blue/20 flex-shrink-0" }}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-semibold text-apple-text-primary tracking-tight truncate leading-tight">
                  {currentUser?.name || '未知用户'}
                </span>
                <span className="text-[11px] text-apple-text-tertiary truncate leading-tight">
                  {currentUser?.role || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== 主体内容 ===== */}
      <main className="flex-1 flex flex-col min-w-0 bg-apple-black relative">
        {/* 顶部状态栏 */}
        <header className="h-[60px] flex-shrink-0 flex items-center justify-between px-8 border-b border-apple-border bg-apple-bg/60 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] font-black tracking-[0.25em] text-apple-text-tertiary uppercase leading-none mb-0.5">
                {routeMeta.kicker}
              </div>
              <h1 className="text-[16px] font-semibold text-apple-text-primary tracking-tight leading-tight">
                {routeMeta.title}
              </h1>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 border border-apple-blue-light/30 text-apple-blue-light bg-apple-blue-light/8 text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">
                center
              </span>
              <span className="inline-flex items-center gap-1 border border-apple-green-light/30 text-apple-green-light bg-apple-green-light/8 text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-apple-green-light shadow-[0_0_4px_rgba(50,215,75,0.8)]" />
                online
              </span>
            </div>
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-2">
            {/* 明暗主题切换按钮 */}
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              title={theme === 'dark' ? '切换至明亮模式' : '切换至深色模式'}
              onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="bg-white/5 text-apple-text-tertiary hover:text-apple-text-primary rounded-xl border border-apple-border w-9 h-9 min-w-0"
            >
              {theme === 'dark'
                ? <SunIcon className="w-4 h-4" />
                : <MoonIcon className="w-4 h-4" />}
            </Button>

            {/* 退出按钮 */}
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              isLoading={logoutPending}
              onPress={handleLogout}
              className="bg-apple-red/8 text-apple-red-light rounded-xl border border-apple-red/20 w-9 h-9 min-w-0"
            >
              <PowerIcon className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* 页面内容注入点 */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
