import { useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Chip,
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

import { type AssetPoolSecprobeFindingVM, useAssetPoolSecprobeFindings } from '@/api/adapters/asset'
import { ActionCell } from '@/components/table/cells/ActionCell'
import { DEFAULT_TABLE_PAGE_SIZE, TablePaginationFooter } from '@/components/table/TablePaginationFooter'
import { MonoCell } from '@/components/table/cells/MonoCell'
import { TextCell } from '@/components/table/cells/TextCell'
import { TimeCell } from '@/components/table/cells/TimeCell'
import { APPLE_TABLE_CLASSES } from '@/utils/theme'

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

function firstNonEmptyText(...values: unknown[]): string {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const text = typeof value === 'string' ? value.trim() : String(value).trim()
    if (text) return text
  }
  return ''
}

function buildTaskSummary(item: AssetPoolSecprobeFindingVM): string {
  return firstNonEmptyText(item.task_name, item.task_id, '-')
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
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [filters, setFilters] = useState<SecprobeFilterState>(EMPTY_FILTERS)
  const [draftFilters, setDraftFilters] = useState<SecprobeFilterState>(EMPTY_FILTERS)

  const queryParams = useMemo(() => ({
    page,
    page_size: pageSize,
    target: filters.target || undefined,
    task_id: filters.taskID || undefined,
    service: filters.service || undefined,
    probe_kind: filters.probeKind || undefined,
    success: filters.success === 'all' ? undefined : filters.success === 'true',
    keyword: filters.keyword || undefined,
    sort: 'matched_at',
    order: 'desc',
  }), [filters, page, pageSize])

  const { data, isPending, isError, refetch } = useAssetPoolSecprobeFindings(poolId, queryParams)
  const items = data?.data || []
  const total = data?.pagination?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

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
          classNames={{ ...APPLE_TABLE_CLASSES, base: 'p-4 min-w-[1400px]', tr: `${APPLE_TABLE_CLASSES.tr} cursor-default` }}
        >
          <TableHeader>
            <TableColumn width={220}>目标主机</TableColumn>
            <TableColumn width={150}>解析 IP</TableColumn>
            <TableColumn width={140}>服务</TableColumn>
            <TableColumn width={100}>端口</TableColumn>
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
                  <MonoCell value={item.target_host || '-'} limit={24} className="text-apple-blue-light" />
                </TableCell>
                <TableCell>
                  <MonoCell value={item.resolved_ip || '-'} limit={18} className="text-apple-text-secondary" />
                </TableCell>
                <TableCell>
                  <TextCell value={item.service || '-'} limit={16} className="text-white" />
                </TableCell>
                <TableCell>
                  <MonoCell value={item.port > 0 ? String(item.port) : '-'} limit={8} className="text-apple-text-secondary" />
                </TableCell>
                <TableCell><MonoCell value={item.username || '-'} limit={18} className="text-white" /></TableCell>
                <TableCell>{renderSuccessChip(item.success)}</TableCell>
                <TableCell>
                  <TextCell value={buildTaskSummary(item)} limit={28} className="text-white" />
                </TableCell>
                <TableCell><TimeCell value={item.matched_at || item.updated_at} /></TableCell>
                <TableCell><TextCell value={item.evidence || item.error || '-'} limit={40} className="text-white" /></TableCell>
                <TableCell>
                  <ActionCell>
                    <Button size="sm" variant="bordered" className="rounded-full border-white/10 text-apple-text-secondary hover:text-white hover:border-white/30 font-bold" onPress={() => navigate(buildTaskPath(item))}>
                      查看任务
                    </Button>
                  </ActionCell>
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
          <TablePaginationFooter
            summary={(
              <p className="text-[11px] text-apple-text-tertiary font-bold uppercase tracking-[0.2em]">
                当前资产池弱口令结果 <span className="text-white">{total}</span>
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
