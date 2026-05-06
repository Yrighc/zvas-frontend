import { useMemo, useState } from 'react'
import {
  Button,
  Input,
  Select,
  SelectItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import { ArrowPathIcon, KeyIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

import { useAssetPools } from '@/api/adapters/asset'
import { useSecprobeFindings } from '@/api/adapters/finding'
import { DEFAULT_TABLE_PAGE_SIZE, TablePaginationFooter } from '@/components/table/TablePaginationFooter'
import { ActionCell } from '@/components/table/cells/ActionCell'
import { MonoCell } from '@/components/table/cells/MonoCell'
import { TextCell } from '@/components/table/cells/TextCell'
import { TimeCell } from '@/components/table/cells/TimeCell'
import { APPLE_TABLE_CLASSES } from '@/utils/theme'

function firstNonEmptyText(...values: unknown[]): string {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const text = typeof value === 'string' ? value.trim() : String(value).trim()
    if (text) return text
  }
  return ''
}

function buildTaskSummary(taskName?: string, taskID?: string): string {
  return firstNonEmptyText(taskName, taskID, '-')
}

export function SecprobeFindingsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [target, setTarget] = useState('')
  const [assetPoolID, setAssetPoolID] = useState('all')
  const [taskName, setTaskName] = useState('')
  const [service, setService] = useState('')
  const [success, setSuccess] = useState('true')

  const poolsQuery = useAssetPools({ page: 1, page_size: 100, sort: 'updated_at', order: 'desc' })

  const queryParams = useMemo(() => ({
    page,
    page_size: pageSize,
    target: target.trim() || undefined,
    asset_pool_id: assetPoolID === 'all' ? undefined : assetPoolID,
    task_name: taskName.trim() || undefined,
    service: service.trim() || undefined,
    success: success === 'all' ? undefined : success === 'true',
    sort: 'matched_at',
    order: 'desc',
  }), [assetPoolID, page, pageSize, service, success, target, taskName])

  const findingsQuery = useSecprobeFindings(queryParams)
  const items = findingsQuery.data?.data || []
  const total = findingsQuery.data?.pagination?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-col gap-8 w-full text-apple-text-primary animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-20 p-4">
      <section className="flex flex-col gap-4 mt-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-white flex items-center gap-3">
            <KeyIcon className="w-7 h-7 text-apple-blue-light" />
            <span>全局弱口令结果</span>
          </h1>
          <p className="mt-2 text-[13px] text-apple-text-tertiary">
            汇总展示所有 secprobe 任务的弱口令命中与尝试结果，适合从主机和服务维度观察横向风险面。
          </p>
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px_240px_200px_180px_auto]">
          <Input
            isClearable
            value={target}
            placeholder="按目标主机 / IP 搜索"
            onValueChange={(value) => { setTarget(value); setPage(1) }}
            variant="flat"
            startContent={<MagnifyingGlassIcon className="w-5 h-5 text-apple-text-tertiary" />}
            classNames={{ inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md', input: 'text-base font-medium placeholder:text-apple-text-tertiary' }}
          />
          <Select
            aria-label="资产池筛选"
            selectedKeys={[assetPoolID]}
            onChange={(event) => { setAssetPoolID(event.target.value || 'all'); setPage(1) }}
            variant="flat"
            classNames={{ trigger: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md', value: 'text-apple-text-primary' }}
          >
            <SelectItem key="all">全部资产池</SelectItem>
            <>
              {(poolsQuery.data?.data || []).map((pool) => (
                <SelectItem key={pool.id} textValue={pool.name || pool.id}>{pool.name || pool.id}</SelectItem>
              ))}
            </>
          </Select>
          <Input
            isClearable
            value={taskName}
            placeholder="按任务名称搜索"
            onValueChange={(value) => { setTaskName(value); setPage(1) }}
            variant="flat"
            classNames={{ inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md', input: 'text-base font-medium placeholder:text-apple-text-tertiary' }}
          />
          <Input
            isClearable
            value={service}
            placeholder="按服务名搜索"
            onValueChange={(value) => { setService(value); setPage(1) }}
            variant="flat"
            classNames={{ inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md', input: 'text-base font-medium placeholder:text-apple-text-tertiary' }}
          />
          <Select
            aria-label="命中状态筛选"
            selectedKeys={[success]}
            onChange={(event) => { setSuccess(event.target.value || 'true'); setPage(1) }}
            variant="flat"
            classNames={{ trigger: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md', value: 'text-apple-text-primary' }}
          >
            <SelectItem key="true">仅看命中</SelectItem>
            <SelectItem key="all">全部结果</SelectItem>
            <SelectItem key="false">仅看未命中</SelectItem>
          </Select>
          <Button
            variant="flat"
            isIconOnly
            className="h-14 w-14 rounded-[20px] bg-apple-tertiary-bg/10 border border-white/5 backdrop-blur-md"
            onPress={() => findingsQuery.refetch()}
          >
            <ArrowPathIcon className="w-6 h-6 text-apple-text-secondary" />
          </Button>
        </div>
      </section>

      <div className="rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl overflow-x-auto">
        <Table
          aria-label="Global secprobe findings table"
          layout="fixed"
          removeWrapper
          classNames={{ ...APPLE_TABLE_CLASSES, base: 'p-4 min-w-[1420px]' }}
        >
          <TableHeader>
            <TableColumn width={220}>目标主机</TableColumn>
            <TableColumn width={150}>解析 IP</TableColumn>
            <TableColumn width={140}>服务</TableColumn>
            <TableColumn width={100}>端口</TableColumn>
            <TableColumn width={140}>账号</TableColumn>
            <TableColumn width={120}>结果</TableColumn>
            <TableColumn width={220}>来源任务</TableColumn>
            <TableColumn width={220}>资产池</TableColumn>
            <TableColumn width={180}>发现时间</TableColumn>
            <TableColumn width={110} align="end">操作</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={<div className="h-40 flex items-center justify-center text-apple-text-tertiary font-bold">当前暂无弱口令结果。</div>}
            isLoading={findingsQuery.isPending}
            loadingContent={<Skeleton className="rounded-xl w-full h-40 bg-white/5" />}
          >
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell><MonoCell value={item.target_host || '-'} limit={24} className="text-apple-blue-light" /></TableCell>
                <TableCell><MonoCell value={item.resolved_ip || '-'} limit={18} className="text-apple-text-secondary" /></TableCell>
                <TableCell><TextCell value={item.service || '-'} limit={16} className="text-white" /></TableCell>
                <TableCell><MonoCell value={item.port && item.port > 0 ? String(item.port) : '-'} limit={8} className="text-apple-text-secondary" /></TableCell>
                <TableCell><MonoCell value={item.username || '-'} limit={18} className="text-white" /></TableCell>
                <TableCell><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.18em] uppercase border ${item.success ? 'border-apple-red/40 text-apple-red-light bg-apple-red/10' : 'border-white/15 text-apple-text-secondary bg-white/5'}`}>{item.success ? '命中' : '未命中'}</span></TableCell>
                <TableCell><TextCell value={buildTaskSummary(item.task_name, item.task_id)} limit={28} className="text-white" /></TableCell>
                <TableCell><TextCell value={item.asset_pool_name || '-'} limit={24} className="text-white" /></TableCell>
                <TableCell><TimeCell value={item.matched_at || item.updated_at} /></TableCell>
                <TableCell>
                  <ActionCell>
                    <Button
                      size="sm"
                      variant="bordered"
                      className="rounded-full border-white/10 text-apple-text-secondary hover:text-white hover:border-white/30 font-bold"
                      onPress={() => navigate(`/tasks/${item.task_id}?tab=secprobe`)}
                    >
                      查看任务
                    </Button>
                  </ActionCell>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {total > 0 && (
          <TablePaginationFooter
            summary={(
              <p className="text-[11px] text-apple-text-tertiary font-bold uppercase tracking-[0.2em]">
                全局弱口令结果 <span className="text-white">{total}</span>
              </p>
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
      </div>
    </div>
  )
}
