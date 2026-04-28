import { useMemo, useState } from 'react'
import {
  Button,
  Input,
  Pagination,
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
import { APPLE_TABLE_CLASSES } from '@/utils/theme'

const PAGE_SIZE = 20

function formatDateTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

function truncateText(value: string, limit = 54) {
  const text = value.trim()
  if (!text) return '-'
  return text.length > limit ? `${text.slice(0, limit)}...` : text
}

export function SecprobeFindingsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState('')
  const [assetPoolID, setAssetPoolID] = useState('all')
  const [taskName, setTaskName] = useState('')
  const [service, setService] = useState('')
  const [success, setSuccess] = useState('true')

  const poolsQuery = useAssetPools({ page: 1, page_size: 100, sort: 'updated_at', order: 'desc' })

  const queryParams = useMemo(() => ({
    page,
    page_size: PAGE_SIZE,
    target: target.trim() || undefined,
    asset_pool_id: assetPoolID === 'all' ? undefined : assetPoolID,
    task_name: taskName.trim() || undefined,
    service: service.trim() || undefined,
    success: success === 'all' ? undefined : success === 'true',
    sort: 'matched_at',
    order: 'desc',
  }), [assetPoolID, page, service, success, target, taskName])

  const findingsQuery = useSecprobeFindings(queryParams)
  const items = findingsQuery.data?.data || []
  const total = findingsQuery.data?.pagination?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

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
          classNames={{ ...APPLE_TABLE_CLASSES, base: 'p-4 min-w-[1280px]' }}
        >
          <TableHeader>
            <TableColumn width={220}>目标主机</TableColumn>
            <TableColumn width={140}>服务</TableColumn>
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
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[12px] text-apple-blue-light">{item.target_host || item.resolved_ip || '-'}</span>
                    <span className="text-[11px] text-apple-text-tertiary">{item.resolved_ip || '-'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-white">{item.service || '-'}</span>
                    <span className="text-[11px] text-apple-text-tertiary">{item.port > 0 ? `:${item.port}` : '-'}</span>
                  </div>
                </TableCell>
                <TableCell><span className="font-mono text-[12px] text-white">{item.username || '-'}</span></TableCell>
                <TableCell><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.18em] uppercase border ${item.success ? 'border-apple-red/40 text-apple-red-light bg-apple-red/10' : 'border-white/15 text-apple-text-secondary bg-white/5'}`}>{item.success ? '命中' : '未命中'}</span></TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="block truncate text-[12px] font-semibold text-white">{item.task_name || item.task_id || '-'}</span>
                    <span className="block truncate text-[11px] text-apple-text-tertiary">{truncateText(item.task_id || '-', 24)}</span>
                  </div>
                </TableCell>
                <TableCell><span className="block truncate text-[12px] text-white">{item.asset_pool_name || '-'}</span></TableCell>
                <TableCell><span className="text-[12px] font-mono text-apple-text-secondary">{formatDateTime(item.matched_at || item.updated_at)}</span></TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="bordered"
                      className="rounded-full border-white/10 text-apple-text-secondary hover:text-white hover:border-white/30 font-bold"
                      onPress={() => navigate(`/tasks/${item.task_id}?tab=secprobe`)}
                    >
                      查看任务
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {total > 0 && (
          <div className="px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center border-t border-white/5 bg-white/[0.01]">
            <p className="text-[11px] text-apple-text-tertiary font-bold uppercase tracking-[0.2em]">
              全局弱口令结果 <span className="text-white">{total}</span>
            </p>
            {totalPages > 1 && (
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                classNames={{
                  wrapper: 'gap-2',
                  item: 'bg-white/5 text-apple-text-secondary font-bold rounded-xl border border-white/5 h-10 min-w-[40px]',
                  cursor: 'bg-apple-blue font-black rounded-xl shadow-lg',
                  prev: 'bg-white/5',
                  next: 'bg-white/5',
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
