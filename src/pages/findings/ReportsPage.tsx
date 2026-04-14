import {
  Button,
  Input,
  Skeleton,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Card,
  CardBody,
} from '@heroui/react'
import { useState } from 'react'
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

import { useReports } from '@/api/adapters/finding'
import { APPLE_TABLE_CLASSES } from '@/utils/theme'

function formatDateTime(isoStr?: string) {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function ReportsPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keyword, setKeyword] = useState('')

  const reportsQuery = useReports({
    page,
    page_size: pageSize,
    keyword: keyword || undefined,
  })

  const items = reportsQuery.data?.data || []
  const total = reportsQuery.data?.pagination?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col gap-10 w-full text-apple-text-primary animate-in fade-in duration-1000 max-w-[1600px] mx-auto pb-20 p-4 md:p-8">


      <Card className="w-full bg-apple-tertiary-bg/5 border border-white/5 backdrop-blur-3xl rounded-[32px]" shadow="sm">
        <CardBody className="gap-8 p-6 md:p-8">
          {/* 搜索与工具栏 */}
          <section className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
            <div className="w-full md:w-96">
              <Input
                isClearable
                value={keyword}
                placeholder="搜索报告名称或标识..."
                onValueChange={(val) => { setKeyword(val); setPage(1) }}
                startContent={<MagnifyingGlassIcon className="w-5 h-5 text-apple-text-tertiary" />}
                variant="flat"
                classNames={{
                  inputWrapper: "bg-apple-tertiary-bg/10 hover:bg-apple-tertiary-bg/20 transition-colors h-14 rounded-2xl border border-white/5 backdrop-blur-md",
                  input: "text-sm font-medium placeholder:text-apple-text-tertiary",
                }}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                variant="flat"
                isIconOnly
                className="h-14 w-14 rounded-2xl bg-apple-tertiary-bg/10 border border-white/5 backdrop-blur-md"
                onPress={() => reportsQuery.refetch()}
                aria-label="刷新报告列表"
              >
                <ArrowPathIcon className="w-6 h-6 text-apple-text-secondary" />
              </Button>
              <Button
                color="primary"
                className="h-14 rounded-2xl font-black px-8 shadow-2xl shadow-apple-blue/20"
              >
                手工归档汇总
              </Button>
            </div>
          </section>

          {/* 数据主体区 */}
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl overflow-x-auto scrollbar-hide md:scrollbar-default custom-scrollbar">
            <Table
              aria-label="Report Analytics table"
              layout="fixed"
              removeWrapper
              classNames={{
                ...APPLE_TABLE_CLASSES,
                base: "p-4 min-w-[1000px]",
                tr: `${APPLE_TABLE_CLASSES.tr} cursor-default`
              }}
            >
              <TableHeader>
                <TableColumn width={300} align="start">归档报告名称</TableColumn>
                <TableColumn width={200} align="start">作用域定义</TableColumn>
                <TableColumn width={140} align="start">运行状态</TableColumn>
                <TableColumn width={180} align="start">构建时间戳</TableColumn>
                <TableColumn width={120} align="end">流操作</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={
                  <div className="h-40 flex flex-col items-center justify-center text-apple-text-tertiary gap-2">
                    <span className="font-bold">暂无报告数据载荷 (NULL_REPORTS_PAYLOAD)</span>
                  </div>
                }
                isLoading={reportsQuery.isPending}
                loadingContent={<Skeleton className="rounded-xl w-full h-40 bg-white/5" />}
              >
                {items.map((rpt) => (
                  <TableRow key={rpt.id}>
                    <TableCell>
                      <span className="text-sm font-bold text-white tracking-tight truncate block">{rpt.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-apple-text-secondary text-[10px] font-black uppercase tracking-wider">
                        @{rpt.scope_type}: {rpt.scope_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${rpt.status === 'generated'
                        ? 'border-apple-green/40 text-apple-green-light bg-apple-green/10'
                        : 'border-white/20 text-apple-text-secondary bg-white/5'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rpt.status === 'generated' ? 'bg-apple-green-light' : 'bg-apple-text-tertiary'}`} />
                        {rpt.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-apple-text-secondary font-mono tracking-tighter">{formatDateTime(rpt.created_at).split(' ')[0]}</span>
                        <span className="text-[11px] font-semibold text-apple-text-tertiary font-mono tracking-tighter opacity-60">{formatDateTime(rpt.created_at).split(' ')[1]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end pr-2">
                        <Button
                          size="sm"
                          variant="bordered"
                          className="rounded-full border-white/10 text-apple-text-secondary hover:text-white hover:border-white/30 font-bold h-8 px-5"
                        >
                          下载
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页区 */}
          {total > 0 && (
            <div className="px-6 py-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.01]">
              <p className="text-[11px] text-apple-text-tertiary font-bold uppercase tracking-[0.2em]">
                共溯源到 <span className="text-white mx-1">{total}</span> 份结构化报告
              </p>
              {totalPages > 1 && (
                <Pagination
                  total={totalPages}
                  page={page}
                  onChange={setPage}
                  showControls
                  classNames={{
                    wrapper: "gap-2",
                    item: "bg-white/5 text-apple-text-secondary font-bold rounded-xl border border-white/5 hover:bg-white/10 transition-all min-w-[40px] h-10",
                    cursor: "bg-apple-blue font-black rounded-xl shadow-lg shadow-apple-blue/30 text-white",
                    prev: "bg-white/5 text-white/50 rounded-xl hover:bg-white/10",
                    next: "bg-white/5 text-white/50 rounded-xl hover:bg-white/10",
                  }}
                />
              )}
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* 底部溯源信息卡片 */}
      <Card className="bg-apple-tertiary-bg/5 border border-white/5 backdrop-blur-md rounded-[32px] mt-4 shadow-none">
        <CardBody className="p-8">
          <div className="grid grid-cols-[160px_1fr] gap-y-4 text-sm font-medium">
            <div className="text-apple-text-tertiary text-[10px] tracking-[0.2em] uppercase font-black">归档协议 (Archive_Policy)</div>
            <div className="text-apple-text-tertiary uppercase text-[10px] tracking-tight opacity-50 font-mono">RETENTION_365_DAYS_IMMUTABLE</div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
