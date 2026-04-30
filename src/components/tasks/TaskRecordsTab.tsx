import { useMemo, useState } from "react";
import {
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
} from "@heroui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import {
  getProbeStatusLabel,
  parseHttpProbeSummary,
} from "@/api/adapters/asset";
import { getHttpProbeObservation, useTaskRecords } from "@/api/adapters/task";
import type { TaskRecordVM } from "@/api/adapters/task";
import { getRecordTypeLabel } from "@/api/adapters/route";
import { TaskRecordDetailDrawer } from "@/components/tasks/TaskRecordDetailDrawer";
import { TableFrame } from "@/components/table/TableFrame";
import { ActionCell } from "@/components/table/cells/ActionCell";
import { MonoCell } from "@/components/table/cells/MonoCell";
import { TextCell } from "@/components/table/cells/TextCell";
import { TimeCell } from "@/components/table/cells/TimeCell";
import { APPLE_TABLE_CLASSES } from "@/utils/theme";

type RecordTabKey =
  | "all"
  | "port_scan"
  | "http_probe"
  | "vuln_scan"
  | "weak_scan"
  | "secprobe";

const RECORD_TABS: Array<{
  key: RecordTabKey;
  label: string;
  description: string;
}> = [
    { key: "all", label: "全部记录", description: "统一查看当前任务生成的所有扫描记录" },
    {
      key: "port_scan",
      label: "端口扫描",
      description: "查看端口开放状态与基础服务识别结果",
    },
    { key: "http_probe", label: "站点识别", description: "查看请求响应摘要与站点指纹信息" },
    { key: "vuln_scan", label: "漏洞扫描", description: "查看漏洞命中、报告字段与请求响应内容" },
    {
      key: "weak_scan",
      label: "弱点扫描",
      description: "查看弱点扫描结果与来源任务信息",
    },
    {
      key: "secprobe",
      label: "弱口令探测",
      description: "查看 host + service 弱口令探测状态与结果摘要",
    },
  ];

function formatDuration(durationMs: number) {
  if (!durationMs) return "-";
  if (durationMs < 1000) return `${durationMs} ms`;
  return `${(durationMs / 1000).toFixed(1)} s`;
}

function isInProgressStatus(status: string) {
  return status === "queued" || status === "dispatched" || status === "running";
}

function getInProgressSummary(status: string) {
  switch (status) {
    case "queued":
      return "待执行，尚未产生结果";
    case "dispatched":
      return "已分发，等待执行";
    case "running":
      return "执行中，等待结果收口";
    default:
      return "结果处理中";
  }
}

function getCompactVulScanSummary(item: TaskRecordVM) {
  if (isInProgressStatus(item.status)) {
    return getInProgressSummary(item.status);
  }
  const summary = (item.result_summary || "").trim();
  if (!summary) {
    if (item.status === "failed") return "执行失败";
    if (item.status === "succeeded") return "已完成";
    return "-";
  }
  return summary;
}

function getCompactWeakScanSummary(item: TaskRecordVM) {
  if (isInProgressStatus(item.status)) {
    return getInProgressSummary(item.status);
  }
  const summary = (item.result_summary || "").trim();
  if (!summary) {
    if (item.status === "failed") return "执行失败";
    if (item.status === "succeeded") return "已完成";
    return "-";
  }
  return summary;
}

function getCompactSecprobeSummary(item: TaskRecordVM) {
  if (isInProgressStatus(item.status)) {
    return getInProgressSummary(item.status);
  }
  const summary = (item.result_summary || "").trim();
  if (!summary) {
    if (item.status === "failed") return "执行失败";
    if (item.status === "succeeded") return "已完成";
    return "-";
  }
  return summary;
}

