import { Button, Input, Select, SelectItem, Textarea, RadioGroup, Radio } from '@heroui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircleIcon, FolderOpenIcon } from '@heroicons/react/24/outline'

import { useCreateTask } from '@/api/adapters/task'
import { useAssetPools } from '@/api/adapters/asset'

const TEMPLATE_OPTIONS = [
  { key: 'full_scan', label: '全量扫描（域名扩展 + 端口 + Web 指纹）' },
  { key: 'asset_expand', label: '资产扩展（发现子域名 / 关联 IP）' },
  { key: 'port_scan', label: '端口探测（轻量暴露面测绘）' },
  { key: 'web_identify', label: 'Web 指纹识别' },
  { key: 'vuln_scan', label: '漏洞扫描' },
]

/** 模式 A：归并到已有资产池；模式 B：创建新资产池并启动 */
type AdHocMode = 'existing' | 'create'

export function TaskNewPage() {
  const navigate = useNavigate()
  const createTask = useCreateTask()
  const poolsQuery = useAssetPools({ page: 1, page_size: 100 })
  const poolItems = poolsQuery.data?.data || []

  // ── 公共字段 ──────────────────────────────────────────────────
  const [taskName, setTaskName] = useState('')
  const [templateCode, setTemplateCode] = useState('full_scan')
  const [targets, setTargets] = useState('')
  const [adHocMode, setAdHocMode] = useState<AdHocMode>('existing')

  // ── 模式 A：归并到已有资产池 ──────────────────────────────────
  const [existingPoolId, setExistingPoolId] = useState('')

  // ── 模式 B：创建新资产池 ──────────────────────────────────────
  const [newPoolName, setNewPoolName] = useState('')
  const [newPoolDesc, setNewPoolDesc] = useState('')
  const [newPoolTags, setNewPoolTags] = useState('')

  const isValid = () => {
    if (!taskName.trim()) return false
    if (!targets.trim()) return false
    if (adHocMode === 'existing' && !existingPoolId) return false
    if (adHocMode === 'create' && !newPoolName.trim()) return false
    return true
  }

  const handleSubmit = () => {
    const items = targets.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    const tags = newPoolTags
      .split(/[\n,，]+/)
      .map((s) => s.trim())
      .filter(Boolean)

    createTask.mutate(
      {
        mode: 'ad_hoc',
        name: taskName.trim(),
        template_code: templateCode,
        asset_pool:
          adHocMode === 'existing'
            ? { mode: 'existing', asset_pool_id: existingPoolId }
            : { mode: 'create', name: newPoolName.trim(), description: newPoolDesc.trim() || undefined, tags: tags.length > 0 ? tags : undefined },
        input: { source: 'manual', items },
      },
      {
        onSuccess: (res) => {
          navigate(`/tasks/${res.task_id}`)
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-8 w-full text-apple-text-primary animate-in fade-in duration-1000 max-w-[860px] mx-auto pb-20 p-4 md:p-8">

      {/* ─── 模式选择 ── */}
      <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[28px] p-6">
        <p className="text-[10px] text-apple-text-tertiary uppercase tracking-[0.2em] font-black mb-4">任务来源</p>
        <RadioGroup
          value={adHocMode}
          onValueChange={(v) => setAdHocMode(v as AdHocMode)}
          classNames={{ wrapper: 'gap-4' }}
        >
          <div
            onClick={() => setAdHocMode('existing')}
            className={`flex items-start gap-4 cursor-pointer p-4 rounded-[20px] border transition-all ${
              adHocMode === 'existing'
                ? 'border-apple-blue/40 bg-apple-blue/5'
                : 'border-white/5 hover:border-white/15 bg-white/[0.02]'
            }`}
          >
            <FolderOpenIcon className={`w-7 h-7 mt-0.5 flex-shrink-0 ${adHocMode === 'existing' ? 'text-apple-blue-light' : 'text-apple-text-tertiary'}`} />
            <div>
              <div className="text-[14px] font-black text-white mb-0.5">归并到已有资产池</div>
              <div className="text-[12px] text-apple-text-tertiary font-medium">本次扫描目标将作为临时任务关联到已有资产池，发现的资产会归并进该池。</div>
            </div>
            <Radio value="existing" className="ml-auto" />
          </div>
          <div
            onClick={() => setAdHocMode('create')}
            className={`flex items-start gap-4 cursor-pointer p-4 rounded-[20px] border transition-all ${
              adHocMode === 'create'
                ? 'border-apple-blue/40 bg-apple-blue/5'
                : 'border-white/5 hover:border-white/15 bg-white/[0.02]'
            }`}
          >
            <PlusCircleIcon className={`w-7 h-7 mt-0.5 flex-shrink-0 ${adHocMode === 'create' ? 'text-apple-blue-light' : 'text-apple-text-tertiary'}`} />
            <div>
              <div className="text-[14px] font-black text-white mb-0.5">同时创建新资产池</div>
              <div className="text-[12px] text-apple-text-tertiary font-medium">系统将自动建立一个新资产池，并将本次扫描目标及发现资产归入其中。</div>
            </div>
            <Radio value="create" className="ml-auto" />
          </div>
        </RadioGroup>
      </div>

      {/* ─── 任务基础字段 ── */}
      <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[28px] p-6 flex flex-col gap-5">
        <p className="text-[10px] text-apple-text-tertiary uppercase tracking-[0.2em] font-black mb-1">任务配置</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">任务名称</label>
          <Input
            variant="flat"
            placeholder="为本次扫描任务起个名字"
            value={taskName}
            onValueChange={setTaskName}
            classNames={{ inputWrapper: 'bg-white/5 border border-white/10 h-12 rounded-[16px]' }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">扫描模板</label>
          <Select
            variant="flat"
            aria-label="扫描模板"
            selectedKeys={[templateCode]}
            onChange={(e) => setTemplateCode(e.target.value)}
            classNames={{ trigger: 'bg-white/5 border border-white/10 h-12 pr-10 rounded-[16px]', value: 'truncate' }}
          >
            {TEMPLATE_OPTIONS.map((t) => (
              <SelectItem key={t.key} textValue={t.label}>
                {t.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* ─── 模式 A：选择已有资产池 ── */}
      {adHocMode === 'existing' && (
        <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[28px] p-6 flex flex-col gap-5 animate-in fade-in duration-300">
          <p className="text-[10px] text-apple-text-tertiary uppercase tracking-[0.2em] font-black mb-1">归并到哪个资产池</p>
          <Select
            variant="flat"
            aria-label="选择资产池"
            placeholder="请选择一个资产池"
            selectedKeys={existingPoolId ? [existingPoolId] : []}
            onChange={(e) => setExistingPoolId(e.target.value)}
            classNames={{ trigger: 'bg-white/5 border border-white/10 h-12 pr-10 rounded-[16px]', value: 'truncate' }}
          >
            {poolItems.map((p) => (
              <SelectItem key={p.id} textValue={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      )}

      {/* ─── 模式 B：创建新资产池配置 ── */}
      {adHocMode === 'create' && (
        <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[28px] p-6 flex flex-col gap-5 animate-in fade-in duration-300">
          <p className="text-[10px] text-apple-text-tertiary uppercase tracking-[0.2em] font-black mb-1">新资产池信息</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">资产池名称</label>
            <Input
              variant="flat"
              placeholder="如：2024-Q1 某单位外网"
              value={newPoolName}
              onValueChange={setNewPoolName}
              classNames={{ inputWrapper: 'bg-white/5 border border-white/10 h-12 rounded-[16px]' }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">描述 <span className="text-apple-text-tertiary font-medium">(可选)</span></label>
            <Input
              variant="flat"
              placeholder="一句话说明资产池用途"
              value={newPoolDesc}
              onValueChange={setNewPoolDesc}
              classNames={{ inputWrapper: 'bg-white/5 border border-white/10 h-12 rounded-[16px]' }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">标签 <span className="text-apple-text-tertiary font-medium">(可选，逗号分隔)</span></label>
            <Input
              variant="flat"
              placeholder="external, temp, 2024"
              value={newPoolTags}
              onValueChange={setNewPoolTags}
              classNames={{ inputWrapper: 'bg-white/5 border border-white/10 h-12 rounded-[16px]' }}
            />
          </div>
        </div>
      )}

      {/* ─── 本次扫描目标 ── */}
      <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[28px] p-6 flex flex-col gap-5">
        <p className="text-[10px] text-apple-text-tertiary uppercase tracking-[0.2em] font-black mb-1">本次扫描目标</p>
        <p className="text-[12px] text-apple-text-tertiary">
          每行一个目标，支持 IP / CIDR / 域名 / URL，也可以用逗号分隔。
        </p>
        <Textarea
          variant="flat"
          placeholder={'example.com\n192.0.2.0/24\nhttps://demo.site.com'}
          minRows={5}
          value={targets}
          onValueChange={setTargets}
          classNames={{ inputWrapper: 'bg-white/5 border border-white/10 rounded-[16px]' }}
        />
      </div>

      {/* ─── 提交区 ── */}
      <div className="flex justify-end gap-4">
        <Button
          variant="flat"
          className="h-14 rounded-2xl px-8 font-bold text-apple-text-secondary border border-white/5"
          onPress={() => navigate(-1)}
        >
          取消
        </Button>
        <Button
          color="primary"
          className="h-14 rounded-2xl px-12 font-black shadow-2xl shadow-apple-blue/20"
          isLoading={createTask.isPending}
          isDisabled={!isValid()}
          onPress={handleSubmit}
        >
          发起扫描任务
        </Button>
      </div>
    </div>
  )
}
