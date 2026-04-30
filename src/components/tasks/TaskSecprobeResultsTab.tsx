import { useMemo, useState, type KeyboardEvent } from 'react'
import {
  Button,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
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
import {
  ArrowPathIcon,
  KeyIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

import { type TaskSecprobeFindingVM, useTaskSecprobeFindings } from '@/api/adapters/task'
import { ActionCell } from '@/components/table/cells/ActionCell'
import { MonoCell } from '@/components/table/cells/MonoCell'
import { TextCell } from '@/components/table/cells/TextCell'
import { TimeCell } from '@/components/table/cells/TimeCell'
import { APPLE_TABLE_CLASSES } from '@/utils/theme'

const PAGE_SIZE = 20

type SecprobeFilterState = {
  target: string
  service: string
  probeKind: string
  success: string
  keyword: string
}

const EMPTY_FILTERS: SecprobeFilterState = {
  target: '',
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

function firstNonEmptyText(...values: unknown[]): string {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const text = typeof value === 'string' ? value.trim() : String(value).trim()
    if (text) return text
  }
  return ''
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-apple-text-tertiary">{label}</div>
      <div className="break-all text-sm text-white">{value || '-'}</div>
    </div>
  )
}

function MessageBlock({ title, content }: { title: string; content: string }) {
  const text = content || '-'
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-apple-text-tertiary">{title}</h3>
      <pre className="max-h-[min(42vh,520px)] overflow-auto rounded-[24px] border border-white/8 bg-black/30 p-5 font-mono text-xs leading-relaxed text-apple-text-secondary whitespace-pre-wrap break-all">
        {text}
      </pre>
    </section>
  )
}

