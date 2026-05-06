import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/adapters/audit';
import type { AuditLog, RiskLevel, ActionResult } from '../api/types/audit.types';
import { useNavigate } from 'react-router-dom';

import { AuditSummary } from './audit/components/AuditSummary';
import { AuditFilter } from './audit/components/AuditFilter';
import { AuditTable } from './audit/components/AuditTable';
import { AuditDetailDrawer } from './audit/components/AuditDetailDrawer';
import { DEFAULT_TABLE_PAGE_SIZE } from '../components/table/TablePaginationFooter';

export function AuditLogPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [resultFilter, setResultFilter] = useState<ActionResult | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);

  // 搜索/过滤器联动处理：修改时同步重置至第一页
  const handleSearchChange = (v: string) => { setSearchTerm(v); setPage(1); };
  const handleRiskChange = (v: RiskLevel | 'all') => { setRiskFilter(v); setPage(1); };
  const handleResultChange = (v: ActionResult | 'all') => { setResultFilter(v); setPage(1); };

  // 服务端分页：将查询条件传给 API，queryKey 包含所有影响结果的参数
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['audit-logs', page, pageSize, searchTerm, riskFilter, resultFilter],
    queryFn: () => getAuditLogs({
      page,
      page_size: pageSize,
      ...(searchTerm ? { keyword: searchTerm } : {}),
      ...(riskFilter !== 'all' ? { risk_level: riskFilter } : {}),
      ...(resultFilter !== 'all' ? { result: resultFilter } : {}),
    }),
  });

  // 处理鉴权错误
  const apiError = error as { status?: number } | null;

  useEffect(() => {
    if (isError && apiError?.status === 401) {
      navigate('/login', { replace: true });
    }
    if (isError && apiError?.status === 403) {
      navigate('/403', { replace: true });
    }
  }, [isError, apiError, navigate]);

  const auditLogs = useMemo(() => data?.items || [], [data]);

  // 服务端已过滤，直接使用返回的分页元数据
  const serverTotal = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(serverTotal / pageSize));

  // 摘要数据基于当前页返回结果（粗略统计，服务端过滤场景下已满足需求）
  const summaryData = useMemo(() => ({
    total: serverTotal,
    highRiskCount: auditLogs.filter(l => l.risk_level === 'high').length,
    failureCount: auditLogs.filter(l => l.result === 'failure').length,
    actorCount: new Set(auditLogs.map(l => l.actor_user_id)).size,
  }), [auditLogs, serverTotal]);

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  const isActualError = isError && apiError?.status !== 401 && apiError?.status !== 403;

  return (
    <div className="flex flex-col gap-14 w-full text-apple-text-primary animate-in fade-in duration-1000 max-w-[1600px] mx-auto pb-20">
      {/* 紧凑型指标概览区 (Bento 风格) */}
      <AuditSummary
        {...summaryData}
        isLoading={isLoading}
      />

      {/* 操作与搜索胶囊栏：始终渲染，确保护航功能可用 */}
      <AuditFilter
        onSearchChange={handleSearchChange}
        riskLevel={riskFilter}
        onRiskLevelChange={handleRiskChange}
        result={resultFilter}
        onResultChange={handleResultChange}
        onRefresh={refetch}
        isRefreshing={isFetching}
      />

      {/* 动态内容区：根据状态切换表格或错误占位 */}
      {isActualError ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-apple-text-tertiary bg-apple-tertiary-bg/5 border border-white/5 backdrop-blur-3xl rounded-[32px]">
          <p className="text-base font-medium">审计数据加载失败</p>
          <p className="text-xs opacity-60">请检查网络状态或联系管理员。状态码：{apiError?.status ?? '未知'}</p>
          <button
            onClick={() => refetch()}
            className="text-apple-blue-light text-sm font-bold hover:underline underline-offset-4 transition-all"
          >
            立即重试
          </button>
        </div>
      ) : (
        <>
          {/* 磨砂玻璃审计列表表格 */}
          <AuditTable
            data={auditLogs}
            isLoading={isLoading}
            onViewDetail={handleViewDetail}
            page={page}
            totalPages={totalPages}
            totalCount={serverTotal}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPage(1);
              setPageSize(nextPageSize);
            }}
          />

          {/* 底部溯源信息卡片 (iPhone 质感) */}
          <div className="bg-apple-tertiary-bg/5 border border-white/5 backdrop-blur-md rounded-[32px] p-8 apple-spotlight group">
            <div className="grid grid-cols-[200px_1fr] gap-y-6 text-sm font-medium">
              <div className="text-apple-text-tertiary text-[10px] tracking-[0.3em] uppercase font-black opacity-80 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-apple-blue shadow-[0_0_8px_rgba(0,113,227,0.8)]" />
                系统溯源 (Mirror_ID)
              </div>
              <div className="font-mono text-apple-text-primary select-all text-sm tracking-tight italic opacity-90">{data?.trace_id || 'NULL_SNAPSHOT_ID'}</div>
              <div className="text-apple-text-tertiary text-[10px] tracking-[0.3em] uppercase font-black opacity-80">架构说明 (Spec)</div>
              <div className="text-apple-text-tertiary text-[12px] leading-relaxed opacity-60 max-w-2xl">
                该面板实时映射全域业务操作流。所有鉴权行为、资产变更及高风险操作均受离散哈希链条保护，确保追溯的唯一性与不可篡改性。
              </div>
            </div>
          </div>
        </>
      )}

      {/* 详情抽屉 */}
      <AuditDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        log={selectedLog}
      />
    </div>
  );
}
