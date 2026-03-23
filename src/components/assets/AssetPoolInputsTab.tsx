import { useState } from 'react'
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Skeleton, Button } from '@heroui/react'
import { DocumentPlusIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

import { useAssetPoolInputs } from '@/api/adapters/asset'
import { ManualInputModal } from './ManualInputModal'

function formatDateTime(value?: string) {
  if (!value) return '-'
  const d = new Date(value)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function AssetPoolInputsTab({ poolId }: { poolId: string }) {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [manualVisible, setManualVisible] = useState(false)

  const query = useAssetPoolInputs(poolId, { page, page_size: pageSize, sort: 'created_at', order: 'desc' })

  const items = query.data?.data || []
  const total = query.data?.pagination?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-4">
        <div className="flex flex-col">
          <h3 className="text-xl font-black text-white tracking-tight mb-1">输入记录归档</h3>
          <p className="text-[13px] text-apple-text-tertiary font-medium">展示手工录入、文件导入和外部同步形成的原始录入批次，为后续流清洗提供追溯源。</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="flat"
            isIconOnly
            className="h-12 w-12 rounded-[16px] bg-apple-tertiary-bg/10 border border-white/5 backdrop-blur-md"
            onPress={() => query.refetch()}
          >
            <ArrowPathIcon className="w-5 h-5 text-apple-text-secondary" />
          </Button>

          <Button 
            variant="flat" 
            onPress={() => setManualVisible(true)} 
            className="h-12 rounded-[16px] px-6 bg-apple-tertiary-bg/10 border border-white/5 text-white font-bold backdrop-blur-md hover:bg-white/10 transition-colors"
          >
            <DocumentPlusIcon className="w-5 h-5 text-apple-text-tertiary" /> 
            <span>手动录入</span>
          </Button>

          <Button 
            variant="flat" 
            className="h-12 rounded-[16px] px-6 bg-white/5 border border-white/5 text-apple-text-tertiary font-bold backdrop-blur-md" 
            isDisabled
          >
            <ArrowDownTrayIcon className="w-5 h-5" /> 
            <span>导出明细</span>
          </Button>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl overflow-x-auto scrollbar-hide md:scrollbar-default custom-scrollbar">
        <Table 
          removeWrapper 
          aria-label="Input Records Table" 
          layout="fixed"
          classNames={{ 
            base: "p-4 min-w-[1000px]",
            table: "table-fixed",
            thead: "[&>tr]:first:rounded-xl",
            th: "bg-transparent text-apple-text-tertiary uppercase text-[10px] tracking-[0.2em] font-black h-14 border-b border-white/5 pb-2 text-left",
            td: "border-b border-white/5 py-4 text-left last:border-0",
            tr: "hover:bg-white/[0.03] transition-colors cursor-default"
          }}
        >
          <TableHeader>
            <TableColumn width={280}>原始输入载荷</TableColumn>
            <TableColumn width={240}>标准化结果</TableColumn>
            <TableColumn width={120}>解析器判定</TableColumn>
            <TableColumn width={120}>录入通道</TableColumn>
            <TableColumn width={140}>来源标识</TableColumn>
            <TableColumn width={100}>处理流状态</TableColumn>
            <TableColumn width={140} align="end">落库时标</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="py-20 text-apple-text-tertiary text-sm font-bold flex flex-col items-center gap-2">
                <span>当前资产池管道内尚无输入记录 (NULL_INPUTS)</span>
                <span className="text-[11px] font-medium opacity-50 uppercase tracking-widest mt-2">Create new inputs from the top actions</span>
              </div>
            }
            isLoading={query.isPending}
            loadingContent={<Skeleton className="h-40 w-full rounded-[24px] bg-white/5" />}
          >
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>
                  <span className="font-mono text-[13px] text-apple-blue-light font-black tracking-tight break-all drop-shadow-[0_0_8px_rgba(0,113,227,0.3)]">{it.raw_value}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-[13px] text-white font-bold break-all">{it.normalized_value}</span>
                </TableCell>
                <TableCell>
                  <span className="text-[9px] border border-white/10 bg-white/5 text-apple-text-secondary px-2.5 py-1 rounded-full font-black tracking-[0.2em] uppercase">
                    {it.parsed_type}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-[9px] border border-apple-blue/20 bg-apple-blue/10 text-apple-blue-light px-2.5 py-1 rounded-full font-black tracking-[0.2em] uppercase">
                    {it.ingest_type}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] font-bold text-apple-text-secondary uppercase tracking-wider">{it.source_type}</span>
                </TableCell>
                <TableCell>
                  <span className={`text-[9px] px-2.5 py-1 rounded-full font-black tracking-[0.2em] border uppercase ${it.status === 'processed' ? 'border-apple-green/20 bg-apple-green/10 text-apple-green-light' : 'border-white/10 bg-white/5 text-apple-text-tertiary'}`}>
                    {it.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-semibold text-apple-text-secondary font-mono tracking-tighter uppercase">{formatDateTime(it.created_at).split(' ')[0]}</span>
                    <span className="text-[11px] font-semibold text-apple-text-tertiary font-mono tracking-tighter opacity-60">{formatDateTime(it.created_at).split(' ')[1]}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {total > 0 && (
          <div className="flex flex-row justify-between items-center px-6 py-5 border-t border-white/5 bg-white/[0.01]">
            <span className="text-[10px] font-black text-apple-text-tertiary uppercase tracking-[0.2em]">合计解析 <span className="text-white mx-1">{total}</span> 条原记录</span>
            {totalPages > 1 && (
              <Pagination 
                size="sm" 
                page={page} 
                total={totalPages} 
                onChange={setPage} 
                classNames={{ 
                  wrapper: "gap-2",
                  item: "bg-white/5 text-apple-text-secondary font-bold rounded-xl border border-white/5 hover:bg-white/10 transition-all min-w-[32px] h-8 text-[12px]",
                  cursor: "bg-apple-blue font-black rounded-xl shadow-lg shadow-apple-blue/30 text-white",
                  prev: "bg-white/5 text-white/50 rounded-xl hover:bg-white/10",
                  next: "bg-white/5 text-white/50 rounded-xl hover:bg-white/10",
                }} 
              />
            )}
          </div>
        )}
      </div>

      <ManualInputModal isOpen={manualVisible} onClose={() => setManualVisible(false)} defaultPoolId={poolId} />
    </div>
  )
}