function SecprobeDrawer({ item, onClose }: { item: TaskSecprobeFindingVM | null; onClose: () => void }) {
  const target = item ? firstNonEmptyText(item.target_host, item.resolved_ip, '-') : '-'
  const account = item ? firstNonEmptyText(item.username && item.password ? `${item.username}:${item.password}` : item.username, '-') : '-'
  const raw = item?.raw ? JSON.stringify(item.raw, null, 2) : ''
  const enrichment = item?.enrichment ? JSON.stringify(item.enrichment, null, 2) : ''

  return (
    <Drawer
      isOpen={Boolean(item)}
      onOpenChange={(open) => !open && onClose()}
      placement="right"
      backdrop="blur"
      scrollBehavior="inside"
      classNames={{
        base: '!w-screen sm:!w-[min(94vw,1120px)] xl:!w-[min(88vw,1320px)] max-w-none h-dvh max-h-dvh border-l border-white/10 bg-apple-bg/92 text-apple-text-primary backdrop-blur-3xl',
        header: 'border-b border-white/6 px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6',
        body: 'px-5 py-5 sm:px-8 sm:py-6',
        footer: 'border-t border-white/6 px-5 py-4 sm:px-8 sm:py-5',
      }}
    >
      <DrawerContent>
        <>
          <DrawerHeader className="flex flex-col gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.28em] text-apple-text-tertiary">弱口令结果详情</span>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-black tracking-tight text-white">{firstNonEmptyText(item?.service?.toUpperCase(), 'SECPROBE')} 弱口令命中</h3>
              {item && renderSuccessChip(item.success)}
            </div>
            <p className="break-all font-mono text-sm text-apple-text-secondary">{target}</p>
          </DrawerHeader>
          <DrawerBody className="space-y-8 overflow-y-auto">
            {item && (
              <>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <InfoCard label="目标主机" value={item.target_host || '-'} />
                  <InfoCard label="解析 IP" value={item.resolved_ip || '-'} />
                  <InfoCard label="服务" value={item.service || '-'} />
                  <InfoCard label="端口" value={item.port > 0 ? String(item.port) : '-'} />
                  <InfoCard label="命中账户" value={account} />
                  <InfoCard label="探测方式" value={item.probe_kind || '-'} />
                  <InfoCard label="结果类型" value={item.finding_type || '-'} />
                  <InfoCard label="来源资产" value={firstNonEmptyText(item.source_asset_kind, item.source_asset_key, '-')} />
                  <InfoCard label="发现时间" value={formatDateTime(item.matched_at || item.updated_at)} />
                  <InfoCard label="结果键" value={item.finding_key || '-'} />
                </div>

                {item.evidence && <MessageBlock title="验证证据" content={item.evidence} />}
                {item.error && <MessageBlock title="错误信息" content={item.error} />}
                {enrichment && <MessageBlock title="补充信息" content={enrichment} />}
                {raw && <MessageBlock title="原始结果" content={raw} />}
              </>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button fullWidth variant="flat" className="rounded-xl bg-white/5 font-bold text-white hover:bg-white/10" onPress={onClose}>
              关闭
            </Button>
          </DrawerFooter>
        </>
      </DrawerContent>
    </Drawer>
  )
}

export function TaskSecprobeResultsTab({ taskId }: { taskId: string }) {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<SecprobeFilterState>(EMPTY_FILTERS)
  const [draftFilters, setDraftFilters] = useState<SecprobeFilterState>(EMPTY_FILTERS)
  const [selectedItem, setSelectedItem] = useState<TaskSecprobeFindingVM | null>(null)

  const queryParams = useMemo(() => ({
    page,
    page_size: PAGE_SIZE,
    target: filters.target || undefined,
    service: filters.service || undefined,
    probe_kind: filters.probeKind || undefined,
    success: filters.success === 'all' ? undefined : filters.success === 'true',
    keyword: filters.keyword || undefined,
  }), [filters, page])

  const { data, isPending, isError, refetch } = useTaskSecprobeFindings(taskId, queryParams)
  const items = useMemo(() => data?.data ?? [], [data?.data])
  const total = data?.pagination?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function handleApplyFilters() {
    setPage(1)
    setFilters({
      target: draftFilters.target.trim(),
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

  return (
    <div className="mb-8 flex w-full animate-in fade-in flex-col gap-6 duration-500">
      <div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col">
          <h3 className="mb-1 flex items-center gap-2 text-xl font-black tracking-tight text-white">
            <KeyIcon className="h-6 w-6 text-apple-blue-light drop-shadow-[0_0_8px_rgba(10,132,255,0.45)]" />
            <span>任务弱口令结果</span>
          </h3>
          <p className="text-[13px] font-medium text-apple-text-tertiary">按目标主机、解析 IP、服务和端口拆列展示当前任务的 secprobe 结果，不再把多个主值塞进同一个单元格。</p>
        </div>
        <Button
          variant="flat"
          isIconOnly
          className="h-12 w-12 rounded-[16px] border border-white/5 bg-apple-tertiary-bg/10 backdrop-blur-md transition-colors hover:bg-white/10"
          onPress={() => refetch()}
        >
          <ArrowPathIcon className="h-5 w-5 text-apple-text-secondary" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.2fr)_200px_200px_180px_minmax(0,1fr)_auto]">
        <Input
          isClearable
          value={draftFilters.target}
          placeholder="按目标主机 / IP 搜索"
          onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, target: value }))}
          onKeyDown={handleFilterEnter}
          variant="flat"
          startContent={<MagnifyingGlassIcon className="h-5 w-5 text-apple-text-tertiary" />}
          classNames={{
            inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md',
            input: 'text-base font-medium placeholder:text-apple-text-tertiary',
          }}
        />
        <Input
          isClearable
          value={draftFilters.service}
          placeholder="服务名"
          onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, service: value }))}
          onKeyDown={handleFilterEnter}
          variant="flat"
          classNames={{
            inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md',
            input: 'text-base font-medium placeholder:text-apple-text-tertiary',
          }}
        />
        <Input
          isClearable
          value={draftFilters.probeKind}
          placeholder="探测类型"
          onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, probeKind: value }))}
          onKeyDown={handleFilterEnter}
          variant="flat"
          classNames={{
            inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md',
            input: 'text-base font-medium placeholder:text-apple-text-tertiary',
          }}
        />
        <Select
          aria-label="命中状态"
          selectedKeys={[draftFilters.success]}
          onChange={(event) => setDraftFilters((prev) => ({ ...prev, success: event.target.value || 'all' }))}
          variant="flat"
          classNames={{
            trigger: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md',
            value: 'text-apple-text-primary',
          }}
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
          classNames={{
            inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md',
            input: 'text-base font-medium placeholder:text-apple-text-tertiary',
          }}
        />
        <div className="flex items-center gap-2">
          <Button className="h-14 rounded-[20px] px-6 font-bold" color="primary" onPress={handleApplyFilters}>
            应用筛选
          </Button>
          <Button variant="flat" className="h-14 rounded-[20px] px-5 bg-white/5 text-white" onPress={handleResetFilters}>
            重置
          </Button>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl overflow-x-auto">
        <Table
          aria-label="Task secprobe findings table"
          layout="fixed"
          removeWrapper
          classNames={{
            ...APPLE_TABLE_CLASSES,
            base: 'p-4 min-w-[1320px]',
            tr: `${APPLE_TABLE_CLASSES.tr} cursor-default`,
          }}
        >
          <TableHeader>
            <TableColumn width={220}>目标主机</TableColumn>
            <TableColumn width={150}>解析 IP</TableColumn>
            <TableColumn width={140}>服务</TableColumn>
            <TableColumn width={100}>端口</TableColumn>
            <TableColumn width={150}>账号</TableColumn>
            <TableColumn width={140}>密码</TableColumn>
            <TableColumn width={120}>结果</TableColumn>
            <TableColumn width={180}>发现时间</TableColumn>
            <TableColumn width={220}>证据摘要</TableColumn>
            <TableColumn width={96}>详情</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={<div className="h-40 flex items-center justify-center text-apple-text-tertiary font-bold">当前筛选条件下暂无弱口令结果。</div>}
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
                <TableCell><MonoCell value={item.password || '-'} limit={18} className="text-white" /></TableCell>
                <TableCell>{renderSuccessChip(item.success)}</TableCell>
                <TableCell><TimeCell value={item.matched_at || item.updated_at} /></TableCell>
                <TableCell><TextCell value={item.evidence || item.error || '-'} limit={42} className="text-white" /></TableCell>
                <TableCell>
                  <ActionCell label="详情" onPress={() => setSelectedItem(item)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!isPending && isError && (
          <div className="border-t border-white/5 px-6 py-5 text-sm text-apple-red-light">
            弱口令结果加载失败，请稍后重试。
          </div>
        )}

        {total > 0 && (
          <div className="px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center border-t border-white/5 bg-white/[0.01]">
            <p className="text-[11px] text-apple-text-tertiary font-bold uppercase tracking-[0.2em]">
              当前弱口令结果 <span className="text-white">{total}</span>
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

      <SecprobeDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  )
}
