import { useState } from 'react'
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Skeleton, Button, Chip } from '@heroui/react'
import { ArrowDownTrayIcon, ArrowPathIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline'

import { downloadAssetPoolVulnerabilityReport, useAssetPoolReports } from '@/api/adapters/asset'
import { TableFrame } from '@/components/table/TableFrame'
import { DEFAULT_TABLE_PAGE_SIZE, TablePaginationFooter } from '@/components/table/TablePaginationFooter'
import { MonoCell } from '@/components/table/cells/MonoCell'
import { TextCell } from '@/components/table/cells/TextCell'
import { TimeCell } from '@/components/table/cells/TimeCell'
import { useAuthStore } from '@/store/auth'
import { APPLE_TABLE_CLASSES } from '@/utils/theme'
import { PERMISSIONS, hasPermission } from '@/utils/permissions'

type ReportFormat = 'word' | 'excel' | 'html'

function statusColor(status: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (status?.toLowerCase()) {
    case 'generated':
    case 'ready':
      return 'success'
    case 'generating':
      return 'primary'
    case 'failed':
      return 'danger'
    default:
      return 'default'
  }
}

function scopeLabel(scopeType: string, scopeID: string): string {
  switch (scopeType) {
    case 'asset_pool_vulnerability_word':
      return '漏洞扫描报告'
    case 'asset_pool_vulnerability_excel':
      return '漏洞扫描清单'
    case 'asset_pool_vulnerability_html':
      return 'HTML 漏洞报告'
    default:
      return scopeID || '-'
  }
}

function reportNameLabel(name: string, scopeType: string): string {
  if (name) return name
  return scopeLabel(scopeType, '漏洞扫描导出')
}

export function AssetPoolReportsTab({ poolId }: { poolId: string }) {
  const currentUser = useAuthStore((state) => state.currentUser)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [exporting, setExporting] = useState<ReportFormat | ''>('')
  const [exportError, setExportError] = useState('')

  const { data, isPending, isError, refetch } = useAssetPoolReports(poolId, {
    page,
    page_size: pageSize,
  })

  const items = data?.data || []
  const total = data?.pagination?.total || 0
  const totalPages = Math.ceil(total / pageSize)
  const canExportReports = hasPermission(currentUser?.permissions, PERMISSIONS.reportExport)

  async function handleExport(format: ReportFormat) {
    try {
      setExportError('')
      setExporting(format)
      await downloadAssetPoolVulnerabilityReport(poolId, format)
      await refetch()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : '导出失败')
    } finally {
      setExporting('')
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full mb-8">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between w-full gap-4">
        <div className="flex flex-col">
          <h3 className="text-xl font-black text-white tracking-tight mb-1 flex items-center gap-2">
            <DocumentChartBarIcon className="w-6 h-6 text-apple-blue-light drop-shadow-[0_0_8px_rgba(0,113,227,0.5)]" />
            <span>漏洞扫描报告导出</span>
          </h3>
          <p className="text-[13px] text-apple-text-tertiary font-medium">导出当前资产池的漏洞扫描 Word 报告、Excel 清单和 HTML 报告，并查看导出历史。</p>
          {exportError ? <p className="mt-2 text-[12px] font-medium text-rose-300">{exportError}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <Button
            variant="flat"
            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
            className="h-12 rounded-[16px] bg-apple-blue/20 border border-apple-blue/30 text-white font-bold"
            isLoading={exporting === 'word'}
            isDisabled={!canExportReports}
            onPress={() => handleExport('word')}
          >
            导出漏洞扫描报告
          </Button>
          <Button
            variant="flat"
            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
            className="h-12 rounded-[16px] bg-white/8 border border-white/10 text-white font-bold"
            isLoading={exporting === 'excel'}
            isDisabled={!canExportReports}
            onPress={() => handleExport('excel')}
          >
            导出漏洞扫描清单
          </Button>
          <Button
            variant="flat"
            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
            className="h-12 rounded-[16px] bg-white/8 border border-white/10 text-white font-bold"
            isLoading={exporting === 'html'}
            isDisabled={!canExportReports}
            onPress={() => handleExport('html')}
          >
            导出 HTML 报告
          </Button>
          <Button
            variant="flat"
            isIconOnly
            className="h-12 w-12 rounded-[16px] bg-apple-tertiary-bg/10 border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors"
            onPress={() => refetch()}
          >
            <ArrowPathIcon className="w-5 h-5 text-apple-text-secondary" />
          </Button>
        </div>
      </div>

      <TableFrame className="scrollbar-hide custom-scrollbar md:scrollbar-default">
        <Table 
          removeWrapper 
          aria-label="Reports Table" 
          layout="fixed"
          classNames={{ 
            ...APPLE_TABLE_CLASSES,
            base: 'p-4 min-w-[940px]',
            tr: `${APPLE_TABLE_CLASSES.tr} cursor-default`
          }}>
          <TableHeader>
            <TableColumn width={320}>报告名称</TableColumn>
            <TableColumn width={180}>导出类型</TableColumn>
            <TableColumn width={220}>作用域</TableColumn>
            <TableColumn width={120}>状态</TableColumn>
            <TableColumn width={140} align="end">导出时间</TableColumn>
          </TableHeader>
          <TableBody 
            emptyContent={
              <div className="py-20 text-apple-text-tertiary text-sm font-bold flex flex-col items-center gap-3">
                <DocumentChartBarIcon className="w-12 h-12 text-apple-blue-light opacity-30 drop-shadow-[0_0_12px_rgba(0,113,227,0.3)]" />
                <span className="text-[13px] font-black tracking-[0.1em] text-white uppercase">NO_REPORT_EXPORTS</span>
                <span className="text-[12px] text-apple-text-tertiary font-medium">当前资产池还没有漏洞扫描报告导出记录。</span>
              </div>
            } 
            isLoading={isPending} 
            loadingContent={<Skeleton className="h-40 w-full rounded-[24px] bg-white/5" />}
          >
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>
                  <TextCell value={reportNameLabel(it.name, it.scope_type)} limit={38} className="text-white" />
                </TableCell>
                <TableCell>
                  <TextCell value={scopeLabel(it.scope_type, it.scope_id)} limit={20} className="text-apple-text-secondary" />
                </TableCell>
                <TableCell>
                  <MonoCell value={it.scope_name || it.scope_id} limit={28} className="text-white" />
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color={statusColor(it.status)} classNames={{ base: 'border-0 font-black tracking-[0.1em] uppercase px-1' }}>
                    {it.status}
                  </Chip>
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
        {!isError && total > 0 && (
          <TablePaginationFooter
            summary={<span className="text-[10px] uppercase font-black tracking-[0.2em] text-apple-text-tertiary">合计报表 <span className="text-white mx-1">{total}</span> 项</span>}
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
    </div>
  )
}
