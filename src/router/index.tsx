import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import { appEnv } from '@/app/env'
import { ConsoleLayout } from '@/layouts/ConsoleLayout'
import { ErrorPage } from '@/pages/ErrorPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RequireAuth, RequirePermissions, RouterErrorFallback } from '@/router/guards'
import { PERMISSIONS } from '@/utils/permissions'

// 路由懒加载，优化打包体积
const OverviewPage = lazy(() => import('@/pages/OverviewPage').then(m => ({ default: m.OverviewPage })))
const SystemHealthPage = lazy(() => import('@/pages/SystemHealthPage').then(m => ({ default: m.SystemHealthPage })))
const SystemNetworkPage = lazy(() => import('@/pages/SystemNetworkPage').then(m => ({ default: m.SystemNetworkPage })))
const SystemVersionPage = lazy(() => import('@/pages/SystemVersionPage').then(m => ({ default: m.SystemVersionPage })))
const SystemSettingsPage = lazy(() => import('@/pages/SystemSettingsPage').then(m => ({ default: m.SystemSettingsPage })))
const UserManagementPage = lazy(() => import('@/pages/UserManagementPage').then(m => ({ default: m.UserManagementPage })))
const RolesPage = lazy(() => import('@/pages/iam/RolesPage').then(m => ({ default: m.RolesPage })))
const AuditLogPage = lazy(() => import('@/pages/AuditLogPage').then(m => ({ default: m.AuditLogPage })))

const AssetPoolsPage = lazy(() => import('@/pages/assets/AssetPoolsPage').then(m => ({ default: m.AssetPoolsPage })))
const AssetPoolDetailPage = lazy(() => import('@/pages/assets/AssetPoolDetailPage').then(m => ({ default: m.AssetPoolDetailPage })))

const TasksPage = lazy(() => import('@/pages/tasks/TasksPage').then(m => ({ default: m.TasksPage })))
const TaskNewPage = lazy(() => import('@/pages/tasks/TaskNewPage').then(m => ({ default: m.TaskNewPage })))
const TaskTemplatesPage = lazy(() => import('@/pages/tasks/TaskTemplatesPage').then(m => ({ default: m.TaskTemplatesPage })))
const TaskTemplateDetailPage = lazy(() => import('@/pages/tasks/TaskTemplateDetailPage').then(m => ({ default: m.TaskTemplateDetailPage })))
const WorkersPage = lazy(() => import('@/pages/tasks/WorkersPage').then(m => ({ default: m.WorkersPage })))
const TaskDetailPage = lazy(() => import('@/pages/tasks/TaskDetailPage').then(m => ({ default: m.TaskDetailPage })))

const FindingsPage = lazy(() => import('@/pages/findings/FindingsPage').then(m => ({ default: m.FindingsPage })))
const WeakScanFindingsPage = lazy(() => import('@/pages/findings/WeakScanFindingsPage').then(m => ({ default: m.WeakScanFindingsPage })))

/**
 * 局部骨架屏占位
 */
const renderPageLoader = () => (
  <div className="w-full h-full flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-apple-blue/20 border-t-apple-blue rounded-full animate-spin" />
      <p className="text-apple-text-tertiary text-[10px] tracking-[0.3em] font-black uppercase animate-pulse">
        Initializing_Module...
      </p>
    </div>
  </div>
)

/**
 * router 定义控制台初始化阶段的全部页面路由。
 */