function parseTaskRecordSummary(
  item: TaskRecordVM,
): Record<string, unknown> | null {
  if (!item.result_summary) return null;
  if (
    typeof item.result_summary === "string" &&
    item.result_summary.startsWith("{")
  ) {
    try {
      const parsed = JSON.parse(item.result_summary);
      if (parsed && typeof parsed === "object")
        return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

function getHTTPProbeTableData(item: TaskRecordVM) {
  const summaryPayload = parseTaskRecordSummary(item);
  const summary = parseHttpProbeSummary(summaryPayload);
  const observation = getHttpProbeObservation(item);
  return {
    siteURL: summary?.site_url || item.target_key || "-",
    title: summary?.title || "-",
    statusCode: summary?.status_code ?? null,
    probeLabel:
      getProbeStatusLabel(summary?.probe_status) || observation.label || "-",
    probeError: summary?.probe_error || observation.error || "",
    probeState: summary?.probe_status || observation.state || "",
  };
}

function getHomepageIdentifySummary(item: TaskRecordVM) {
  const summaryPayload = parseTaskRecordSummary(item);
  const summary = parseHttpProbeSummary(summaryPayload);
  if (!summary) return "";

  const parts = [
    typeof summary.status_code === "number" && summary.status_code > 0
      ? String(summary.status_code)
      : "",
    (summary.title || "").trim(),
    (summary.site_url || item.target_key || "").trim(),
  ].filter(Boolean);

  return parts.join(" · ");
}

function getMixedRecordSummary(item: TaskRecordVM) {
  if (item.task_type === "http_probe" && item.task_subtype === "homepage_identify") {
    return getHomepageIdentifySummary(item);
  }

  const summary = (item.result_summary || "").trim();
  if (!summary) {
    if (item.status === "failed") return "执行失败";
    if (item.status === "succeeded") return "已完成";
    return "-";
  }

  return summary;
}

function renderResultSummary(item: TaskRecordVM) {
  if (isInProgressStatus(item.status)) {
    return (
      <TextCell
        value={getInProgressSummary(item.status)}
        limit={30}
        className="text-apple-blue-light font-medium"
      />
    );
  }

  const summaryText = getMixedRecordSummary(item);
  return <TextCell value={summaryText} limit={32} />;
}

function renderStatus(item: TaskRecordVM) {
  const statusColorMap: Record<string, string> = {
    succeeded: "bg-apple-green/20 text-apple-green-light",
    failed: "bg-apple-red/20 text-apple-red",
    running: "bg-apple-blue/20 text-apple-blue-light",
    pending: "bg-apple-amber/20 text-apple-amber",
    canceled: "bg-white/20 text-apple-text-secondary",
  };
  const colorClass = statusColorMap[item.status] || "bg-white/10 text-white/70";

  if (item.task_type === "http_probe") {
    const obs = getHttpProbeObservation(item);
    return (
      <div className="flex flex-col gap-1.5 items-start">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${colorClass}`}
        >
          {item.status}
        </span>
        {obs.state !== "unknown" && obs.state !== "failed" && (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest ${obs.state === "alive"
              ? "border border-apple-green/40 text-apple-green-light bg-apple-green/10"
              : "border border-white/20 text-apple-text-secondary bg-white/5"
              }`}
          >
            {obs.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${colorClass}`}
    >
      {item.status}
    </span>
  );
}

export function TaskRecordsTab({ taskId }: { taskId?: string }) {
  const [page, setPage] = useState(1);
  const [recordTab, setRecordTab] = useState<RecordTabKey>("all");
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<TaskRecordVM | null>(
    null,
  );
  const pageSize = 20;

  const query = useTaskRecords(taskId, {
    page,
    page_size: pageSize,
    stage: recordTab === "all" ? undefined : recordTab,
    status: status || undefined,
    keyword: keyword || undefined,
    sort: "updated_at",
    order: "desc",
  });

  const items = query.data?.data || [];
  const total = query.data?.pagination?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const statusOptions = useMemo(
    () => [
      { key: "", label: "全部状态" },
      { key: "queued", label: "待执行" },
      { key: "dispatched", label: "已分发" },
      { key: "running", label: "执行中" },
      { key: "succeeded", label: "已完成" },
      { key: "failed", label: "失败" },
    ],
    [],
  );

  const renderDetailAction = (item: TaskRecordVM) => (
    <ActionCell label="查看详情" onPress={() => setSelectedRecord(item)} />
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full mb-8">
      {/* <div className='bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-3xl'>
        <h3 className='text-xl font-black text-white tracking-tight mb-1'>扫描记录</h3>
        <p className='text-[13px] text-apple-text-tertiary font-medium'>
          按扫描类型拆分查看记录和详情，避免不同结果结构混在同一视图里。
        </p>
      </div> */}

      <div className="flex flex-wrap gap-3">
        {RECORD_TABS.map((tab) => {
          const active = recordTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setRecordTab(tab.key);
                setPage(1);
                setSelectedRecord(null);
              }}
              className={`min-w-[180px] rounded-2xl border px-4 py-3 text-left transition-all ${active
                ? "border-apple-blue/40 bg-apple-blue/10 shadow-lg shadow-apple-blue/10"
                : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]"
                }`}
            >
              <div
                className={`text-sm font-black ${active ? "text-white" : "text-apple-text-secondary"}`}
              >
                {tab.label}
              </div>
              <div className="mt-1 text-xs text-apple-text-tertiary">
                {tab.description}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          isClearable
          value={keyword}
          placeholder={
            recordTab === "http_probe"
              ? "搜索 URL、标题或状态码"
              : "搜索目标或结果摘要"
          }
          onValueChange={(value) => {
            setKeyword(value);
            setPage(1);
          }}
          classNames={{
            inputWrapper: "bg-white/5 border border-white/5 rounded-2xl h-12",
            input: "text-sm",
          }}
          startContent={
            <MagnifyingGlassIcon className="w-4 h-4 text-apple-text-tertiary" />
          }
        />
        <Select
          selectedKeys={status ? [status] : []}
          placeholder="状态"
          onSelectionChange={(keys) => {
            setStatus((Array.from(keys)[0] as string) || "");
            setPage(1);
          }}
          classNames={{
            trigger: "bg-white/5 border border-white/5 rounded-2xl h-12",
          }}
          popoverProps={{
            classNames: {
              content:
                "bg-apple-bg/95 backdrop-blur-3xl border border-white/10 shadow-2xl p-1 min-w-[160px]",
            },
          }}
        >
          {statusOptions.map((item) => (
            <SelectItem key={item.key}>{item.label}</SelectItem>
          ))}
        </Select>
      </div>

      <TableFrame>
        <Table
          removeWrapper
          aria-label="Task Records"
          layout="fixed"
          classNames={{
            ...APPLE_TABLE_CLASSES,
            base:
              recordTab === "http_probe"
                ? "p-4 min-w-[1180px]"
                : recordTab === "vuln_scan"
                  ? "p-4 min-w-[1280px]"
                  : "p-4 min-w-[1100px]",
          }}
        >
          <TableHeader>
            {recordTab === "http_probe" ? (
              <>
                <TableColumn width={280}>站点 URL</TableColumn>
                <TableColumn width={100}>执行状态</TableColumn>
                <TableColumn width={140}>存活状态</TableColumn>
                <TableColumn width={240}>页面标题</TableColumn>
                <TableColumn width={110}>状态码</TableColumn>
                <TableColumn width={160}>开始时间</TableColumn>
                <TableColumn width={100}>耗时</TableColumn>
                <TableColumn width={96}>详情</TableColumn>
              </>
            ) : recordTab === "vuln_scan" ? (
              <>
                <TableColumn width={220}>目标站点</TableColumn>
                <TableColumn width={100}>状态</TableColumn>
                <TableColumn width={160}>执行节点</TableColumn>
                <TableColumn width={90}>尝试次数</TableColumn>
                <TableColumn width={160}>开始时间</TableColumn>
                <TableColumn width={160}>结束时间</TableColumn>
                <TableColumn width={100}>耗时</TableColumn>
                <TableColumn width={220}>扫描结果</TableColumn>
                <TableColumn width={96}>详情</TableColumn>
              </>
            ) : recordTab === "weak_scan" ? (
              <>
                <TableColumn width={220}>目标站点</TableColumn>
                <TableColumn width={100}>状态</TableColumn>
                <TableColumn width={160}>执行节点</TableColumn>
                <TableColumn width={90}>尝试次数</TableColumn>
                <TableColumn width={160}>开始时间</TableColumn>
                <TableColumn width={160}>结束时间</TableColumn>
                <TableColumn width={100}>耗时</TableColumn>
                <TableColumn width={220}>扫描结果</TableColumn>
                <TableColumn width={96}>详情</TableColumn>
              </>
            ) : recordTab === "secprobe" ? (
              <>
                <TableColumn width={220}>目标主机</TableColumn>
                <TableColumn width={100}>状态</TableColumn>
                <TableColumn width={160}>执行节点</TableColumn>
                <TableColumn width={90}>尝试次数</TableColumn>
                <TableColumn width={160}>开始时间</TableColumn>
                <TableColumn width={160}>结束时间</TableColumn>
                <TableColumn width={100}>耗时</TableColumn>
                <TableColumn width={220}>探测结果</TableColumn>
                <TableColumn width={96}>详情</TableColumn>
              </>
            ) : (
              <>
                <TableColumn width={130}>阶段</TableColumn>
                <TableColumn width={200}>目标</TableColumn>
                <TableColumn width={90}>状态</TableColumn>
                <TableColumn width={160}>执行节点</TableColumn>
                <TableColumn width={80}>尝试次数</TableColumn>
                <TableColumn width={100}>耗时</TableColumn>
                <TableColumn width={160}>开始时间</TableColumn>
                <TableColumn width={280}>结果摘要</TableColumn>
                <TableColumn width={96}>详情</TableColumn>
              </>
            )}
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="py-20 text-apple-text-tertiary text-[13px] font-bold tracking-widest uppercase">
                当前筛选条件下暂无扫描记录。
              </div>
            }
            isLoading={query.isPending}
            loadingContent={
              <Skeleton className="h-40 w-full rounded-[24px] bg-white/5" />
            }
          >
            {items.map((item) => {
              if (recordTab === "http_probe") {
                const httpData = getHTTPProbeTableData(item);
                const statusCode = httpData.statusCode;
                const healthy =
                  typeof statusCode === "number" &&
                  statusCode >= 200 &&
                  statusCode < 400;
                return (
                  <TableRow key={item.unit_id}>
                    <TableCell>
                      <MonoCell value={httpData.siteURL} limit={48} className="text-apple-blue-light" />
                    </TableCell>
                    <TableCell>{renderStatus(item)}</TableCell>
                    <TableCell>
                      {httpData.probeState === "unreachable" ? (
                        <span
                          className="inline-flex rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-apple-text-secondary"
                          title={httpData.probeError || "无法确认细节"}
                        >
                          {httpData.probeLabel}
                        </span>
                      ) : httpData.probeState === "alive" ? (
                        <span className="inline-flex rounded-full border border-apple-green/30 bg-apple-green/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-apple-green-light">
                          {httpData.probeLabel}
                        </span>
                      ) : (
                        <span className="text-[12px] text-apple-text-tertiary">
                          {httpData.probeLabel}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TextCell value={httpData.title} limit={28} className="text-white font-medium" />
                    </TableCell>
                    <TableCell>
                      {typeof statusCode === "number" && statusCode > 0 ? (
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-black ${healthy ? "bg-apple-green/15 text-apple-green-light" : "bg-white/10 text-white"}`}
                        >
                          {statusCode}
                        </span>
                      ) : (
                        <span className="text-[12px] text-apple-text-tertiary">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TimeCell value={item.started_at} />
                    </TableCell>
                    <TableCell>{formatDuration(item.duration_ms)}</TableCell>
                    <TableCell>{renderDetailAction(item)}</TableCell>
                  </TableRow>
                );
              }

              if (recordTab === "vuln_scan") {
                return (
                  <TableRow key={item.unit_id}>
                    <TableCell>
                      <MonoCell value={item.target_key} limit={40} className="text-apple-blue-light" />
                    </TableCell>
                    <TableCell>{renderStatus(item)}</TableCell>
                    <TableCell>
                      <TextCell value={item.worker_id || "-"} limit={24} className="text-apple-text-secondary" />
                    </TableCell>
                    <TableCell>{item.attempt}</TableCell>
                    <TableCell>
                      <TimeCell value={item.started_at} />
                    </TableCell>
                    <TableCell>
                      <TimeCell value={item.finished_at} />
                    </TableCell>
                    <TableCell>{formatDuration(item.duration_ms)}</TableCell>
                    <TableCell>
                      <TextCell value={getCompactVulScanSummary(item)} limit={30} />
                    </TableCell>
                    <TableCell>{renderDetailAction(item)}</TableCell>
                  </TableRow>
                );
              }

              if (recordTab === "weak_scan") {
                return (
                  <TableRow key={item.unit_id}>
                    <TableCell>
                      <MonoCell value={item.target_key} limit={40} className="text-apple-blue-light" />
                    </TableCell>
                    <TableCell>{renderStatus(item)}</TableCell>
                    <TableCell>
                      <TextCell value={item.worker_id || "-"} limit={24} className="text-apple-text-secondary" />
                    </TableCell>
                    <TableCell>{item.attempt}</TableCell>
                    <TableCell>
                      <TimeCell value={item.started_at} />
                    </TableCell>
                    <TableCell>
                      <TimeCell value={item.finished_at} />
                    </TableCell>
                    <TableCell>{formatDuration(item.duration_ms)}</TableCell>
                    <TableCell>
                      <TextCell value={getCompactWeakScanSummary(item)} limit={30} />
                    </TableCell>
                    <TableCell>{renderDetailAction(item)}</TableCell>
                  </TableRow>
                );
              }

              if (recordTab === "secprobe") {
                return (
                  <TableRow key={item.unit_id}>
                    <TableCell>
                      <MonoCell value={item.target_key} limit={40} className="text-apple-blue-light" />
                    </TableCell>
                    <TableCell>{renderStatus(item)}</TableCell>
                    <TableCell>
                      <TextCell value={item.worker_id || "-"} limit={24} className="text-apple-text-secondary" />
                    </TableCell>
                    <TableCell>{item.attempt}</TableCell>
                    <TableCell>
                      <TimeCell value={item.started_at} />
                    </TableCell>
                    <TableCell>
                      <TimeCell value={item.finished_at} />
                    </TableCell>
                    <TableCell>{formatDuration(item.duration_ms)}</TableCell>
                    <TableCell>
                      <TextCell value={getCompactSecprobeSummary(item)} limit={30} />
                    </TableCell>
                    <TableCell>{renderDetailAction(item)}</TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow key={item.unit_id}>
                  <TableCell>
                    {getRecordTypeLabel(
                      undefined,
                      item.task_type,
                      item.task_subtype,
                    )}
                  </TableCell>
                  <TableCell>
                    <MonoCell value={item.target_key} limit={34} />
                  </TableCell>
                  <TableCell>{renderStatus(item)}</TableCell>
                  <TableCell>
                    <TextCell value={item.worker_id || "-"} limit={24} className="text-apple-text-secondary" />
                  </TableCell>
                  <TableCell>{item.attempt}</TableCell>
                  <TableCell>{formatDuration(item.duration_ms)}</TableCell>
                  <TableCell>
                    <TimeCell value={item.started_at} />
                  </TableCell>
                  <TableCell>{renderResultSummary(item)}</TableCell>
                  <TableCell>{renderDetailAction(item)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {total > 0 && (
          <div className="flex justify-between items-center px-6 py-5 border-t border-white/5 bg-white/[0.01]">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-apple-text-tertiary">
              {RECORD_TABS.find((tab) => tab.key === recordTab)?.label ||
                "当前记录"}
              <span className="text-white mx-1">{total}</span>条
            </span>
            {totalPages > 1 && (
              <Pagination
                size="sm"
                page={page}
                total={totalPages}
                onChange={setPage}
                classNames={{
                  wrapper: "gap-2",
                  item: "bg-white/5 text-apple-text-secondary font-bold rounded-xl border border-white/5 hover:bg-white/10 transition-all min-w-[32px] h-8 text-[12px]",
                  cursor:
                    "bg-apple-blue font-black rounded-xl shadow-lg shadow-apple-blue/30 text-white",
                }}
              />
            )}
          </div>
        )}
      </TableFrame>

      <TaskRecordDetailDrawer
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        taskId={taskId}
        record={selectedRecord}
      />
    </div>
  );
}
