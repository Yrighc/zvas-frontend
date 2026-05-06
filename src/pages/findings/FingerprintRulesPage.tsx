import {
  Alert,
  Button,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  Tooltip,
} from '@heroui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  PowerIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'

import { isApiError } from '@/api/client'
import {
  createFingerprintRule,
  deleteFingerprintRule,
  exportFingerprintRulesYAML,
  importFingerprintRules,
  updateFingerprintRule,
  useFingerprintRules,
  type FingerprintRuleUpsertPayload,
  type FingerprintRuleView,
} from '@/api/adapters/fingerprint'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { DEFAULT_TABLE_PAGE_SIZE, TablePaginationFooter } from '@/components/table/TablePaginationFooter'
import { APPLE_TABLE_CLASSES } from '@/utils/theme'

type FilterStatus = 'all' | '1' | '0'
type NoticeTone = 'success' | 'danger' | 'warning'
type DrawerMode = 'create' | 'edit' | null

interface RuleDraft {
  product_name: string
  rule_content: string
  status: FilterStatus
}

const EMPTY_DRAFT: RuleDraft = {
  product_name: '',
  rule_content: '',
  status: '1',
}

function formatDateTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

function truncateText(value: string, limit = 88) {
  const text = value.trim()
  if (!text) return '-'
  return text.length > limit ? `${text.slice(0, limit)}...` : text
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    return error.message || fallback
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

function toPayload(draft: RuleDraft): FingerprintRuleUpsertPayload {
  return {
    product_name: draft.product_name.trim(),
    rule_content: draft.rule_content.trim(),
    status: Number(draft.status),
  }
}

function statusMeta(status: number) {
  return status === 1
    ? { label: '启用', className: 'border-apple-green/25 bg-apple-green/10 text-apple-green-light' }
    : { label: '禁用', className: 'border-white/10 bg-white/5 text-apple-text-secondary' }
}

export function FingerprintRulesPage() {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [notice, setNotice] = useState<{ type: NoticeTone; title: string; message: string } | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [draft, setDraft] = useState<RuleDraft>(EMPTY_DRAFT)
  const [editingRule, setEditingRule] = useState<FingerprintRuleView | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importContent, setImportContent] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<FingerprintRuleView | null>(null)
  const [toggleTarget, setToggleTarget] = useState<FingerprintRuleView | null>(null)

  const queryParams = useMemo(() => ({
    page,
    page_size: pageSize,
    keyword: keyword.trim() || undefined,
    status: statusFilter === 'all' ? undefined : Number(statusFilter),
  }), [keyword, page, pageSize, statusFilter])

  const rulesQuery = useFingerprintRules(queryParams)
  const items = rulesQuery.data?.data || []
  const total = rulesQuery.data?.pagination?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const activeCount = items.filter((item) => item.status === 1).length
  const disabledCount = items.filter((item) => item.status !== 1).length

  const refreshRules = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/fingerprints'] })
  }

  const createMutation = useMutation({
    mutationFn: createFingerprintRule,
    onSuccess: async () => {
      setNotice({ type: 'success', title: '创建成功', message: '新指纹规则已写入规则库。' })
      setEditingRule(null)
      setDraft(EMPTY_DRAFT)
      await refreshRules()
    },
    onError: (error) => {
      setNotice({ type: 'danger', title: '创建失败', message: resolveErrorMessage(error, '创建指纹规则失败') })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FingerprintRuleUpsertPayload }) => updateFingerprintRule(id, payload),
    onSuccess: async (_, variables) => {
      setNotice({
        type: 'success',
        title: '更新成功',
        message: variables.payload.status === 1 ? '指纹规则已更新并保持启用。' : '指纹规则已更新并设为禁用。',
      })
      setEditingRule(null)
      setDraft(EMPTY_DRAFT)
      await refreshRules()
    },
    onError: (error) => {
      setNotice({ type: 'danger', title: '更新失败', message: resolveErrorMessage(error, '更新指纹规则失败') })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFingerprintRule,
    onSuccess: async () => {
      setNotice({ type: 'success', title: '删除成功', message: '指纹规则已从规则库移除。' })
      setDeleteTarget(null)
      await refreshRules()
    },
    onError: (error) => {
      setNotice({ type: 'danger', title: '删除失败', message: resolveErrorMessage(error, '删除指纹规则失败') })
    },
  })

  const importMutation = useMutation({
    mutationFn: importFingerprintRules,
    onSuccess: async (count) => {
      setNotice({ type: 'success', title: '导入成功', message: `已导入 ${count} 条指纹规则。` })
      setImportOpen(false)
      setImportContent('')
      setPage(1)
      await refreshRules()
    },
    onError: (error) => {
      setNotice({ type: 'danger', title: '导入失败', message: resolveErrorMessage(error, '导入 YAML 失败') })
    },
  })

  const exportMutation = useMutation({
    mutationFn: exportFingerprintRulesYAML,
    onSuccess: () => {
      setNotice({ type: 'success', title: '导出成功', message: 'YAML 文件已开始下载。' })
    },
    onError: (error) => {
      setNotice({ type: 'danger', title: '导出失败', message: resolveErrorMessage(error, '导出 YAML 失败') })
    },
  })

  const isDrawerOpen = drawerMode !== null

  const handleOpenCreate = () => {
    setDrawerMode('create')
    setEditingRule(null)
    setDraft(EMPTY_DRAFT)
  }

  const handleOpenEdit = (rule: FingerprintRuleView) => {
    setDrawerMode('edit')
    setEditingRule(rule)
    setDraft({
      product_name: rule.product_name,
      rule_content: rule.rule_content,
      status: rule.status === 1 ? '1' : '0',
    })
  }

  const handleCloseDrawer = () => {
    setDrawerMode(null)
    setEditingRule(null)
    setDraft(EMPTY_DRAFT)
  }

  const handleSubmit = async () => {
    const payload = toPayload(draft)
    if (!payload.product_name || !payload.rule_content) {
      setNotice({ type: 'warning', title: '表单未完成', message: '请填写产品名称和规则内容。' })
      return
    }

    if (drawerMode === 'edit' && editingRule) {
      await updateMutation.mutateAsync({ id: editingRule.id, payload })
      return
    }

    await createMutation.mutateAsync(payload)
  }

  const handleToggleStatus = async () => {
    if (!toggleTarget) return
    await updateMutation.mutateAsync({
      id: toggleTarget.id,
      payload: {
        product_name: toggleTarget.product_name,
        rule_content: toggleTarget.rule_content,
        status: toggleTarget.status === 1 ? 0 : 1,
      },
    })
    setToggleTarget(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget.id)
  }

  const handleImport = async () => {
    if (!importContent.trim()) {
      setNotice({ type: 'warning', title: '内容为空', message: '请粘贴待导入的 YAML 规则内容。' })
      return
    }
    await importMutation.mutateAsync(importContent)
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-4 pb-20 text-apple-text-primary animate-in fade-in duration-700">
      <section className="mt-4 flex flex-col gap-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-[26px] font-semibold tracking-tight text-white">指纹管理</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-apple-text-tertiary">
              维护首页探测内联匹配使用的 Web 指纹规则，支持规则启停、批量导入与 YAML 导出。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Chip variant="flat" className="border border-white/10 bg-white/5 text-apple-text-secondary">
              当前页启用 {activeCount}
            </Chip>
            <Chip variant="flat" className="border border-white/10 bg-white/5 text-apple-text-secondary">
              当前页禁用 {disabledCount}
            </Chip>
          </div>
        </div>

        {notice && (
          <Alert
            color={notice.type}
            variant="flat"
            title={notice.title}
            description={notice.message}
            className="border border-white/10 bg-white/5"
          />
        )}

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto_auto_auto_auto]">
          <Input
            isClearable
            value={keyword}
            placeholder="搜索产品名称或规则内容"
            onValueChange={(value) => {
              setKeyword(value)
              setPage(1)
            }}
            variant="flat"
            startContent={<MagnifyingGlassIcon className="h-5 w-5 text-apple-text-tertiary" />}
            classNames={{
              inputWrapper: 'h-14 rounded-[20px] border border-white/5 bg-apple-tertiary-bg/10 backdrop-blur-md transition-colors hover:bg-apple-tertiary-bg/20',
              input: 'text-base font-medium placeholder:text-apple-text-tertiary',
            }}
          />
          <Select
            aria-label="规则状态筛选"
            selectedKeys={[statusFilter]}
            onChange={(event) => {
              const value = event.target.value as FilterStatus
              setStatusFilter(value || 'all')
              setPage(1)
            }}
            variant="flat"
            classNames={{
              trigger: 'h-14 rounded-[20px] border border-white/5 bg-apple-tertiary-bg/10 backdrop-blur-md transition-colors hover:bg-apple-tertiary-bg/20',
              value: 'text-apple-text-primary',
            }}
          >
            <SelectItem key="all">全部状态</SelectItem>
            <SelectItem key="1">启用</SelectItem>
            <SelectItem key="0">禁用</SelectItem>
          </Select>
          <Button
            variant="flat"
            startContent={<ArrowPathIcon className="h-5 w-5" />}
            className="h-14 rounded-[20px] border border-white/5 bg-apple-tertiary-bg/10 px-5 font-bold text-apple-text-secondary backdrop-blur-md"
            isLoading={rulesQuery.isFetching}
            onPress={() => rulesQuery.refetch()}
          >
            刷新
          </Button>
          <Button
            color="primary"
            startContent={<PlusIcon className="h-5 w-5" />}
            className="h-14 rounded-[20px] px-5 font-bold"
            onPress={handleOpenCreate}
          >
            新增规则
          </Button>
          <Button
            variant="flat"
            startContent={<ArrowUpTrayIcon className="h-5 w-5" />}
            className="h-14 rounded-[20px] border border-white/5 bg-apple-tertiary-bg/10 px-5 font-bold text-apple-text-secondary backdrop-blur-md"
            onPress={() => setImportOpen(true)}
          >
            导入 YAML
          </Button>
          <Button
            variant="flat"
            startContent={<ArrowDownTrayIcon className="h-5 w-5" />}
            className="h-14 rounded-[20px] border border-white/5 bg-apple-tertiary-bg/10 px-5 font-bold text-apple-text-secondary backdrop-blur-md"
            isLoading={exportMutation.isPending}
            onPress={() => exportMutation.mutate()}
          >
            导出 YAML
          </Button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl">
        <Table
          aria-label="Fingerprint rules table"
          removeWrapper
          layout="fixed"
          classNames={{
            ...APPLE_TABLE_CLASSES,
            base: 'min-w-[1100px] p-4',
            tr: `${APPLE_TABLE_CLASSES.tr} cursor-default`,
          }}
        >
          <TableHeader>
            <TableColumn width={220}>产品名称</TableColumn>
            <TableColumn width={520}>规则内容</TableColumn>
            <TableColumn width={120}>状态</TableColumn>
            <TableColumn width={220}>更新时间</TableColumn>
            <TableColumn width={220} align="end">操作</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={<div className="flex h-40 items-center justify-center font-bold text-apple-text-tertiary">当前暂无指纹规则。</div>}
            isLoading={rulesQuery.isPending}
            loadingContent={<Skeleton className="h-40 w-full rounded-xl bg-white/5" />}
          >
            {items.map((item) => {
              const status = statusMeta(item.status)
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-white">{item.product_name || '-'}</span>
                      <span className="font-mono text-[11px] text-apple-text-tertiary">ID #{item.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      content={<div className="max-w-[560px] whitespace-pre-wrap break-all text-xs">{item.rule_content || '-'}</div>}
                      classNames={{ content: 'border border-white/10 bg-apple-bg/95 px-3 py-2 text-white' }}
                    >
                      <span className="block font-mono text-[12px] text-apple-text-secondary">{truncateText(item.rule_content, 96)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${status.className}`}>
                      {status.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-[12px] text-apple-text-secondary">{formatDateTime(item.updated_at)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="bordered"
                        startContent={<PencilSquareIcon className="h-4 w-4" />}
                        className="rounded-full border-white/10 font-bold text-apple-text-secondary hover:border-white/30 hover:text-white"
                        onPress={() => handleOpenEdit(item)}
                      >
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="bordered"
                        startContent={<PowerIcon className="h-4 w-4" />}
                        className="rounded-full border-white/10 font-bold text-apple-text-secondary hover:border-white/30 hover:text-white"
                        onPress={() => setToggleTarget(item)}
                      >
                        {item.status === 1 ? '停用' : '启用'}
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="bordered"
                        startContent={<TrashIcon className="h-4 w-4" />}
                        className="rounded-full border-apple-red/20 font-bold text-apple-red-light"
                        onPress={() => setDeleteTarget(item)}
                      >
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {total > 0 && (
          <TablePaginationFooter
            summary={(
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-apple-text-tertiary">
                指纹规则总数 <span className="text-white">{total}</span>
              </p>
            )}
            page={page}
            total={total}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPage(1)
              setPageSize(nextPageSize)
            }}
          />
        )}
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onOpenChange={(open) => !open && handleCloseDrawer()}
        placement="right"
        backdrop="blur"
        classNames={{
          base: 'max-w-[720px] border-l border-white/10 bg-apple-bg/92 text-apple-text-primary backdrop-blur-3xl',
          header: 'border-b border-white/6 px-8 py-6',
          body: 'px-8 py-6',
          footer: 'border-t border-white/6 px-8 py-5',
        }}
      >
        <DrawerContent>
          <>
            <DrawerHeader className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-apple-blue-light">
                Web Fingerprints
              </span>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  {drawerMode === 'edit' ? '编辑指纹规则' : '新增指纹规则'}
                </h2>
                <p className="mt-1 text-sm text-apple-text-tertiary">
                  规则内容保持 Chujiu 风格表达式，保存后会直接参与首页探测内联匹配。
                </p>
              </div>
            </DrawerHeader>
            <DrawerBody className="flex flex-col gap-5 overflow-y-auto">
              <Input
                label="产品名称"
                value={draft.product_name}
                onValueChange={(value) => setDraft((current) => ({ ...current, product_name: value }))}
                placeholder="例如 Nginx / Jenkins / Spring Boot Admin"
                classNames={{
                  inputWrapper: 'min-h-14 rounded-2xl border border-white/10 bg-white/5',
                  input: 'text-white',
                  label: 'text-apple-text-secondary',
                }}
              />
              <Textarea
                label="规则内容"
                value={draft.rule_content}
                onValueChange={(value) => setDraft((current) => ({ ...current, rule_content: value }))}
                placeholder={`例如:\nheader="Server: nginx" || body="/jenkins/login"`}
                minRows={12}
                classNames={{
                  inputWrapper: 'rounded-2xl border border-white/10 bg-white/5 font-mono text-sm',
                  input: 'text-white',
                  label: 'text-apple-text-secondary',
                }}
              />
              <Select
                label="规则状态"
                selectedKeys={[draft.status]}
                onChange={(event) => setDraft((current) => ({ ...current, status: (event.target.value as FilterStatus) || '1' }))}
                classNames={{
                  trigger: 'min-h-14 rounded-2xl border border-white/10 bg-white/5',
                  value: 'text-white',
                  label: 'text-apple-text-secondary',
                }}
              >
                <SelectItem key="1">启用</SelectItem>
                <SelectItem key="0">禁用</SelectItem>
              </Select>
            </DrawerBody>
            <DrawerFooter>
              <Button
                variant="flat"
                className="rounded-2xl bg-white/5 px-6 font-bold text-apple-text-secondary"
                onPress={handleCloseDrawer}
              >
                取消
              </Button>
              <Button
                color="primary"
                className="rounded-2xl px-8 font-black"
                isLoading={createMutation.isPending || updateMutation.isPending}
                onPress={handleSubmit}
              >
                {drawerMode === 'edit' ? '保存修改' : '创建规则'}
              </Button>
            </DrawerFooter>
          </>
        </DrawerContent>
      </Drawer>

      <Modal
        isOpen={importOpen}
        onOpenChange={(open) => !open && setImportOpen(false)}
        placement="center"
        backdrop="blur"
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          base: 'rounded-[32px] border border-white/10 bg-apple-bg/90 text-apple-text-primary backdrop-blur-3xl',
          header: 'border-b border-white/5 p-8',
          body: 'p-8',
          footer: 'border-t border-white/5 p-6',
        }}
      >
        <ModalContent>
          <>
            <ModalHeader className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-apple-blue-light">YAML Import</span>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">导入指纹规则</h2>
                <p className="mt-1 text-sm text-apple-text-tertiary">
                  直接粘贴 YAML 文本内容；导入失败时会保留当前内容，便于调整后重试。
                </p>
              </div>
            </ModalHeader>
            <ModalBody>
              <Textarea
                value={importContent}
                onValueChange={setImportContent}
                minRows={16}
                placeholder={'- product_name: nginx\n  rule_content: header="Server: nginx"\n  status: 1'}
                classNames={{
                  inputWrapper: 'rounded-[24px] border border-white/10 bg-white/5 font-mono text-sm',
                  input: 'text-white',
                }}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                variant="flat"
                className="rounded-2xl bg-white/5 px-6 font-bold text-apple-text-secondary"
                onPress={() => setImportOpen(false)}
              >
                取消
              </Button>
              <Button
                color="primary"
                className="rounded-2xl px-8 font-black"
                isLoading={importMutation.isPending}
                onPress={handleImport}
              >
                立即导入
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="删除指纹规则"
        message={deleteTarget ? `确认删除规则「${deleteTarget.product_name}」吗？删除后将不再参与后续首页探测匹配。` : '确认删除该规则吗？'}
        confirmText="确认删除"
        confirmColor="danger"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmModal
        isOpen={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={toggleTarget?.status === 1 ? '停用指纹规则' : '启用指纹规则'}
        message={toggleTarget ? `${toggleTarget.status === 1 ? '停用' : '启用'}规则「${toggleTarget.product_name}」后，新的首页探测结果将${toggleTarget.status === 1 ? '不再' : '重新'}参与该规则匹配。` : '确认修改规则状态吗？'}
        confirmText={toggleTarget?.status === 1 ? '确认停用' : '确认启用'}
        confirmColor={toggleTarget?.status === 1 ? 'warning' : 'primary'}
        isLoading={updateMutation.isPending}
      />
    </div>
  )
}
