import React, { useMemo, useState } from "react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Input,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from "@heroui/react";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import {
  getProbeStatusLabel,
  parseHttpProbeSummary,
  useAssetPoolAssets,
} from "@/api/adapters/asset";
import type { PoolAssetVM } from "@/api/adapters/asset";
import { APPLE_TABLE_CLASSES } from "@/utils/theme";

function sourceLabel(sourceSummary: Record<string, unknown>) {
  const candidate = sourceSummary?.primary_source ?? sourceSummary?.source_type;
  return typeof candidate === "string" && candidate ? candidate : "-";
}

function joinTags(systemFacets: string[], customTags: string[]) {
  return [...systemFacets, ...customTags].filter(Boolean);
}

function firstNonEmptyText(...values: unknown[]): string {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text =
      typeof value === "string" ? value.trim() : String(value).trim();
    if (text) return text;
  }
  return "";
}

type ProbePayload = Record<string, unknown>;

function extractProbePayload(item: PoolAssetVM): ProbePayload {
  return (item.detail?.extra_payload || item.detail || {}) as ProbePayload;
}

function extractProbeDetail(item: PoolAssetVM) {
  const payload = extractProbePayload(item);
  const summary = parseHttpProbeSummary(payload);
  return {
    summary,
    requestMessage: firstNonEmptyText(payload["request_message"]),
    responseHeaderText: firstNonEmptyText(payload["response_header_text"]),
    responseBody: firstNonEmptyText(payload["response_body"]),
    siteURL: firstNonEmptyText(payload["site_url"], item.display_name),
    statusCode: summary?.status_code ?? null,
    title: summary?.title || "",
    icp: summary?.icp || "",
    server: summary?.server || "",
    contentLength: summary?.content_length ?? null,
    htmlHash: summary?.html_hash || "",
    faviconHash: summary?.favicon_hash || "",
    probeStatus: summary?.probe_status || "",
    probeError: summary?.probe_error || "",
  };
}

