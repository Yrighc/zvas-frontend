import { useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  Skeleton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
} from "@heroui/react";

import { parseHttpProbeSummary } from "@/api/adapters/asset";
import {
  getTaskSnapshotAssetPortDetails,
  type TaskSnapshotAssetVM,
  useTaskSnapshotAssetDetail,
  useTaskSnapshotAssets,
} from "@/api/adapters/task";
import { useUrlTabState } from "@/hooks/useUrlTabState";
import { TableFrame } from "@/components/table/TableFrame";
import { DEFAULT_TABLE_PAGE_SIZE, TablePaginationFooter } from "@/components/table/TablePaginationFooter";
import { ActionCell } from "@/components/table/cells/ActionCell";
import { CountCell } from "@/components/table/cells/CountCell";
import { MonoCell } from "@/components/table/cells/MonoCell";
import { StatusBadgeCell } from "@/components/table/cells/StatusBadgeCell";
import { TextCell } from "@/components/table/cells/TextCell";
import { DetailSidePanel } from "@/components/table/detail/DetailSidePanel";
import { EvidenceBlock } from "@/components/table/detail/EvidenceBlock";
import { KeyValueGrid } from "@/components/table/detail/KeyValueGrid";
import { TABLE_CLASS_NAMES } from "@/components/table/tableClassNames";

const TASK_ASSET_KIND_TABS = ["ip", "domain", "site"] as const;

const ASSET_KIND_LABEL: Record<string, string> = {
  ip: "IP",
  domain: "域名",
  site: "站点",
};

function formatPorts(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return "-";
  return `${(value as Array<string | number>).slice(0, 5).join(", ")}${value.length > 5 ? ` …+${value.length - 5}` : ""}`;
}

function joinTags(item: TaskSnapshotAssetVM) {
  return [
    item.extra_payload?.expanded_from_cidr ? "CIDR展开" : "",
    ...(item.system_facets || []),
  ].filter(Boolean);
}

function formatDetailList(value: unknown, emptyLabel: string) {
  if (!Array.isArray(value) || value.length === 0) return emptyLabel;
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .join("\n");
}

