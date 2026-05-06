import { useState } from "react";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

import {
  getPoolAssetPortDetails,
  type PoolAssetVM,
  useAssetPoolAssetDetail,
  useAssetPoolAssets,
} from "@/api/adapters/asset";
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

function joinTags(systemFacets: string[], customTags: string[]) {
  return [...systemFacets, ...customTags].filter(Boolean);
}

function sourceLabel(sourceSummary: Record<string, unknown>) {
  const candidate = sourceSummary?.primary_source ?? sourceSummary?.source_type;
  return typeof candidate === "string" && candidate ? candidate : "-";
}

function formatPortSummary(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return "-";
  return `${(value as Array<string | number>).slice(0, 5).join(", ")}${value.length > 5 ? ` …+${value.length - 5}` : ""}`;
}

function formatPortsForPanel(item: PoolAssetVM) {
  const ports = getPoolAssetPortDetails(item.detail);
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

function getStatusTone(status: string) {
  switch (status) {
    case "active":
      return "success" as const;
    case "inactive":
      return "neutral" as const;
    case "error":
      return "danger" as const;
    default:
      return "info" as const;
  }
}

function AssetPoolIpDetailBody({
  poolId,
  item,
}: {
  poolId: string;
  item: PoolAssetVM | null;
}) {
  const detailQuery = useAssetPoolAssetDetail(poolId, item?.id);

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
  const tags = joinTags(detail.system_facets || [], detail.custom_tags || []);
  const portDetails = getPoolAssetPortDetails(detail.detail);
  const sourceCidr =
    typeof detail.detail?.source_cidr === "string" && detail.detail.source_cidr
      ? detail.detail.source_cidr
      : "-";

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
            key: "open-port-count",
            label: "开放端口数",
            value: String(detail.detail?.open_port_count ?? portDetails.length ?? 0),
          },
          {
            key: "source",
            label: "来源",
            value: sourceLabel(detail.source_summary || {}),
          },
          {
            key: "confidence",
            label: "可信度",
            value: detail.confidence_level || "-",
          },
          {
            key: "status",
            label: "状态",
            value: detail.status || "-",
          },
          {
            key: "expanded-from-cidr",
            label: "来源网段",
            value: sourceCidr,
            mono: true,
          },
          {
            key: "tag-summary",
            label: "标签摘要",
            value: tags.length > 0 ? tags.join(", ") : "-",
          },
        ]}
      />

      <EvidenceBlock
        title="端口明细"
        hint={`当前记录共 ${portDetails.length} 个开放端口，主表仅保留摘要。`}
        content={formatPortsForPanel(detail)}
      />
    </>
  );
}