function truncateText(value: string, limit = 32) {
  const text = value.trim();
  if (!text) return "-";
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function InlineTextCell({
  value,
  limit = 28,
  mono = false,
}: {
  value: string;
  limit?: number;
  mono?: boolean;
}) {
  const text = value.trim();
  if (!text)
    return <span className="text-[12px] text-apple-text-tertiary">-</span>;
  const content = (
    <span
      className={`${mono ? "font-mono" : ""} text-[12px] text-white font-medium block truncate`}
    >
      {truncateText(text, limit)}
    </span>
  );
  return text.length > limit ? (
    <Tooltip content={text}>{content}</Tooltip>
  ) : (
    content
  );
}

function StatusBadge({ item }: { item: PoolAssetVM }) {
  const detail = extractProbeDetail(item);
  const status = detail.probeStatus;
  if (status === "alive") {
    return (
      <span className="inline-flex items-center rounded-full border border-apple-green/30 bg-apple-green/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-apple-green-light">
        站点存活
      </span>
    );
  }
  if (status === "unreachable") {
    return (
      <Tooltip content={detail.probeError || "无法确认细节"}>
        <span className="inline-flex cursor-help items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-apple-text-secondary">
          站点不存活
        </span>
      </Tooltip>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
      -
    </span>
  );
}

function StatusCodeBadge({ code }: { code: number | null }) {
  if (!code)
    return <span className="text-[12px] text-apple-text-tertiary">-</span>;
  const healthy = code >= 200 && code < 400;
  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-black ${healthy ? "bg-apple-green/15 text-apple-green-light" : "bg-white/10 text-white"}`}
    >
      {code}
    </span>
  );
}

function DetailPair({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-apple-text-tertiary">
        {label}
      </div>
      <div
        className={`${mono ? "font-mono text-[12px]" : "text-sm"} break-all text-white`}
      >
        {value}
      </div>
    </div>
  );
}

function MessageBlock({ title, content }: { title: string; content: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const text = content || "-";
  const canCollapse = text.length > 1200;

  async function handleCopy() {
    if (!text || text === "-") return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-apple-text-tertiary">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="flat"
            className="min-w-0 rounded-lg bg-white/6 px-3 text-[11px] font-bold text-white hover:bg-white/10"
            onPress={handleCopy}
          >
            {copied ? "已复制" : "复制"}
          </Button>
          {canCollapse && (
            <Button
              size="sm"
              variant="flat"
              className="min-w-0 rounded-lg bg-white/6 px-3 text-[11px] font-bold text-white hover:bg-white/10"
              onPress={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "收起" : "展开"}
            </Button>
          )}
        </div>
      </div>
      <pre
        className={`${expanded ? "max-h-[min(60vh,760px)]" : "max-h-[min(34vh,400px)]"} overflow-auto overscroll-contain rounded-[22px] border border-white/8 bg-black/30 p-4 sm:p-5 font-mono text-xs leading-relaxed text-apple-text-secondary whitespace-pre-wrap break-all`}
      >
        {text}
      </pre>
    </section>
  );
}

function SiteDetailDrawer({
  item,
  onClose,
}: {
  item: PoolAssetVM | null;
  onClose: () => void;
}) {
  const detail = useMemo(
    () => (item ? extractProbeDetail(item) : null),
    [item],
  );

  return (
    <Drawer
      isOpen={Boolean(item)}
      onOpenChange={(open) => !open && onClose()}
      placement="right"
      backdrop="blur"
      scrollBehavior="inside"
      classNames={{
        base: "z-[140] !w-screen sm:!w-[min(88vw,920px)] xl:!w-[min(82vw,1040px)] max-w-none h-dvh max-h-dvh border-l border-white/10 bg-[#09111d]/96 text-white backdrop-blur-3xl",
        header: "border-b border-white/8 px-5 pt-6 pb-5 sm:px-7 sm:pt-7 sm:pb-6",
        body: "px-5 py-5 sm:px-7 sm:py-6",
        footer: "border-t border-white/8 px-5 py-4 sm:px-7 sm:py-5",
      }}
    >
      <DrawerContent>
        {() => (
          <>
            <DrawerHeader className="flex flex-col gap-3 bg-[#0b1220]">
              <div className="space-y-2">
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-apple-text-tertiary">
                  站点详情
                </div>
                <h3 className="break-all text-xl font-black tracking-tight text-white sm:text-2xl">
                  {item?.display_name || "-"}
                </h3>
                <p className="break-all font-mono text-xs text-apple-blue-light">
                  {item?.normalized_key || "-"}
                </p>
              </div>
            </DrawerHeader>
            <DrawerBody className="space-y-6 overflow-y-auto bg-[#09111d]">
              {detail && (
                <>
                  <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <DetailPair
                      label="页面 URL"
                      value={detail.siteURL || "-"}
                      mono
                    />
                    <DetailPair
                      label="存活状态"
                      value={getProbeStatusLabel(detail.probeStatus) || "-"}
                    />
                    <DetailPair
                      label="状态码"
                      value={detail.statusCode ? String(detail.statusCode) : "-"}
                    />
                    <DetailPair label="页面标题" value={detail.title || "-"} />
                    <DetailPair label="ICP备案" value={detail.icp || "-"} />
                    <DetailPair label="Server" value={detail.server || "-"} />
                  </section>

                  <section className="grid gap-3 md:grid-cols-2">
                    <DetailPair
                      label="来源标识"
                      value={sourceLabel(item?.source_summary || {})}
                    />
                    <DetailPair
                      label="响应概览"
                      value={
                        detail.contentLength !== null
                          ? `内容长度 ${detail.contentLength} 字节`
                          : detail.probeError || "-"
                      }
                    />
                  </section>

                  {joinTags(item?.system_facets || [], item?.custom_tags || [])
                    .length > 0 && (
                    <section className="space-y-3">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-apple-text-tertiary">
                        特征标签
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {joinTags(
                          item?.system_facets || [],
                          item?.custom_tags || [],
                        ).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-apple-text-secondary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {detail.probeError && (
                    <MessageBlock
                      title="探测错误"
                      content={detail.probeError}
                    />
                  )}

                  <MessageBlock
                    title="请求报文"
                    content={
                      detail.requestMessage || "当前站点资产未保存请求报文。"
                    }
                  />
                  <MessageBlock
                    title="响应头"
                    content={
                      detail.responseHeaderText || "当前站点资产未保存响应头。"
                    }
                  />
                  <MessageBlock
                    title="响应体"
                    content={
                      detail.responseBody || "当前站点资产未保存响应体。"
                    }
                  />
                </>
              )}
            </DrawerBody>
            <DrawerFooter className="bg-[#0b1220]">
              <Button
                fullWidth
                variant="flat"
                className="rounded-xl bg-white/8 px-5 font-bold text-white hover:bg-white/12"
                onPress={onClose}
              >
                关闭
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export function AssetPoolSiteTab({ poolId }: { poolId: string }) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [selectedItem, setSelectedItem] = useState<PoolAssetVM | null>(null);

  const { data, isPending, refetch } = useAssetPoolAssets(poolId, {
    page,
    page_size: pageSize,
    keyword: keyword || undefined,
    view: "site",
  });

  const items = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mb-8 flex w-full animate-in fade-in duration-500 flex-col gap-6">
      <div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col">
          <h3 className="mb-1 text-xl font-black tracking-tight text-white">
            站点与服务平面
          </h3>
          <p className="text-[13px] font-medium text-apple-text-tertiary">
            核心站点状态直接展示在表格中，请求与响应内容通过详情侧栏查看。
          </p>
        </div>
        <div className="flex w-full items-center gap-3 md:w-auto">
          <Input
            isClearable
            value={keyword}
            placeholder="搜索 URL、标题或备案信息..."
            onValueChange={(v) => {
              setKeyword(v);
              setPage(1);
            }}
            classNames={{
              inputWrapper:
                "h-12 w-full rounded-[16px] border border-white/5 bg-apple-tertiary-bg/10 backdrop-blur-md transition-colors hover:bg-apple-tertiary-bg/20 md:w-72",
              input:
                "text-[13px] font-medium placeholder:text-apple-text-tertiary",
            }}
            startContent={
              <MagnifyingGlassIcon className="h-5 w-5 text-apple-text-tertiary" />
            }
          />
          <Button
            isIconOnly
            variant="flat"
            onPress={() => refetch()}
            className="h-12 w-12 rounded-[16px] border border-white/5 bg-apple-tertiary-bg/10 backdrop-blur-md transition-colors hover:bg-white/10"
          >
            <ArrowPathIcon className="h-5 w-5 text-apple-text-secondary" />
          </Button>
        </div>
      </div>

      <div className="custom-scrollbar overflow-x-auto rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl scrollbar-hide md:scrollbar-default">
        <Table
          removeWrapper
          aria-label="Site Assets Table"
          layout="fixed"
          classNames={{
            ...APPLE_TABLE_CLASSES,
            base: "min-w-[1280px] p-4",
            tr: `${APPLE_TABLE_CLASSES.tr} cursor-default`,
          }}
        >
          <TableHeader>
            <TableColumn width={320}>站点实体 / URL</TableColumn>
            <TableColumn width={140}>存活状态</TableColumn>
            <TableColumn width={240}>页面标题</TableColumn>
            <TableColumn width={110}>状态码</TableColumn>
            <TableColumn width={220}>ICP 备案</TableColumn>
            <TableColumn width={110}>置信度</TableColumn>
            <TableColumn width={150}>来源标识</TableColumn>
            <TableColumn width={120}>详情</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="flex flex-col items-center gap-2 py-20 text-sm font-bold text-apple-text-tertiary">
                <span>此资产池下暂无 Web 站点事实资产 (NULL_SITE_ASSETS)</span>
              </div>
            }
            isLoading={isPending}
            loadingContent={
              <Skeleton className="h-40 w-full rounded-[24px] bg-white/5" />
            }
          >
            {items.map((it) => {
              const detail = extractProbeDetail(it);
              return (
                <TableRow key={it.id}>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="break-all font-mono text-[14px] font-black tracking-tight text-apple-blue-light drop-shadow-[0_0_8px_rgba(0,113,227,0.3)]">
                        {it.display_name}
                      </span>
                      <span className="break-all font-mono text-[11px] text-white/55">
                        {it.normalized_key}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge item={it} />
                  </TableCell>
                  <TableCell>
                    <InlineTextCell value={detail.title} limit={34} />
                  </TableCell>
                  <TableCell>
                    <StatusCodeBadge code={detail.statusCode} />
                  </TableCell>
                  <TableCell>
                    <InlineTextCell value={detail.icp} limit={30} />
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full border border-apple-green/20 bg-apple-green/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-apple-green-light">
                      {it.confidence_level}
                    </span>
                  </TableCell>
                  <TableCell>
                    <InlineTextCell
                      value={sourceLabel(it.source_summary)}
                      limit={18}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="flat"
                      className="rounded-xl border border-white/10 bg-white/6 px-3 text-[11px] font-black text-white hover:bg-white/10"
                      onPress={() => setSelectedItem(it)}
                    >
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.01] px-6 py-5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-apple-text-tertiary">
              合计归集 <span className="mx-1 text-white">{total}</span>{" "}
              项站点实体
            </span>
            {totalPages > 1 && (
              <Pagination
                size="sm"
                page={page}
                total={totalPages}
                onChange={setPage}
                classNames={{
                  wrapper: "gap-2",
                  item: "min-w-[32px] h-8 rounded-xl border border-white/5 bg-white/5 text-[12px] font-bold text-apple-text-secondary transition-all hover:bg-white/10",
                  cursor:
                    "rounded-xl bg-apple-blue font-black text-white shadow-lg shadow-apple-blue/30",
                  prev: "rounded-xl bg-white/5 text-white/50 hover:bg-white/10",
                  next: "rounded-xl bg-white/5 text-white/50 hover:bg-white/10",
                }}
              />
            )}
          </div>
        )}
      </div>

      <SiteDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
