import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Switch, Chip, Spinner } from '@heroui/react'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RocketLaunchIcon, BeakerIcon } from '@heroicons/react/24/outline'

import { useCreateTask } from '@/api/adapters/task'
import { useTaskTemplates, useTaskTemplateDetail, getPortModeLabel, isHighCostPortTemplate, FULL_PORT_WARNING } from '@/api/adapters/template'

interface Props {
  poolId: string
  poolName?: string
  isOpen: boolean
  onClose: () => void
}

export function CreateTaskFromPoolModal({ poolId, poolName, isOpen, onClose }: Props) {
  const navigate = useNavigate()
  const createTask = useCreateTask()

  const { data: templatesData, isPending: isLoadingTemplates } = useTaskTemplates({ page_size: 100 })
  const templates = useMemo(() => templatesData?.data || [], [templatesData?.data])

  const [taskName, setTaskName] = useState('')
  const [templateCode, setTemplateCode] = useState('')

  useEffect(() => {
    if (!templateCode && templates.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTemplateCode(templates[0].code)
    }
  }, [templateCode, templates])

  const { data: tplDetail, isPending: isLoadingTpl } = useTaskTemplateDetail(templateCode)

  const [portMode, setPortMode] = useState('')
  const [httpProbe, setHttpProbe] = useState(false)
  const [concurrency, setConcurrency] = useState<number | ''>('')
  const [rate, setRate] = useState<number | ''>('')
  const [timeoutMs, setTimeoutMs] = useState<number | ''>('')

  useEffect(() => {
    if (tplDetail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPortMode(tplDetail.default_port_scan_mode)
      setHttpProbe(tplDetail.default_http_probe_enabled)
      setConcurrency(tplDetail.default_concurrency)
      setRate(tplDetail.default_rate)
      setTimeoutMs(tplDetail.default_timeout_ms)
    }
  }, [tplDetail])

  const handleSubmit = () => {
    const name = taskName.trim() || `基于「${poolName || poolId}」的扫描任务`


    const templateOverrides: Record<string, unknown> = {}
    if (tplDetail?.allow_port_mode_override && portMode !== tplDetail.default_port_scan_mode) {
      templateOverrides.port_scan_mode = portMode
    }
    if (tplDetail?.allow_http_probe_override && httpProbe !== tplDetail.default_http_probe_enabled) {
      templateOverrides.http_probe_enabled = httpProbe
    }
    if (tplDetail?.allow_advanced_override && concurrency !== '' && concurrency !== tplDetail.default_concurrency) {
      templateOverrides.concurrency = Number(concurrency)
    }
    if (tplDetail?.allow_advanced_override && rate !== '' && rate !== tplDetail.default_rate) {
      templateOverrides.rate = Number(rate)
    }
    if (tplDetail?.allow_advanced_override && timeoutMs !== '' && timeoutMs !== tplDetail.default_timeout_ms) {
      templateOverrides.timeout_ms = Number(timeoutMs)
    }

    createTask.mutate(
      {
        mode: 'from_pool',
        name,
        template_code: templateCode,
        asset_pool_id: poolId,
        target_set_request: {
          generation_source: 'pool_filter',
        },
        template_overrides: Object.keys(templateOverrides).length > 0 ? templateOverrides : undefined,
      },
      {
        onSuccess: (res) => {
          onClose()
          setTaskName('')
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
      scrollBehavior="inside"
      classNames={{
        base: 'bg-apple-bg/90 backdrop-blur-3xl text-apple-text-primary border border-white/10 rounded-[28px] max-w-2xl shadow-2xl overflow-hidden',
        header: 'border-b border-white/5 p-6',
        body: 'p-6',
        footer: 'border-t border-white/5 p-4 flex justify-end gap-3',
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
            <div className="flex flex-col gap-5">
              {/* Top Row: Task Basics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 focus-within:z-10">
                  <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em] ml-1">
                    任务标题 <span className="text-apple-text-tertiary font-medium">(可选)</span>
                  </label>
                  <Input
                    variant="flat"
                    placeholder={`基于「${poolName || poolId}」的扫描任务`}
                    value={taskName}
                    onValueChange={setTaskName}
                    classNames={{ inputWrapper: 'bg-white/5 border border-white/10 h-10 rounded-xl hover:border-white/20 transition-all' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em] ml-1">
                    搭载执行模板
                  </label>
                  <div className="flex items-center gap-2">
                    <Select
                      variant="flat"
                      aria-label="扫描模板"
                      isLoading={isLoadingTemplates}
                      selectedKeys={templateCode ? [templateCode] : []}
                      onChange={(e) => setTemplateCode(e.target.value)}
                      className="flex-1"
                      classNames={{ trigger: 'bg-white/5 border border-white/10 h-10 pr-10 rounded-xl', value: 'text-sm font-bold truncate pl-1' }}
                      popoverProps={{ classNames: { content: "bg-apple-bg/95 backdrop-blur-3xl border border-white/10 shadow-2xl p-1 min-w-[240px]" } }}
                    >
                      {templates.map((t) => (
                        <SelectItem key={t.code} textValue={t.name}>
                          {t.name} {t.is_builtin ? '(内置)' : ''}
                        </SelectItem>
                      ))}
                    </Select>
                    {isLoadingTpl && <Spinner size="sm" color="white" className="shrink-0" />}
                  </div>
                </div>
              </div>

              {/* Bento Grid for Overrides */}
              {(tplDetail?.allow_port_mode_override || tplDetail?.allow_http_probe_override || tplDetail?.allow_advanced_override) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* 端口扫描模块 */}
                   {tplDetail?.allow_port_mode_override && (
                     <div className="flex flex-col gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden group">
                       <div className="flex items-center justify-between">
                         <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">端口扫描模式 (覆盖)</label>
                         {isHighCostPortTemplate(templateCode) && (
                           <Chip size="sm" variant="dot" color="warning" classNames={{ base: "border-0 p-0 h-4", content: "text-[9px] font-black" }}>RISK</Chip>
                         )}
                       </div>
                       
                       <div className="flex flex-wrap gap-1.5">
                         {['web_common', 'top_100', 'common', 'full', 'custom'].map((mode) => (
                           <Button
                             key={mode}
                             size="sm"
                             variant={portMode === mode ? 'solid' : 'flat'}
                             className={`min-w-0 h-7 px-2.5 text-[11px] font-bold rounded-lg transition-all ${
                               portMode === mode 
                               ? 'bg-apple-blue text-white shadow-lg shadow-apple-blue/20' 
                               : 'bg-white/5 text-apple-text-secondary hover:bg-white/10'
                             }`}
                             onPress={() => setPortMode(mode)}
                           >
                             {getPortModeLabel(mode)}
                           </Button>
                         ))}
                       </div>
                       
                       {portMode === 'full' && (
                         <div className="absolute inset-x-0 bottom-0 py-1 px-3 bg-apple-amber/10 border-t border-apple-amber/20 animate-in slide-in-from-bottom-2 duration-300">
                            <p className="text-[9px] text-apple-amber font-bold leading-tight">⚠ {FULL_PORT_WARNING}</p>
                         </div>
                       )}
                     </div>
                   )}

                   {/* 扫描能力开关 */}
                   {tplDetail?.allow_http_probe_override && (
                     <div className="flex flex-col justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                       <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">业务感知能力 (覆盖)</label>
                       <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                         <span className="text-[12px] text-white font-bold">首页指纹识别</span>
                         <Switch 
                           size="sm" 
                           isSelected={httpProbe} 
                           onValueChange={setHttpProbe} 
                           classNames={{ wrapper: 'group-data-[selected=true]:bg-apple-blue h-5 w-9', thumb: 'w-3 h-3 group-data-[selected=true]:ml-4' }} 
                         />
                       </div>
                       <p className="text-[10px] text-apple-text-tertiary font-medium mt-1">开启 HTTP 协议深度指纹嗅探</p>
                     </div>
                   )}

                   {/* 性能治理模块 */}
                   {tplDetail?.allow_advanced_override && (
                     <div className="flex flex-col gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl md:col-span-2">
                       <label className="text-apple-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">高级性能治理 (Scaling Overrides)</label>
                       <div className="grid grid-cols-3 gap-3">
                         <div className="flex flex-col gap-1">
                           <span className="text-[9px] text-apple-text-tertiary font-bold ml-1">并发实例 (Concurrency)</span>
                           <Input 
                             size="sm" 
                             variant="flat" 
                             value={concurrency.toString()} 
                             onValueChange={(val) => setConcurrency(val ? Number(val) : '')} 
                             classNames={{ inputWrapper: 'bg-white/5 border border-white/10 h-9 rounded-xl px-3' }} 
                           />
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-[9px] text-apple-text-tertiary font-bold ml-1">线程发包速率 (Rate)</span>
                           <Input 
                             size="sm" 
                             variant="flat" 
                             value={rate.toString()} 
                             onValueChange={(val) => setRate(val ? Number(val) : '')} 
                             classNames={{ inputWrapper: 'bg-white/5 border border-white/10 h-9 rounded-xl px-3' }} 
                           />
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-[9px] text-apple-text-tertiary font-bold ml-1">超时容忍 (Timeout ms)</span>
                           <Input 
                             size="sm" 
                             variant="flat" 
                             value={timeoutMs.toString()} 
                             onValueChange={(val) => setTimeoutMs(val ? Number(val) : '')} 
                             classNames={{ inputWrapper: 'bg-white/5 border border-white/10 h-9 rounded-xl px-3' }} 
                           />
                         </div>
                       </div>
                     </div>
                   )}
                </div>
              )}



              {/* Bottom Row: Condensed Execution Summary */}
              <div className="bg-apple-blue/5 border border-apple-blue/10 rounded-2xl p-4 flex flex-col gap-1.5 overflow-hidden">
                 <h2 className="text-[9px] uppercase font-black tracking-[0.2em] text-apple-blue-light flex items-center gap-2">
                   <BeakerIcon className="w-3.5 h-3.5" /> 调度核心预览 (PREVIEW)
                 </h2>
                 {!tplDetail ? (
                   <p className="text-[11px] text-apple-text-tertiary">正在获取模板元数据...</p>
                 ) : (
                   <div className="flex items-center justify-between gap-4">
                     <p className="text-[11px] text-apple-text-secondary leading-tight line-clamp-2 max-w-[70%]">{tplDetail.preview_summary || '无特殊预览说明。'}</p>
                     <div className="flex items-center gap-1.5 shrink-0 bg-white/5 p-1 rounded-lg border border-white/5">
                        <Chip size="sm" variant="flat" classNames={{ base: "bg-transparent border-0 h-4", content: "text-[10px] font-mono font-black border-r border-white/10 pr-2 mr-0.5" }}>{getPortModeLabel(portMode)}</Chip>
                        {httpProbe && <div className="w-1.5 h-1.5 rounded-full bg-apple-green animate-pulse" title="HomePage Probe Mode On" />}
                     </div>
                   </div>
                 )}
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
