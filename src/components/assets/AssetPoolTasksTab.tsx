import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Chip, Skeleton, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react'
import {
  RocketLaunchIcon,
  BoltIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { PauseIcon, PlayIcon, StopIcon } from '@heroicons/react/24/solid'

import { CreateTaskFromPoolModal } from '@/components/assets/CreateTaskFromPoolModal'
import { useAssetPoolTasks } from '@/api/adapters/asset'
import { usePauseTask, useResumeTask, useStopTask, useDeleteTask, getTaskStatusInfo, getActiveGroupLabel, getBlockedReasonLabel, getTemplateCodeLabel, isTerminalTaskStatus, getTaskPreferredDetailPath } from '@/api/adapters/task'
import { useTaskRoutes, mapStageLabels, getRouteActiveLabel } from '@/api/adapters/route'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { TableFrame } from '@/components/table/TableFrame'
import { DEFAULT_TABLE_PAGE_SIZE, TablePaginationFooter } from '@/components/table/TablePaginationFooter'
import { ActionCell } from '@/components/table/cells/ActionCell'
import { TextCell } from '@/components/table/cells/TextCell'
import { TimeCell } from '@/components/table/cells/TimeCell'
import { TABLE_CLASS_NAMES } from '@/components/table/tableClassNames'
import { useAuthStore } from '@/store/auth'
import { PERMISSIONS, hasPermission } from '@/utils/permissions'

function buildTaskRouteSummary(
  activeRouteLabel: string,
  activeGroup: string,
  blockedReason: string,
  planLabels: string[],
) {
  if (blockedReason) {
    return `${blockedReason}${activeRouteLabel ? ` · ${activeRouteLabel}` : ''}`
  }
  if (activeRouteLabel && activeGroup) {
    return `${activeRouteLabel} · ${activeGroup}`
  }
  if (activeRouteLabel) {
    return activeRouteLabel
  }
  return planLabels.length > 0 ? planLabels.join(' • ') : '—'
}

export function AssetPoolTasksTab({ poolId }: { poolId: string }) {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const [createVisible, setCreateVisible] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [targetTask, setTargetTask] = useState<{ id: string; name: string } | null>(null)

  const { data, isLoading, isError, refetch } = useAssetPoolTasks(poolId, {
    page,
    page_size: pageSize,
    sort: 'updated_at',
    order: 'desc',
  })

  const pauseTask = usePauseTask()
  const resumeTask = useResumeTask()
  const stopTask = useStopTask()
  const deleteTask = useDeleteTask()
  const { data: routes } = useTaskRoutes()
  const canCreateTask = hasPermission(currentUser?.permissions, PERMISSIONS.taskCreate)
  const canControlTask = hasPermission(currentUser?.permissions, PERMISSIONS.taskUpdate)

  const items = data?.data || []
  const pagination = data?.pagination
  const total = pagination?.total ?? items.length
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize))
  }, [pageSize, total])

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-4">
        <div className="flex flex-col">
          <h3 className="text-xl font-black text-white tracking-tight mb-1 flex items-center gap-2">
            <BoltIcon className="w-6 h-6 text-apple-blue-light drop-shadow-[0_0_8px_rgba(0,113,227,0.5)]" />
            <span>靶向扫描任务线</span>
          </h3>
          <p className="text-[13px] text-apple-text-tertiary font-medium">查看基于当前资产池范围下发的全局任务，或直接发起新的探测调度流。</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="flat"
            isIconOnly
            className="h-12 w-12 rounded-[16px] bg-apple-tertiary-bg/10 border border-white/5 backdrop-blur-md"
            onPress={() => refetch()}
          >
            <ArrowPathIcon className="w-5 h-5 text-apple-text-secondary" />
          </Button>
          <Button
            variant="flat"
            onPress={() => navigate(`/tasks?asset_pool_id=${poolId}`)}
            className="h-12 rounded-[16px] px-6 bg-white/5 border border-white/5 text-apple-text-tertiary font-bold backdrop-blur-md hover:bg-white/10 transition-colors"
          >
            全局控制台视图
          </Button>
          <Button
            color="primary"
            variant="shadow"
            isDisabled={!canCreateTask}
            onPress={() => setCreateVisible(true)}
            className="h-12 rounded-[16px] px-6 font-bold shadow-apple-blue/30 bg-apple-blue"
          >
            <RocketLaunchIcon className="w-5 h-5 text-white" />
            <span className="text-white">由此下发新任务</span>
          </Button>
        </div>
      </div>

      <TableFrame className="custom-scrollbar scrollbar-hide md:scrollbar-default">
        <Table
          removeWrapper
          aria-label="Asset pool tasks table"
          layout="fixed"
          classNames={{
            ...TABLE_CLASS_NAMES,
            base: 'min-w-[1100px] p-4',
            tr: `${TABLE_CLASS_NAMES.tr} cursor-default`,
          }}
        >
          <TableHeader>
            <TableColumn width={240}>任务标识</TableColumn>
            <TableColumn width={220}>挂载模板序列</TableColumn>
            <TableColumn width={140}>流状态</TableColumn>
            <TableColumn width={240}>执行阶段进度</TableColumn>
            <TableColumn width={180}>时效</TableColumn>
            <TableColumn width={180} align="end">管控</TableColumn>
          </TableHeader>
          <TableBody
            isLoading={isLoading}
            loadingContent={<Skeleton className="h-40 w-full rounded-[24px] bg-white/5" />}
            emptyContent={
              isError ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                  <p className="text-[13px] font-bold uppercase tracking-widest text-apple-red-light">ERR_FETCH_TASKS</p>
                  <p className="text-[11px] text-apple-text-tertiary">调度网关读取失败，请检查网络或重试。</p>
                  <Button size="sm" variant="flat" onPress={() => refetch()} className="mt-2 bg-white/5 font-bold">RELOAD</Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                  <RocketLaunchIcon className="h-12 w-12 text-apple-blue-light opacity-30 drop-shadow-[0_0_12px_rgba(0,113,227,0.5)]" />
                  <p className="text-[13px] font-black uppercase tracking-[0.1em] text-white">NULL_TARGETED_TASKS</p>
                  <p className="max-w-sm text-[12px] font-medium text-apple-text-tertiary">当前资产池未关联任何存量扫描或探测任务，立刻创建以启动防护检查。</p>
                  <Button color="primary" variant="flat" isDisabled={!canCreateTask} onPress={() => setCreateVisible(true)} className="mt-2 rounded-xl font-black">
                    INITIATE TASK
                  </Button>
                </div>
              )
            }
          >
            {items.map((item) => {
              const statusInfo = getTaskStatusInfo(item.status, item.desired_state)
              const isTerminal = isTerminalTaskStatus(item.status)
              const activeRouteLabel = item.active_route_code ? getRouteActiveLabel(routes, item.active_route_code) : ''
              const planLabels = mapStageLabels(routes, item.route_plan.length > 0 ? item.route_plan : item.stage_plan)
              const routeSummary = buildTaskRouteSummary(
                activeRouteLabel,
                item.active_group ? getActiveGroupLabel(item.active_group) : '',
                !isTerminal && item.blocked_reason ? getBlockedReasonLabel(item.blocked_reason) : '',
                planLabels,
              )

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <TextCell value={item.name || '未命名任务'} limit={28} className="text-white" />
                  </TableCell>
                  <TableCell>
                    <TextCell
                      value={item.template_name || getTemplateCodeLabel(item.template_code)}
                      limit={28}
                      className="text-white"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color={statusInfo.color} classNames={{ base: 'border-0 font-black tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-md' }}>
                      {statusInfo.label}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <TextCell value={routeSummary} limit={38} className="text-apple-text-secondary" />
                  </TableCell>
                  <TableCell>
                    <TimeCell value={item.updated_at} />
                  </TableCell>
                  <TableCell>
                    <ActionCell>
                      <div className="mr-1 flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
                        {statusInfo.canPause && (
                          <Button isIconOnly size="sm" variant="light" isDisabled={!canControlTask} className="h-7 w-7 min-w-0 text-apple-warning hover:bg-apple-warning/20" onPress={() => pauseTask.mutate(item.id)}>
                            <PauseIcon className="w-4 h-4" />
                          </Button>
                        )}
                        {statusInfo.canResume && (
                          <Button isIconOnly size="sm" variant="light" isDisabled={!canControlTask} className="h-7 w-7 min-w-0 text-apple-green hover:bg-apple-green/20" onPress={() => resumeTask.mutate(item.id)}>
                            <PlayIcon className="w-4 h-4" />
                          </Button>
                        )}
                        {statusInfo.canStop && (
                          <Button isIconOnly size="sm" variant="light" isDisabled={!canControlTask} className="h-7 w-7 min-w-0 text-apple-red hover:bg-apple-red/20" onPress={() => stopTask.mutate(item.id)}>
                            <StopIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="bordered"
                        onPress={() => navigate(getTaskPreferredDetailPath(item))}
                        className="h-7 min-w-0 rounded-lg border-white/10 px-2.5 text-[11px] font-bold text-white"
                      >
                        详情
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        isDisabled={!canControlTask}
                        className="h-7 w-7 min-w-0 text-apple-red hover:bg-apple-red/20"
                        onPress={() => {
                          setTargetTask({ id: item.id, name: item.name || '未命名任务' })
                          setDeleteVisible(true)
                        }}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </ActionCell>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {!isLoading && !isError && items.length > 0 && (
          <TablePaginationFooter
            summary={(
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-apple-text-tertiary">
                合计任务流 <span className="mx-1 text-white">{total}</span> 项
              </span>
            )}
            page={page}
            total={total}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPage(1)
              setPageSize(nextPageSize)
            }}
          />
        )}
      </TableFrame>

      <CreateTaskFromPoolModal isOpen={createVisible} onClose={() => setCreateVisible(false)} poolId={poolId} />
      <ConfirmModal
        isOpen={deleteVisible}
        onClose={() => {
          setDeleteVisible(false)
          setTargetTask(null)
        }}
        title="确认删除当前任务？"
        message={`将只删除任务 "${targetTask?.name || '未命名任务'}"，不会删除当前资产池。任务会立即从列表中移除，关联执行数据将在后台异步清理。`}
        confirmText="确认删除"
        confirmColor="danger"
        isLoading={deleteTask.isPending}
        onConfirm={async () => {
          if (!targetTask) return
          await deleteTask.mutateAsync(targetTask.id)
          setDeleteVisible(false)
          setTargetTask(null)
        }}
      />
    </div>
  )
}
