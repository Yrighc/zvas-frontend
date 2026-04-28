import { useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Chip,
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

import { type AssetPoolSecprobeFindingVM, useAssetPoolSecprobeFindings } from '@/api/adapters/asset'
import { APPLE_TABLE_CLASSES } from '@/utils/theme'

const PAGE_SIZE = 20

type SecprobeFilterState = {
  target: string
  taskID: string
  service: string
  probeKind: string
  success: string
  keyword: string
}

const EMPTY_FILTERS: SecprobeFilterState = {
  target: '',
  taskID: '',
  service: '',
  probeKind: '',
  success: 'all',
  keyword: '',
}

function formatDateTime(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

function truncateText(value: string, limit = 48): string {
  const text = value.trim()
  if (!text) return '-'
  return text.length > limit ? `${text.slice(0, limit)}...` : text
}

function renderSuccessChip(success: boolean) {
  return (
    <Chip
      size="sm"
      variant="flat"
      color={success ? 'danger' : 'default'}
      classNames={{ base: success ? 'bg-apple-red/15 text-apple-red-light border border-apple-red/20' : 'border border-white/8 bg-white/[0.04] text-apple-text-secondary' }}
    >
      {success ? '命中' : '未命中'}
    </Chip>
  )
}

export function AssetPoolSecprobeFindingsTab({ poolId }: { poolId: string }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<SecprobeFilterState>(EMPTY_FILTERS)
  const [draftFilters, setDraftFilters] = useState<SecprobeFilterState>(EMPTY_FILTERS)

  const queryParams = useMemo(() => ({
    page,
    page_size: PAGE_SIZE,
    target: filters.target || undefined,
    task_id: filters.taskID || undefined,
    service: filters.service || undefined,
    probe_kind: filters.probeKind || undefined,
    success: filters.success === 'all' ? undefined : filters.success === 'true',
    keyword: filters.keyword || undefined,
    sort: 'matched_at',
    order: 'desc',
  }), [filters, page])

  const { data, isPending, isError, refetch } = useAssetPoolSecprobeFindings(poolId, queryParams)
  const items = data?.data || []
  const total = data?.pagination?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function handleApplyFilters() {
    setPage(1)
    setFilters({
      target: draftFilters.target.trim(),
      taskID: draftFilters.taskID.trim(),
      service: draftFilters.service.trim(),
      probeKind: draftFilters.probeKind.trim(),
      success: draftFilters.success || 'all',
      keyword: draftFilters.keyword.trim(),
    })
  }

  function handleResetFilters() {
    setPage(1)
    setDraftFilters(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
  }

  function handleFilterEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      handleApplyFilters()
    }
  }

  function buildTaskPath(item: AssetPoolSecprobeFindingVM) {
    return `/tasks/${item.task_id}?tab=secprobe`
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full mb-8">
      <div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col">
          <h3 className="mb-1 flex items-center gap-2 text-xl font-black tracking-tight text-white">
            <KeyIcon className="h-6 w-6 text-apple-blue-light drop-shadow-[0_0_8px_rgba(10,132,255,0.45)]" />
            <span>资产池弱口令结果</span>
          </h3>
          <p className="text-[13px] font-medium text-apple-text-tertiary">从资产池范围聚合所有 secprobe 结果，按 host、service、account 和来源任务统一查看。</p>
        </div>
        <Button variant="flat" isIconOnly className="h-12 w-12 rounded-[16px] border border-white/5 bg-apple-tertiary-bg/10 backdrop-blur-md transition-colors hover:bg-white/10" onPress={() => refetch()}>
          <ArrowPathIcon className="h-5 w-5 text-apple-text-secondary" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px_200px_200px_180px_minmax(0,1fr)_auto]">
        <Input
          isClearable
          value={draftFilters.target}
          placeholder="按目标主机 / IP 搜索"
          onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, target: value }))}
          onKeyDown={handleFilterEnter}
          variant="flat"
          startContent={<MagnifyingGlassIcon className="h-5 w-5 text-apple-text-tertiary" />}
          classNames={{ inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md', input: 'text-base font-medium placeholder:text-apple-text-tertiary' }}
        />
        <Input
          isClearable
          value={draftFilters.taskID}
          placeholder="来源任务 ID"
          onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, taskID: value }))}
          onKeyDown={handleFilterEnter}
          variant="flat"
          classNames={{ inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md', input: 'text-base font-medium placeholder:text-apple-text-tertiary' }}
        />
        <Input
          isClearable
          value={draftFilters.service}
          placeholder="服务名"
          onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, service: value }))}
          onKeyDown={handleFilterEnter}
          variant="flat"
          classNames={{ inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md', input: 'text-base font-medium placeholder:text-apple-text-tertiary' }}
        />
        <Input
          isClearable
          value={draftFilters.probeKind}
          placeholder="探测类型"
          onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, probeKind: value }))}
          onKeyDown={handleFilterEnter}
          variant="flat"
          classNames={{ inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md', input: 'text-base font-medium placeholder:text-apple-text-tertiary' }}
        />
        <Select
          aria-label="命中状态"
          selectedKeys={[draftFilters.success]}
          onChange={(event) => setDraftFilters((prev) => ({ ...prev, success: event.target.value || 'all' }))}
          variant="flat"
          classNames={{ trigger: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md', value: 'text-apple-text-primary' }}
        >
          <SelectItem key="all">全部结果</SelectItem>
          <SelectItem key="true">仅看命中</SelectItem>
          <SelectItem key="false">仅看未命中</SelectItem>
        </Select>
        <Input
          isClearable
          value={draftFilters.keyword}
          placeholder="用户名、密码、证据关键字"
          onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, keyword: value }))}
          onKeyDown={handleFilterEnter}
          variant="flat"
          classNames={{ inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md', input: 'text-base font-medium placeholder:text-apple-text-tertiary' }}
        />
        <div className="flex items-center gap-2">
          <Button className="h-14 rounded-[20px] px-6 font-bold" color="primary" onPress={handleApplyFilters}>应用筛选</Button>
          <Button variant="flat" className="h-14 rounded-[20px] px-5 bg-white/5 text-white" onPress={handleResetFilters}>重置</Button>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl overflow-x-auto">
        <Table
          aria-label="Asset pool secprobe findings table"
          layout="fixed"
          removeWrapper
          classNames={{ ...APPLE_TABLE_CLASSES, base: 'p-4 min-w-[1260px]', tr: `${APPLE_TABLE_CLASSES.tr} cursor-default` }}
        >
          <TableHeader>
            <TableColumn width={220}>目标主机</TableColumn>
            <TableColumn width={140}>服务</TableColumn>
            <TableColumn width={140}>账号</TableColumn>
            <TableColumn width={120}>结果</TableColumn>
            <TableColumn width={220}>来源任务</TableColumn>
            <TableColumn width={180}>发现时间</TableColumn>
            <TableColumn width={220}>证据摘要</TableColumn>
            <TableColumn width={110} align="end">操作</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={<div className="h-40 flex items-center justify-center text-apple-text-tertiary font-bold">当前资产池暂无弱口令结果。</div>}
            isLoading={isPending}
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
                <TableCell>{renderSuccessChip(item.success)}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-semibold text-white">{truncateText(item.task_name || item.task_id || '-', 24)}</span>
                    <span className="text-[11px] text-apple-text-tertiary">{truncateText(item.task_id || '-', 24)}</span>
                  </div>
                </TableCell>
                <TableCell><span className="text-[12px] font-mono text-apple-text-secondary">{formatDateTime(item.matched_at || item.updated_at)}</span></TableCell>
                <TableCell><span className="block truncate text-[12px] text-white">{truncateText(item.evidence || item.error || '-', 40)}</span></TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button size="sm" variant="bordered" className="rounded-full border-white/10 text-apple-text-secondary hover:text-white hover:border-white/30 font-bold" onPress={() => navigate(buildTaskPath(item))}>
                      查看任务
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!isPending && isError && (
          <div className="border-t border-white/5 px-6 py-5 text-sm text-apple-red-light">
            资产池弱口令结果加载失败，请稍后重试。
          </div>
        )}

        {total > 0 && (
          <div className="px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center border-t border-white/5 bg-white/[0.01]">
            <p className="text-[11px] text-apple-text-tertiary font-bold uppercase tracking-[0.2em]">
              当前资产池弱口令结果 <span className="text-white">{total}</span>
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
