import { useState } from 'react'
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Skeleton, Button, Chip } from '@heroui/react'
import { ArrowPathIcon, BugAntIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'

import { useAssetPoolFindings } from '@/api/adapters/asset'

function severityColor(severity: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'danger'
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'primary'
    case 'info':
    default:
      return 'default'
  }
}

function formatTime(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function AssetPoolFindingsTab({ poolId }: { poolId: string }) {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  const { data, isPending, isError, refetch } = useAssetPoolFindings(poolId, {
    page,
    page_size: pageSize,
  })

  // Notice useAssetPoolFindings returns data and pagination correctly mapped.
  const items = data?.data || []
  const total = data?.pagination?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-4">
        <div className="flex flex-col">
          <h3 className="text-xl font-black text-white tracking-tight mb-1 flex items-center gap-2">
            <BugAntIcon className="w-6 h-6 text-apple-red-light drop-shadow-[0_0_8px_rgba(255,59,48,0.5)]" />
            <span>漏洞与风险发现 (Findings)</span>
          </h3>
          <p className="text-[13px] text-apple-text-tertiary font-medium">展现在当前资产池扫描活动中检测到的各类风险面与漏洞实体信息。</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
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

      <div className="rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl overflow-x-auto scrollbar-hide md:scrollbar-default custom-scrollbar">
        <Table 
          removeWrapper 
          aria-label="Findings Table" 
          layout="fixed"
          classNames={{ 
            base: "p-4 min-w-[940px]",
            table: "table-fixed",
            thead: "[&>tr]:first:rounded-xl",
            th: "bg-transparent text-apple-text-tertiary uppercase text-[10px] tracking-[0.2em] font-black h-14 border-b border-white/5 pb-2 text-left",
            td: "border-b border-white/5 py-4 text-left last:border-0",
            tr: "hover:bg-white/[0.03] transition-colors cursor-default"
          }}>
          <TableHeader>
            <TableColumn width={280}>风险标题</TableColumn>
            <TableColumn width={160}>风险类别</TableColumn>
            <TableColumn width={120}>危险等级</TableColumn>
            <TableColumn width={120}>处置状态</TableColumn>
            <TableColumn width={240}>影响资产载体</TableColumn>
            <TableColumn width={140} align="end">发现时标</TableColumn>
          </TableHeader>
          <TableBody 
            emptyContent={
              <div className="py-20 text-apple-text-tertiary text-sm font-bold flex flex-col items-center gap-3">
                <ShieldExclamationIcon className="w-12 h-12 text-apple-green-light opacity-60 drop-shadow-[0_0_12px_rgba(52,199,89,0.4)]" />
                <span className="text-[13px] font-black tracking-[0.1em] text-white uppercase">NULL_FINDINGS</span>
                <span className="text-[12px] text-apple-text-tertiary font-medium">当前扫描周期内暂未发现风险。维持良好的安全态势。</span>
              </div>
            } 
            isLoading={isPending} 
            loadingContent={<Skeleton className="h-40 w-full rounded-[24px] bg-white/5" />}
          >
            {items.map((it) => (
              <TableRow key={it.finding_id}>
                <TableCell>
                  <span className="font-bold text-[14px] text-white tracking-tight leading-tight block">{it.title}</span>
                  <span className="text-[10px] text-apple-text-tertiary font-mono">
                    {it.detail?.rule_id ? `${it.finding_id} • ${it.detail.rule_id}` : it.finding_id}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-[10px] font-black tracking-widest text-apple-text-secondary uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    {it.finding_type === 'vul_scan' ? '漏洞' : it.finding_type}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color={severityColor(it.severity)} classNames={{ base: "border-0 font-black tracking-[0.1em] uppercase px-1" }}>
                    {it.severity}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className={`text-[9px] px-2.5 py-1 rounded-full font-black tracking-[0.2em] border uppercase ${it.status === 'open' ? 'border-apple-red/30 bg-apple-red/10 text-apple-red-light' : 'border-white/10 bg-white/5 text-apple-text-tertiary'}`}>
                    {it.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] font-mono font-bold text-apple-blue-light truncate block drop-shadow-[0_0_4px_rgba(0,113,227,0.3)]">{it.asset_ref}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-semibold text-apple-text-secondary font-mono tracking-tighter uppercase">{formatTime(it.created_at).split(' ')[0]}</span>
                    <span className="text-[11px] font-semibold text-apple-text-tertiary font-mono tracking-tighter opacity-60">{formatTime(it.created_at).split(' ')[1]}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!isError && total > 0 && (
          <div className="flex justify-between items-center px-6 py-5 border-t border-white/5 bg-white/[0.01]">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-apple-text-tertiary">合计风险 <span className="text-white mx-1">{total}</span> 项</span>
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
    </div>
  )
}
