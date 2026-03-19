import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Textarea } from '@heroui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RocketLaunchIcon } from '@heroicons/react/24/outline'

import { useCreateTask } from '@/api/adapters/task'

interface Props {
  poolId: string
  poolName?: string
  isOpen: boolean
  onClose: () => void
}

const TEMPLATE_OPTIONS = [
  { key: 'full_scan', label: '全量扫描（域名扩展 + 端口 + Web 指纹）' },
  { key: 'asset_expand', label: '资产扩展（仅扩展发现子域名/关联 IP）' },
  { key: 'port_scan', label: '端口探测（轻量暴露面测绘）' },
  { key: 'web_identify', label: 'Web 指纹识别' },
  { key: 'vuln_scan', label: '漏洞扫描' },
]

export function CreateTaskFromPoolModal({ poolId, poolName, isOpen, onClose }: Props) {
  const navigate = useNavigate()
  const createTask = useCreateTask()

  const [taskName, setTaskName] = useState('')
  const [templateCode, setTemplateCode] = useState('full_scan')
  // 额外目标（manual_append）：用户可选性输入，用换行分割
  const [manualTargets, setManualTargets] = useState('')

  const handleSubmit = () => {
    const name = taskName.trim() || `基于「${poolName || poolId}」的扫描任务`
    const items = manualTargets.trim()
      ? manualTargets.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      : []

    createTask.mutate(
      {
        mode: 'from_pool',
        name,
        template_code: templateCode,
        asset_pool_id: poolId,
        target_set_request: {
          generation_source: items.length > 0 ? 'pool_filter_plus_manual' : 'pool_filter',
        },
        ...(items.length > 0 ? { manual_append: items } : {}),
      },
      {
        onSuccess: (res) => {
          onClose()
          setTaskName('')
          setManualTargets('')
          navigate(`/tasks/${res.task_id}`)
        },
      },
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      placement="center"
      backdrop="blur"
      classNames={{
        base: 'bg-apple-bg/80 backdrop-blur-3xl text-apple-text-primary border border-white/10 rounded-[32px] max-w-lg shadow-2xl',
        header: 'border-b border-white/5 p-8',
        body: 'p-8',
        footer: 'border-t border-white/5 p-6 bg-white/[0.02] flex justify-end gap-3',
      }}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-[10px] text-apple-blue-light uppercase tracking-[0.3em] font-black">
              基于当前资产池创建任务
            </span>
            <h3 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
              <RocketLaunchIcon className="w-6 h-6" />
              发起扫描任务
            </h3>
            {poolName && (
              <p className="text-[12px] text-apple-text-tertiary font-medium mt-1">
                资产池：{poolName}
              </p>
            )}
          </ModalHeader>

          <ModalBody>
            <div className="flex flex-col gap-6">
              {/* 任务名称 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">
                  任务名称 <span className="text-apple-text-tertiary font-medium">(可选，留空自动生成)</span>
                </label>
                <Input
                  variant="flat"
                  placeholder={`基于「${poolName || poolId}」的扫描任务`}
                  value={taskName}
                  onValueChange={setTaskName}
                  classNames={{ inputWrapper: 'bg-white/5 border border-white/10 h-12 rounded-[16px]' }}
                />
              </div>

              {/* 扫描模板 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">
                  扫描模板
                </label>
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

              {/* 额外目标（可选） */}
              <div className="flex flex-col gap-1.5">
                <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">
                  额外追加目标 <span className="text-apple-text-tertiary font-medium">(可选，换行或逗号分隔)</span>
                </label>
                <Textarea
                  variant="flat"
                  placeholder={'example.com\n192.168.1.0/24'}
                  minRows={3}
                  value={manualTargets}
                  onValueChange={setManualTargets}
                  classNames={{ inputWrapper: 'bg-white/5 border border-white/10 rounded-[16px]' }}
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="flat" onPress={onClose} className="rounded-xl px-6 font-bold text-apple-text-secondary">
              取消
            </Button>
            <Button
              color="primary"
              className="rounded-xl px-10 font-black shadow-lg shadow-apple-blue/20"
              isLoading={createTask.isPending}
              onPress={handleSubmit}
            >
              发起任务
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  )
}
