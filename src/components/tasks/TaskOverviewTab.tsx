function formatDateTime(isoStr?: string) {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleString()
}
import type { TaskDetailVM } from '@/api/adapters/task'

export function TaskOverviewTab({ task }: { task: TaskDetailVM }) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">下发参数与调度核心要素 (Scheduling Metadata)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-sm pt-4">
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">全局唯一识别码</span> <span className="font-mono text-apple-text-secondary">{task.id}</span></div>
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">指令标题</span> <span className="text-white font-bold">{task.name}</span></div>
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">搭载算子模型</span> <span className="text-apple-blue-light font-mono px-2 py-0.5 rounded bg-apple-blue/10 border border-apple-blue/20 text-xs tracking-wider">{task.template_code}</span></div>
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">落点数据源域</span> <span className="text-white hover:text-apple-blue cursor-pointer">{task.asset_pool_name}</span></div>
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">运转水位状态</span> 
              <span className={`inline-flex items-center mt-0.5 gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${
                      task.status === 'running' ? 'border-apple-blue/40 text-apple-blue-light bg-apple-blue/10' :
                      task.status === 'succeeded' ? 'border-apple-green/40 text-apple-green-light bg-apple-green/10' :
                      task.status === 'failed' ? 'border-apple-red/40 text-apple-red bg-apple-red/10' :
                      'border-white/20 text-apple-text-secondary bg-white/5'
                    }`}>
                {task.status || 'DRAFT'}
              </span>
           </div>
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">阶段挂载参数覆盖</span> <span className="text-apple-text-secondary">{Object.keys(task.stage_overrides || {}).length > 0 ? "已自定义传参干预" : "遵循主控中心默认编排"}</span></div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col gap-4 animate-in fade-in duration-500 delay-100 fill-mode-both">
        <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">核心执行参数 (Runtime Configuration)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8 text-sm pt-4">
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">执行器并发数</span> <span className="text-apple-text-secondary font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">{task.params?.concurrency || '-'}</span></div>
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">端口扫描超时</span> <span className="text-apple-text-secondary">{task.params?.timeout_ms ? `${task.params.timeout_ms} ms` : '-'}</span></div>
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">端口配置偏好</span> <span className="text-apple-text-secondary">{task.params?.port_scan_mode || task.params?.port_profile || '-'}</span></div>
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">首页识别探针</span> <span className="text-[12px]">{task.params?.http_probe_enabled ? <span className="text-apple-green-light font-bold">开启 (ON)</span> : <span className="text-apple-text-tertiary">关闭 (OFF)</span>}</span></div>
           {task.params?.http_probe_enabled && task.params?.http_timeout_sec && (
             <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">HTTP 探针超时</span> <span className="text-apple-text-secondary font-mono">{task.params.http_timeout_sec} sec</span></div>
           )}
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col gap-4 animate-in fade-in duration-500 delay-200 fill-mode-both">
        <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">生命周期及底层环境数据包 (Lifecycle Info)</h3>
        <div className="grid grid-cols-2 gap-y-6 text-sm pt-4">
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">诞生时刻</span> <span className="text-apple-text-secondary font-mono">{formatDateTime(task.created_at)}</span></div>
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">首次预热启动</span> <span className="text-apple-text-secondary font-mono">{formatDateTime(task.started_at)}</span></div>
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">最后反馈活动</span> <span className="text-apple-text-secondary font-mono">{formatDateTime(task.updated_at)}</span></div>
           <div><span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-1">收单截止宣告</span> <span className="text-apple-text-secondary font-mono">{formatDateTime(task.finished_at)}</span></div>
           <div className="col-span-2 pt-2">
             <span className="text-[10px] text-apple-text-tertiary uppercase tracking-widest font-black block mb-2">原生环境切片封存 (JSON Data Params)</span>
             <pre className="bg-black/30 p-4 rounded-xl border border-white/5 text-[11px] font-mono text-apple-green drop-shadow-sm overflow-auto max-h-60 relative group">
                <div className="absolute top-2 right-2 px-1 text-[9px] text-white bg-white/10 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">Copy JSON Blob</div>
                {JSON.stringify(task.params, null, 2)}
             </pre>
           </div>
        </div>
      </div>
    </div>
  )
}