export const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
      errorElement: <RouterErrorFallback />,
    },
    {
      path: '/',
      element: <RequireAuth />,
      errorElement: <RouterErrorFallback />,
      children: [
        {
          element: <ConsoleLayout />,
          children: [
            {
              index: true,
              element: <Navigate replace to="/overview" />,
            },
            {
              path: 'overview',
              handle: { requiredPermissions: [] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <OverviewPage />
                </Suspense>,
              ),
            },
            {
              path: 'system/health',
              handle: { requiredPermissions: [] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <SystemHealthPage />
                </Suspense>,
              ),
            },
            {
              path: 'system/network',
              handle: { requiredPermissions: [PERMISSIONS.settingsManage] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <SystemNetworkPage />
                </Suspense>,
                [PERMISSIONS.settingsManage],
              ),
            },
            {
              path: 'system/version',
              handle: { requiredPermissions: [] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <SystemVersionPage />
                </Suspense>,
              ),
            },
            {
              path: 'system/settings',
              handle: { requiredPermissions: [PERMISSIONS.settingsManage] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <SystemSettingsPage />
                </Suspense>,
                [PERMISSIONS.settingsManage],
              ),
            },
            {
              path: 'iam/users',
              handle: { requiredPermissions: [PERMISSIONS.userRead] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <UserManagementPage />
                </Suspense>,
                [PERMISSIONS.userRead],
              ),
            },
            {
              path: 'iam/roles',
              handle: { requiredPermissions: [PERMISSIONS.roleRead] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <RolesPage />
                </Suspense>,
                [PERMISSIONS.roleRead],
              ),
            },
            {
              path: 'iam/audits',
              handle: { requiredPermissions: [PERMISSIONS.auditRead] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <AuditLogPage />
                </Suspense>,
                [PERMISSIONS.auditRead],
              ),
            },
            {
              path: 'assets',
              handle: { requiredPermissions: [PERMISSIONS.assetSearch] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <AssetPoolsPage />
                </Suspense>,
                [PERMISSIONS.assetSearch],
              ),
            },

            {
              path: 'assets/:id',
              handle: { requiredPermissions: [PERMISSIONS.assetRead] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <AssetPoolDetailPage />
                </Suspense>,
                [PERMISSIONS.assetRead],
              ),
            },
            {
              path: 'tasks',
              handle: { requiredPermissions: [PERMISSIONS.taskRead] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <TasksPage />
                </Suspense>,
                [PERMISSIONS.taskRead],
              ),
            },
            {
              path: 'tasks/new',
              handle: { requiredPermissions: [PERMISSIONS.taskCreate] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <TaskNewPage />
                </Suspense>,
                [PERMISSIONS.taskCreate],
              ),
            },
            {
              path: 'tasks/templates',
              handle: { requiredPermissions: [PERMISSIONS.taskRead] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <TaskTemplatesPage />
                </Suspense>,
                [PERMISSIONS.taskRead],
              ),
            },
            {
              path: 'tasks/templates/:code',
              handle: { requiredPermissions: [PERMISSIONS.taskRead] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <TaskTemplateDetailPage />
                </Suspense>,
                [PERMISSIONS.taskRead],
              ),
            },
            {
              path: 'tasks/workers',
              handle: { requiredPermissions: [PERMISSIONS.taskRead] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <WorkersPage />
                </Suspense>,
                [PERMISSIONS.taskRead],
              ),
            },
            {
              path: 'tasks/:id',
              handle: { requiredPermissions: [PERMISSIONS.taskRead] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <TaskDetailPage />
                </Suspense>,
                [PERMISSIONS.taskRead],
              ),
            },
            {
              path: 'findings',
              handle: { requiredPermissions: [PERMISSIONS.findingRead] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <FindingsPage />
                </Suspense>,
                [PERMISSIONS.findingRead],
              ),
            },
            {
              path: 'findings/weak-scan',
              handle: { requiredPermissions: [PERMISSIONS.findingRead] },
              element: renderProtectedPage(
                <Suspense fallback={renderPageLoader()}>
                  <WeakScanFindingsPage />
                </Suspense>,
                [PERMISSIONS.findingRead],
              ),
            },
          ],
        },
      ],
    },
    {
      path: '/403',
      element: <ForbiddenPage />,
    },
    {
      path: '/error',
      element: <ErrorPage />,
    },
    {
      path: '*',
      element: <NotFoundPage />,
    },
  ],
  {
    basename: appEnv.basePath,
  },
)

function renderProtectedPage(element: ReactNode, requiredPermissions: string[] = []) {
  return <RequirePermissions requiredPermissions={requiredPermissions}>{element}</RequirePermissions>
}
