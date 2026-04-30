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
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAssetPools } from '@/api/adapters/asset'
import { useFindings } from '@/api/adapters/finding'
import { TableFrame } from '@/components/table/TableFrame'
import { MonoCell } from '@/components/table/cells/MonoCell'
import { TextCell } from '@/components/table/cells/TextCell'
import { TimeCell } from '@/components/table/cells/TimeCell'
import { TABLE_CLASS_NAMES } from '@/components/table/tableClassNames'

const PAGE_SIZE = 20

function severityClass(severity: string) {
  switch ((severity || '').toLowerCase()) {
    case 'critical':
    case 'high':
      return 'border-apple-red/40 text-apple-red-light bg-apple-red/10'
    case 'medium':
      return 'border-apple-orange/40 text-apple-orange-light bg-apple-orange/10'
    case 'low':
      return 'border-apple-blue/40 text-apple-blue-light bg-apple-blue/10'
    case 'info':
      return 'border-apple-green/40 text-apple-green-light bg-apple-green/10'
    default:
      return 'border-white/15 text-apple-text-secondary bg-white/5'
  }
}

export function FindingsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [url, setURL] = useState('')
  const [assetPoolID, setAssetPoolID] = useState('all')
  const [taskName, setTaskName] = useState('')

  const poolsQuery = useAssetPools({ page: 1, page_size: 100, sort: 'updated_at', order: 'desc' })

  const queryParams = useMemo(() => ({
    page,
    page_size: PAGE_SIZE,
    url: url.trim() || undefined,
    asset_pool_id: assetPoolID === 'all' ? undefined : assetPoolID,
    task_name: taskName.trim() || undefined,
  }), [assetPoolID, page, taskName, url])

  const findingsQuery = useFindings(queryParams)
  const items = findingsQuery.data?.data || []
  const total = findingsQuery.data?.pagination?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-8 w-full text-apple-text-primary animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-20 p-4">
      <section className="flex flex-col gap-4 mt-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-white">全局漏洞结果</h1>
          <p className="mt-2 text-[13px] text-apple-text-tertiary">
            汇总展示所有资产池与任务中由漏洞扫描产生的漏洞命中结果，便于运维人员跨任务查看当前风险面。
          </p>
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px_260px_auto]">
          <Input
            isClearable
            value={url}
            placeholder="按 Base URL / Host 搜索"
            onValueChange={(value) => { setURL(value); setPage(1) }}
            variant="flat"
            startContent={<MagnifyingGlassIcon className="w-5 h-5 text-apple-text-tertiary" />}
            classNames={{
              inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md',
              input: 'text-base font-medium placeholder:text-apple-text-tertiary',
            }}
          />
          <Select
            aria-label="资产池筛选"
            selectedKeys={[assetPoolID]}
            onChange={(event) => { setAssetPoolID(event.target.value || 'all'); setPage(1) }}
            variant="flat"
            classNames={{
              trigger: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md',
              value: 'text-apple-text-primary',
            }}
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
            classNames={{
              inputWrapper: 'bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-[20px] border border-white/5 backdrop-blur-md',
              input: 'text-base font-medium placeholder:text-apple-text-tertiary',
            }}
          />
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

      <TableFrame>
        <Table
          aria-label="Global findings table"
          layout="fixed"
          removeWrapper
          classNames={{
            ...TABLE_CLASS_NAMES,
            base: 'p-4 min-w-[1100px]',
            tr: `${TABLE_CLASS_NAMES.tr} cursor-default`,
          }}
        >
          <TableHeader>
            <TableColumn width={240}>漏洞名称</TableColumn>
            <TableColumn width={120}>等级</TableColumn>
            <TableColumn width={220}>目标</TableColumn>
            <TableColumn width={180}>POC / 模板</TableColumn>
            <TableColumn width={200}>来源任务</TableColumn>
            <TableColumn width={180}>最近发现时间</TableColumn>
            <TableColumn width={120} align="end">操作</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={<div className="h-40 flex items-center justify-center text-apple-text-tertiary font-bold">当前暂无漏洞结果。</div>}
            isLoading={findingsQuery.isPending}
            loadingContent={<Skeleton className="rounded-xl w-full h-40 bg-white/5" />}
          >
            {items.map((item) => {
              const target = item.base_url || item.asset_ref || item.host || '-'
              return (
                <TableRow key={item.finding_id}>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-1">
                      <TextCell value={item.title || '-'} limit={48} className="font-semibold text-white" />
                      <MonoCell value={item.finding_id || '-'} limit={32} className="text-apple-text-tertiary" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.18em] uppercase border ${severityClass(item.severity)}`}>
                      {item.severity || 'unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <MonoCell value={target} limit={40} className="text-white" />
                  </TableCell>
                  <TableCell>
                    <MonoCell value={item.rule_id || '-'} limit={28} />
                  </TableCell>
                  <TableCell>
                    <TextCell
                      value={[item.task_name || item.task_id || '-', item.asset_pool_name || '-'].join(' / ')}
                      limit={42}
                      className="font-semibold text-white"
                    />
                  </TableCell>
                  <TableCell>
                    <TimeCell value={item.updated_at || item.created_at} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="bordered"
                        className="rounded-full border-white/10 text-apple-text-secondary hover:text-white hover:border-white/30 font-bold"
                        onPress={() => navigate(`/tasks/${item.task_id}?tab=findings`)}
                      >
                        查看任务
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {total > 0 && (
          <div className="px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center border-t border-white/5 bg-white/[0.01]">
            <p className="text-[11px] text-apple-text-tertiary font-bold uppercase tracking-[0.2em]">
              全局漏洞结果 <span className="text-white">{total}</span>
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
      </TableFrame>
    </div>
  )
}