export function AssetPoolIpTab({ poolId }: { poolId: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [keyword, setKeyword] = useState("");
  const [selectedItem, setSelectedItem] = useState<PoolAssetVM | null>(null);

  const { data, isPending, refetch } = useAssetPoolAssets(poolId, {
    page,
    page_size: pageSize,
    keyword: keyword || undefined,
    view: "ip",
  });

  const items = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mb-8 flex w-full animate-in fade-in duration-500 flex-col gap-6">
      <div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col">
          <h3 className="mb-1 text-xl font-black tracking-tight text-white">
            IP 与端口概览
          </h3>
          <p className="text-[13px] font-medium text-apple-text-tertiary">
            主表只保留摘要计数，具体端口明细统一在侧边详情查看。
          </p>
        </div>
        <div className="flex w-full items-center gap-3 md:w-auto">
          <Input
            aria-label="搜索 IP 资产"
            isClearable
            value={keyword}
            placeholder="搜索 IP / 网段..."
            onValueChange={(value) => {
              setKeyword(value);
              setPage(1);
              setSelectedItem(null);
            }}
            classNames={{
              inputWrapper:
                "h-12 w-full rounded-[16px] border border-white/5 bg-apple-tertiary-bg/10 backdrop-blur-md transition-colors hover:bg-apple-tertiary-bg/20 md:w-64",
              input:
                "text-[13px] font-medium placeholder:text-apple-text-tertiary",
            }}
            startContent={
              <MagnifyingGlassIcon className="h-5 w-5 text-apple-text-tertiary" />
            }
          />
          <Button
            aria-label="刷新 IP 资产列表"
            isIconOnly
            variant="flat"
            onPress={() => {
              setSelectedItem(null);
              refetch();
            }}
            className="h-12 w-12 rounded-[16px] border border-white/5 bg-apple-tertiary-bg/10 backdrop-blur-md transition-colors hover:bg-white/10"
          >
            <ArrowPathIcon className="h-5 w-5 text-apple-text-secondary" />
          </Button>
        </div>
      </div>

      <TableFrame className="custom-scrollbar scrollbar-hide md:scrollbar-default">
        <Table
          removeWrapper
          aria-label="IP Assets Table"
          layout="fixed"
          classNames={{
            ...TABLE_CLASS_NAMES,
            base: "min-w-[1240px] p-4",
            tr: `${TABLE_CLASS_NAMES.tr} cursor-default`,
          }}
        >
          <TableHeader>
            <TableColumn width={280}>IP / 网段</TableColumn>
            <TableColumn width={120}>开放端口数</TableColumn>
            <TableColumn width={220}>端口摘要</TableColumn>
            <TableColumn width={120}>可信度</TableColumn>
            <TableColumn width={120}>状态</TableColumn>
            <TableColumn width={180}>来源</TableColumn>
            <TableColumn width={220}>标签</TableColumn>
            <TableColumn width={120}>详情</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="flex flex-col items-center gap-2 py-20 text-sm font-bold text-apple-text-tertiary">
                <span>此资产池下暂无 IP 资产记录。</span>
              </div>
            }
            isLoading={isPending}
            loadingContent={
              <Skeleton className="h-40 w-full rounded-[24px] bg-white/5" />
            }
          >
            {items.map((item) => {
              const tags = joinTags(item.system_facets, item.custom_tags);
              const tagSummary = [
                item.detail?.expanded_from_cidr ? "CIDR展开" : "",
                ...tags,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <MonoCell
                      value={item.display_name}
                      limit={34}
                      className="font-black text-apple-blue-light"
                    />
                  </TableCell>
                  <TableCell>
                    <CountCell value={Number(item.detail?.open_port_count ?? 0)} />
                  </TableCell>
                  <TableCell>
                    <TextCell
                      value={formatPortSummary(item.detail?.open_ports)}
                      limit={30}
                      className="text-apple-text-secondary"
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadgeCell
                      label={item.confidence_level}
                      tone={getConfidenceTone(item.confidence_level)}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadgeCell
                      label={item.status}
                      tone={getStatusTone(item.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextCell
                      value={sourceLabel(item.source_summary)}
                      limit={20}
                      className="text-apple-text-secondary"
                    />
                  </TableCell>
                  <TableCell>
                    <TextCell
                      value={tagSummary}
                      limit={28}
                      className="text-apple-text-secondary"
                    />
                  </TableCell>
                  <TableCell>
                    <ActionCell
                      label="查看详情"
                      onPress={() => setSelectedItem(item)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {total > 0 && (
          <TablePaginationFooter
            summary={(
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-apple-text-tertiary">
                合计归集 <span className="mx-1 text-white">{total}</span> 项 IP 资产
              </span>
            )}
            page={page}
            total={total}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              setSelectedItem(null);
            }}
            onPageSizeChange={(nextPageSize) => {
              setPage(1);
              setPageSize(nextPageSize);
              setSelectedItem(null);
            }}
            className="py-5"
          />
        )}
      </TableFrame>

      <DetailSidePanel
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.display_name || "-"}
        description="端口明细与来源信息统一收口在侧边详情，主表仅保留摘要字段。"
        size="5xl"
        drawerClassNames={{
          base: "z-[140] !w-screen sm:!w-[min(84vw,900px)] xl:!w-[min(78vw,980px)] max-w-none h-dvh max-h-dvh border-l border-white/10 bg-[#09111d]/96 text-white backdrop-blur-3xl",
          header: "bg-[#0b1220] px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7",
          body: "bg-[#09111d] px-5 py-5 sm:px-7 sm:py-6",
          footer: "bg-[#0b1220] px-5 py-4 sm:px-7 sm:py-5",
        }}
        headerClassName="border-b border-white/8"
      >
        <AssetPoolIpDetailBody poolId={poolId} item={selectedItem} />
      </DetailSidePanel>
    </div>
  );
}