function formatPortDetails(item: TaskSnapshotAssetVM) {
  const ports = getTaskSnapshotAssetPortDetails(item.extra_payload);
  if (ports.length === 0) return "暂无端口明细记录";

  return ports
    .map((port) =>
      [
        `${port.port}/${port.protocol}`,
        port.service !== "-" ? `service=${port.service}` : "",
        port.status !== "-" ? `status=${port.status}` : "",
        port.banner !== "-" ? `banner=${port.banner}` : "",
        port.cert_subject !== "-" ? `cert=${port.cert_subject}` : "",
        port.dns_names !== "-" ? `dns=${port.dns_names}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    )
    .join("\n");
}

function getProbeStatusLabel(status: string | undefined) {
  if (status === "alive") return "站点存活";
  if (status === "unreachable") return "站点不存活";
  return status?.trim() || "-";
}

function getConfidenceTone(confidence: string) {
  switch (confidence) {
    case "high":
      return "success" as const;
    case "medium":
      return "warning" as const;
    case "low":
      return "neutral" as const;
    default:
      return "info" as const;
  }
}

function TaskAssetDetailBody({
  taskId,
  item,
}: {
  taskId?: string;
  item: TaskSnapshotAssetVM | null;
}) {
  const detailQuery = useTaskSnapshotAssetDetail(taskId, item?.id);

  if (!item) return null;

  if (detailQuery.isPending) {
    return <Skeleton className="h-48 w-full rounded-[24px] bg-white/5" />;
  }

  if (detailQuery.isError) {
    return (
      <div className="rounded-2xl border border-apple-red/20 bg-apple-red/10 px-4 py-5 text-sm font-bold text-apple-red-light">
        详情加载失败，请关闭侧栏后重试。
      </div>
    );
  }

  const detail = detailQuery.data ?? item;
  const tags = joinTags(detail);

  if (detail.asset_kind === "ip") {
    const portDetails = getTaskSnapshotAssetPortDetails(detail.extra_payload);
    return (
      <>
        <KeyValueGrid
          items={[
            {
              key: "display-name",
              label: "IP / 网段",
              value: detail.display_name || "-",
              mono: true,
            },
            {
              key: "normalized-key",
              label: "标准键",
              value: detail.normalized_key || "-",
              mono: true,
            },
            {
              key: "origin-type",
              label: "来源类型",
              value: detail.origin_type || "-",
            },
            {
              key: "source-type",
              label: "来源",
              value: detail.source_type || "-",
            },
            {
              key: "open-port-count",
              label: "开放端口数",
              value: String(detail.extra_payload?.open_port_count ?? portDetails.length),
            },
            {
              key: "domain-count",
              label: "关联域名数",
              value: String(detail.extra_payload?.domain_count ?? "-"),
            },
            {
              key: "cert-count",
              label: "证书主体数",
              value: String(detail.extra_payload?.cert_count ?? "-"),
            },
            {
              key: "source-cidr",
              label: "来源网段",
              value: String(detail.extra_payload?.source_cidr || "-"),
              mono: true,
            },
            {
              key: "tags",
              label: "标签摘要",
              value: tags.length > 0 ? tags.join(", ") : "-",
            },
          ]}
        />
        <EvidenceBlock
          title="端口明细"
          hint={`当前记录共 ${portDetails.length} 个开放端口，主表仅保留摘要。`}
          content={formatPortDetails(detail)}
        />
        <EvidenceBlock
          title="关联域名"
          content={formatDetailList(detail.extra_payload?.related_domains, "暂无关联域名")}
        />
      </>
    );
  }

  if (detail.asset_kind === "domain") {
    return (
      <>
        <KeyValueGrid
          items={[
            {
              key: "display-name",
              label: "域名",
              value: detail.display_name || "-",
              mono: true,
            },
            {
              key: "normalized-key",
              label: "标准键",
              value: detail.normalized_key || "-",
              mono: true,
            },
            {
              key: "root-domain",
              label: "根域",
              value:
                String(
                  detail.extra_payload?.root_domain ||
                    detail.display_name.split(".").slice(-2).join(".") ||
                    "-",
                ),
            },
            {
              key: "origin-type",
              label: "来源类型",
              value: detail.origin_type || "-",
            },
            {
              key: "ip-count",
              label: "关联 IP 数",
              value: String(detail.extra_payload?.ip_count ?? "-"),
            },
            {
              key: "site-count",
              label: "关联站点数",
              value: String(detail.extra_payload?.site_count ?? "-"),
            },
            {
              key: "source-type",
              label: "来源",
              value: detail.source_type || "-",
            },
            {
              key: "tags",
              label: "标签摘要",
              value: tags.length > 0 ? tags.join(", ") : "-",
            },
          ]}
        />
        <EvidenceBlock
          title="关联解析 IP"
          content={formatDetailList(detail.extra_payload?.related_ips, "暂无关联 IP")}
        />
        <EvidenceBlock
          title="关联站点"
          content={formatDetailList(detail.extra_payload?.related_sites, "暂无关联站点")}
        />
      </>
    );
  }

  const summary = parseHttpProbeSummary(detail.extra_payload);
  return (
    <>
      <KeyValueGrid
        items={[
          {
            key: "display-name",
            label: "站点标识",
            value: detail.display_name || "-",
            mono: true,
          },
          {
            key: "page-root-url",
            label: "页面根 URL",
            value: summary?.site_url || detail.display_name || "-",
            mono: true,
          },
          {
            key: "probe-status",
            label: "探测状态",
            value: getProbeStatusLabel(summary?.probe_status),
          },
          {
            key: "status-code",
            label: "状态码",
            value: String(summary?.status_code ?? "-"),
          },
          {
            key: "title",
            label: "页面标题",
            value: summary?.title || "-",
          },
          {
            key: "server",
            label: "Server",
            value: summary?.server || "-",
          },
          {
            key: "favicon-hash",
            label: "Favicon Hash",
            value: summary?.favicon_hash || "-",
          },
          {
            key: "content-length",
            label: "内容长度",
            value: String(summary?.content_length ?? "-"),
          },
          {
            key: "icp",
            label: "ICP 备案",
            value: summary?.icp || "-",
          },
        ]}
      />
      {summary?.probe_error ? (
        <EvidenceBlock title="探测错误" content={summary.probe_error} />
      ) : null}
    </>
  );
}

export function TaskAssetViewTab({ taskId }: { taskId?: string }) {
  const [assetKind, setAssetKind] = useUrlTabState({
    param: "asset_tab",
    defaultValue: "ip",
    values: TASK_ASSET_KIND_TABS,
  });
  const [originFilter, setOriginFilter] = useState<"all" | "input" | "expanded">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [selectedAsset, setSelectedAsset] = useState<TaskSnapshotAssetVM | null>(
    null,
  );

  const query = useTaskSnapshotAssets(taskId, {
    page,
    page_size: pageSize,
    asset_kind: assetKind,
    sort: "created_at",
    order: "desc",
    ...(originFilter !== "all" ? { origin_type: originFilter } : {}),
  });

  const items = query.data?.data || [];
  const total = query.data?.pagination?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns = useMemo(() => {
    const base = [
      <TableColumn key="display_name" width={280}>
        显示值
      </TableColumn>,
    ];

    if (assetKind === "ip") {
      base.push(
        <TableColumn key="open_port_count" width={120}>
          开放端口数
        </TableColumn>,
        <TableColumn key="open_ports" width={220}>
          端口摘要
        </TableColumn>,
        <TableColumn key="domain_count" width={120}>
          关联域名数
        </TableColumn>,
      );
    } else if (assetKind === "domain") {
      base.push(
        <TableColumn key="root_domain" width={220}>
          根域
        </TableColumn>,
        <TableColumn key="ip_count" width={120}>
          关联 IP 数
        </TableColumn>,
        <TableColumn key="site_count" width={120}>
          关联站点数
        </TableColumn>,
      );
    } else {
      base.push(
        <TableColumn key="title" width={240}>
          Title
        </TableColumn>,
        <TableColumn key="status_code" width={120}>
          状态码
        </TableColumn>,
        <TableColumn key="cert" width={160}>
          证书
        </TableColumn>,
      );
    }

    base.push(
      <TableColumn key="source_type" width={140}>
        来源
      </TableColumn>,
      <TableColumn key="confidence_level" width={120}>
        可信度
      </TableColumn>,
      <TableColumn key="labels" width={220}>
        标签
      </TableColumn>,
      <TableColumn key="actions" width={120}>
        详情
      </TableColumn>,
    );

    return base;
  }, [assetKind]);

  return (
    <div className="mb-8 flex w-full animate-in fade-in duration-500 flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-2 md:flex-row md:items-center">
        <Tabs
          aria-label="Asset Type"
          selectedKey={assetKind}
          onSelectionChange={(key) => {
            setAssetKind(key as "ip" | "domain" | "site");
            setSelectedAsset(null);
            setPage(1);
          }}
          variant="underlined"
          classNames={{
            tabList: "gap-6 p-0",
            cursor: "h-[2px] w-full bg-apple-blue",
            tab: "h-12 px-2 text-[12px] uppercase tracking-widest text-apple-text-secondary transition-colors data-[selected=true]:font-black data-[selected=true]:text-white",
          }}
        >
          <Tab key="ip" title="IP" />
          <Tab key="domain" title="域名" />
          <Tab key="site" title="站点" />
        </Tabs>

        <ButtonGroup
          size="sm"
          variant="flat"
          className="h-10 rounded-xl border border-white/10 bg-apple-tertiary-bg/20 p-1 backdrop-blur-xl"
        >
          <Button
            className={`rounded-lg px-4 text-[11px] font-black tracking-widest transition-all ${originFilter === "all" ? "bg-white/10 text-white shadow-md" : "bg-transparent text-apple-text-tertiary hover:text-white"}`}
            onPress={() => {
              setOriginFilter("all");
              setSelectedAsset(null);
              setPage(1);
            }}
          >
            全部
          </Button>
          <Button
            className={`rounded-lg px-4 text-[11px] font-black tracking-widest transition-all ${originFilter === "input" ? "bg-white/10 text-white shadow-md" : "bg-transparent text-apple-text-tertiary hover:text-white"}`}
            onPress={() => {
              setOriginFilter("input");
              setSelectedAsset(null);
              setPage(1);
            }}
          >
            输入资产
          </Button>
          <Button
            className={`rounded-lg px-4 text-[11px] font-black tracking-widest transition-all ${originFilter === "expanded" ? "bg-white/10 text-white shadow-md" : "bg-transparent text-apple-text-tertiary hover:text-white"}`}
            onPress={() => {
              setOriginFilter("expanded");
              setSelectedAsset(null);
              setPage(1);
            }}
          >
            本次发现
          </Button>
        </ButtonGroup>
      </div>

      <TableFrame className="custom-scrollbar scrollbar-hide md:scrollbar-default">
        <Table
          removeWrapper
          aria-label={`Task Asset ${ASSET_KIND_LABEL[assetKind]} Table`}
          layout="fixed"
          classNames={{
            ...TABLE_CLASS_NAMES,
            base: "min-w-[1180px] p-4",
            tr: `${TABLE_CLASS_NAMES.tr} cursor-default`,
          }}
        >
          <TableHeader>{columns}</TableHeader>
          <TableBody
            emptyContent={
              <div className="flex flex-col items-center gap-2 py-20 text-[13px] font-bold uppercase tracking-widest text-apple-text-tertiary">
                当前筛选条件下暂无资产记录。
              </div>
            }
            isLoading={query.isPending}
            loadingContent={
              <Skeleton className="h-40 w-full rounded-[24px] bg-white/5" />
            }
          >
            {items.map((item) => {
              const tags = joinTags(item).join(", ");
              const siteSummary = assetKind === "site"
                ? parseHttpProbeSummary(item.extra_payload)
                : null;
              const rowCells = [
                <TableCell key="display_name">
                  <MonoCell value={item.display_name} limit={36} className="font-bold text-white" />
                </TableCell>,
              ];

              if (assetKind === "ip") {
                rowCells.push(
                  <TableCell key="open_port_count">
                    <CountCell value={Number(item.extra_payload?.open_port_count ?? 0)} />
                  </TableCell>,
                  <TableCell key="open_ports">
                    <TextCell
                      value={formatPorts(item.extra_payload?.open_ports)}
                      limit={30}
                      className="text-apple-text-secondary"
                    />
                  </TableCell>,
                  <TableCell key="domain_count">
                    <CountCell
                      value={
                        typeof item.extra_payload?.domain_count === "number"
                          ? item.extra_payload.domain_count
                          : null
                      }
                    />
                  </TableCell>,
                );
              } else if (assetKind === "domain") {
                rowCells.push(
                  <TableCell key="root_domain">
                    <TextCell
                      value={
                        item.extra_payload?.root_domain ||
                        item.display_name.split(".").slice(-2).join(".")
                      }
                      limit={28}
                      className="text-apple-text-secondary"
                    />
                  </TableCell>,
                  <TableCell key="ip_count">
                    <CountCell
                      value={
                        typeof item.extra_payload?.ip_count === "number"
                          ? item.extra_payload.ip_count
                          : null
                      }
                    />
                  </TableCell>,
                  <TableCell key="site_count">
                    <CountCell
                      value={
                        typeof item.extra_payload?.site_count === "number"
                          ? item.extra_payload.site_count
                          : null
                      }
                    />
                  </TableCell>,
                );
              } else {
                rowCells.push(
                  <TableCell key="title">
                    <TextCell
                      value={siteSummary?.title || "-"}
                      limit={30}
                      className="text-apple-text-secondary"
                    />
                  </TableCell>,
                  <TableCell key="status_code">
                    <TextCell
                      value={
                        siteSummary?.status_code
                          ? String(siteSummary.status_code)
                          : "-"
                      }
                      limit={10}
                      className="text-apple-text-secondary"
                    />
                  </TableCell>,
                  <TableCell key="cert">
                    <TextCell value="-" limit={10} className="text-apple-text-secondary" />
                  </TableCell>,
                );
              }

              rowCells.push(
                <TableCell key="source_type">
                  <TextCell
                    value={item.source_type || "-"}
                    limit={18}
                    className="text-apple-text-secondary"
                  />
                </TableCell>,
                <TableCell key="confidence_level">
                  <StatusBadgeCell
                    label={item.confidence_level || "-"}
                    tone={getConfidenceTone(item.confidence_level)}
                  />
                </TableCell>,
                <TableCell key="labels">
                  <TextCell
                    value={tags}
                    limit={28}
                    className="text-apple-text-secondary"
                  />
                </TableCell>,
                <TableCell key="actions">
                  <ActionCell
                    label="查看详情"
                    onPress={() => setSelectedAsset(item)}
                  />
                </TableCell>,
              );

              return (
                <TableRow key={item.id}>
                  {rowCells}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {total > 0 && (
          <TablePaginationFooter
            summary={(
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-apple-text-tertiary">
                合计本次视图资产 <span className="mx-1 text-white">{total}</span> 项
              </span>
            )}
            page={page}
            total={total}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              setSelectedAsset(null);
            }}
            onPageSizeChange={(nextPageSize) => {
              setPage(1);
              setPageSize(nextPageSize);
              setSelectedAsset(null);
            }}
          />
        )}
      </TableFrame>

      <DetailSidePanel
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset?.display_name || "-"}
        description="任务资产详情统一在侧边面板承载，主表只保留检索与对比所需摘要字段。"
        size="5xl"
        drawerClassNames={{
          base: "z-[140] !w-screen sm:!w-[min(84vw,900px)] xl:!w-[min(78vw,980px)] max-w-none h-dvh max-h-dvh border-l border-white/10 bg-[#09111d]/96 text-white backdrop-blur-3xl",
          header: "bg-[#0b1220] px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7",
          body: "bg-[#09111d] px-5 py-5 sm:px-7 sm:py-6",
          footer: "bg-[#0b1220] px-5 py-4 sm:px-7 sm:py-5",
        }}
        headerClassName="border-b border-white/8"
      >
        <TaskAssetDetailBody taskId={taskId} item={selectedAsset} />
      </DetailSidePanel>
    </div>
  );
}
