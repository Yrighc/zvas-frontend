import { useState } from 'react'
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Skeleton, Button } from '@heroui/react'
import { DocumentPlusIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

import { useAssetPoolInputs } from '@/api/adapters/asset'
import { TableFrame } from '@/components/table/TableFrame'
import { DEFAULT_TABLE_PAGE_SIZE, TablePaginationFooter } from '@/components/table/TablePaginationFooter'
import { MonoCell } from '@/components/table/cells/MonoCell'
import { StatusBadgeCell } from '@/components/table/cells/StatusBadgeCell'
import { TextCell } from '@/components/table/cells/TextCell'
import { TimeCell } from '@/components/table/cells/TimeCell'
import { ManualInputModal } from './ManualInputModal'
import { APPLE_TABLE_CLASSES } from '@/utils/theme'

export function AssetPoolInputsTab({ poolId }: { poolId: string }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
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

      <TableFrame className="scrollbar-hide custom-scrollbar md:scrollbar-default">
        <Table 
          removeWrapper 
          aria-label="Input Records Table" 
          layout="fixed"
          classNames={{ 
            ...APPLE_TABLE_CLASSES,
            base: "p-4 min-w-[1000px]",
            tr: `${APPLE_TABLE_CLASSES.tr} cursor-default`
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
                  <MonoCell value={it.raw_value} limit={44} className="text-apple-blue-light" />
                </TableCell>
                <TableCell>
                  <MonoCell value={it.normalized_value} limit={38} className="text-white" />
                </TableCell>
                <TableCell>
                  <StatusBadgeCell label={it.parsed_type || '-'} tone="neutral" />
                </TableCell>
                <TableCell>
                  <StatusBadgeCell label={it.ingest_type || '-'} tone="info" />
                </TableCell>
                <TableCell>
                  <TextCell value={it.source_type || '-'} limit={18} className="text-apple-text-secondary" />
                </TableCell>
                <TableCell>
                  <StatusBadgeCell label={it.status || '-'} tone={it.status === 'processed' ? 'success' : 'neutral'} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <TimeCell value={it.created_at} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {total > 0 && (
          <TablePaginationFooter
            summary={<span className="text-[10px] font-black text-apple-text-tertiary uppercase tracking-[0.2em]">合计解析 <span className="text-white mx-1">{total}</span> 条原记录</span>}
            page={page}
            total={total}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPage(1)
              setPageSize(nextPageSize)
            }}
            className="py-5"
          />
        )}
      </TableFrame>

      <ManualInputModal isOpen={manualVisible} onClose={() => setManualVisible(false)} defaultPoolId={poolId} />
    </div>
  )
}
