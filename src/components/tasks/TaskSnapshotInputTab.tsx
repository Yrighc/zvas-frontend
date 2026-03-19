import { Skeleton, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination } from '@heroui/react'
import { useState } from 'react'
import { useTaskSnapshotAssets, type TaskDetailVM } from '@/api/adapters/task'

function formatDateTime(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

export function TaskSnapshotInputTab({ task }: { task: TaskDetailVM }) {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const query = useTaskSnapshotAssets(task.id, { page, page_size: pageSize, origin_type: 'input', sort: 'created_at', order: 'desc' })

  const items = query.data?.data || []
  const total = query.data?.pagination?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full mb-8">
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-center justify-between backdrop-blur-3xl">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight mb-1">扫描目标</h3>
          <p className="text-[13px] text-apple-text-tertiary font-medium">展示本次任务启动时确定的扫描目标资产池记录。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/10 p-5 rounded-[24px] border-t-[3px] border-t-apple-blue backdrop-blur-3xl shadow-lg shadow-apple-blue/5">
          <div className="text-[10px] text-apple-text-tertiary uppercase tracking-[0.2em] font-black mb-2">Target Snapshot ID</div>
          <div className="text-[13px] font-mono font-bold text-apple-text-secondary drop-shadow-sm select-all">{task.target_set_id || '-'}</div>
        </div>
        <div className="bg-white/[0.02] border border-white/10 p-5 rounded-[24px] border-t-[3px] border-t-white/20 backdrop-blur-3xl shadow-lg">
          <div className="text-[10px] text-apple-text-tertiary uppercase tracking-[0.2em] font-black mb-2">Origin Asset Pool</div>
          <div className="text-[13px] text-white font-black tracking-tight truncate drop-shadow">{task.asset_pool_name || '-'}</div>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl overflow-x-auto scrollbar-hide md:scrollbar-default custom-scrollbar">
        <Table 
          removeWrapper 
          aria-label="Task Snapshot Input Assets" 
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
            <TableColumn width={220}>显示值</TableColumn>
            <TableColumn width={120}>类型</TableColumn>
            <TableColumn width={220}>标准键 (Normalized Key)</TableColumn>
            <TableColumn width={140}>来源</TableColumn>
            <TableColumn width={120}>可信度</TableColumn>
            <TableColumn width={180}>写入时标</TableColumn>
          </TableHeader>
          <TableBody 
            emptyContent={
              <div className="py-20 text-apple-text-tertiary text-[13px] font-bold tracking-widest uppercase">
                本次任务尚未关联任何扫描目标。
              </div>
            } 
            isLoading={query.isPending} 
            loadingContent={<Skeleton className="h-40 w-full rounded-[24px] bg-white/5" />}
          >
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <span className="font-mono text-[14px] text-white font-black tracking-tight break-all drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{item.display_name}</span>
                </TableCell>
                <TableCell>
                  <span className="text-[9px] border border-white/10 bg-white/5 text-apple-text-secondary px-2.5 py-1 rounded-full font-black tracking-[0.2em] uppercase">{item.asset_kind}</span>
                </TableCell>
                <TableCell>
                  <span className="text-[12px] text-apple-text-secondary font-mono break-all font-bold">{item.normalized_key}</span>
                </TableCell>
                <TableCell>
                  <span className="text-[9px] bg-apple-blue/10 border border-apple-blue/20 text-apple-blue-light px-2.5 py-1 rounded-full tracking-[0.2em] font-black uppercase">{item.source_type}</span>
                </TableCell>
                <TableCell>
                  <span className="text-[9px] bg-apple-green/10 border border-apple-green/20 text-apple-green-light px-2.5 py-1 rounded-full tracking-[0.2em] font-black uppercase">{item.confidence_level}</span>
                </TableCell>
                <TableCell>
                  <span className="text-apple-text-secondary text-[11px] font-mono">{formatDateTime(item.created_at)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {total > 0 && (
          <div className="flex justify-between items-center px-6 py-5 border-t border-white/5 bg-white/[0.01]">
             <span className="text-[10px] uppercase font-black tracking-[0.2em] text-apple-text-tertiary">合计扫描目标 <span className="text-white mx-1">{total}</span> 项</span>
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

