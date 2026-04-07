import { Progress, Skeleton } from '@heroui/react'
import type { TaskProgressVM } from '@/api/adapters/task'
import { getActiveGroupLabel, getBlockedReasonLabel, getGroupStateInfo, isTerminalTaskStatus, getAttackRouteLabel } from '@/api/adapters/task'
import { useTaskRoutes, getRouteLabel, getRouteActiveLabel } from '@/api/adapters/route'

function percent(done: number, total: number) {
  if (!total) return 0
  return Math.min(100, Math.round((done / total) * 100))
}

function toDisplayState(state: string, isTerminal: boolean) {
  if (isTerminal && (state === 'active' || state === 'blocked' || state === 'pending')) {
    return 'completed'
  }
  return state
}

export function TaskProgressTab({ progress }: { progress?: TaskProgressVM }) {
  const { data: routes } = useTaskRoutes()

  if (!progress) return <Skeleton className="h-64 rounded-2xl bg-white/5" />

  const finished = (progress.succeeded || 0) + (progress.failed || 0)
  const overall = percent(finished, progress.total_units || 0)
  const isTerminal = isTerminalTaskStatus(progress.task_status || '')
  const activeRouteLabel = progress.active_route_code ? getRouteActiveLabel(routes, progress.active_route_code) : ''

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full mb-8">
      {(progress.route_progress.length > 0 || progress.active_route_code) && (
        <div className={`${isTerminal ? 'bg-white/[0.02] border-white/5' : 'bg-apple-blue/[0.03] border-apple-blue/10'} border p-6 rounded-[24px] backdrop-blur-3xl`}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h3 className={`text-sm font-black ${isTerminal ? 'text-white' : 'text-apple-blue-light'}`}>路由推进</h3>
            {!isTerminal && activeRouteLabel && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-blue/10 border border-apple-blue/20 text-apple-blue-light font-bold">
                {activeRouteLabel}
              </span>
            )}
            {!isTerminal && progress.active_group && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-apple-text-secondary font-bold">
                {getActiveGroupLabel(progress.active_group)}
              </span>
            )}
            {!isTerminal && progress.blocked_reason && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-amber/10 border border-apple-amber/20 text-apple-amber font-bold">
                {getBlockedReasonLabel(progress.blocked_reason)}
              </span>
            )}
          </div>
          {progress.route_progress.length > 0 && (
            <div className="flex items-center gap-0 overflow-x-auto pb-1">
              {progress.route_progress.map((rp, idx) => {
                const displayState = toDisplayState(rp.state, isTerminal)
                const stateInfo = getGroupStateInfo(displayState)
                const routeLabel = getRouteLabel(routes, rp.route_code)
                return (
                  <div key={`${rp.route_code}-${idx}`} className="flex items-center">
                    <div className={`flex flex-col items-center gap-1 px-5 py-3 rounded-xl border min-w-[120px] transition-all ${
                      displayState === 'active' ? 'bg-apple-blue/10 border-apple-blue/30 shadow-md shadow-apple-blue/10' :
                      displayState === 'completed' ? 'bg-apple-green/10 border-apple-green/20' :
                      displayState === 'blocked' ? 'bg-apple-amber/10 border-apple-amber/20' :
                      'bg-white/[0.02] border-white/5'
                    }`}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-apple-text-tertiary">{routeLabel}</span>
                      <span className={`text-[11px] font-bold ${
                        stateInfo.color === 'primary' ? 'text-apple-blue-light' :
                        stateInfo.color === 'success' ? 'text-apple-green-light' :
                        stateInfo.color === 'warning' ? 'text-apple-amber' :
                        'text-apple-text-secondary'
                      }`}>{stateInfo.label}</span>
                      {!isTerminal && rp.route_code === progress.active_route_code && (
                        <span className="text-[9px] text-apple-blue-light font-black">当前路由</span>
                      )}
                    </div>
                    {idx < progress.route_progress.length - 1 && (
                      <div className="w-5 h-[2px] bg-white/10 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {!isTerminal && progress.active_attack_route && progress.active_attack_route !== progress.active_route_code && (
            <div className="mt-3 text-[10px] text-apple-text-tertiary">
              当前攻击路由：<span className="text-apple-text-secondary font-mono">{getAttackRouteLabel(progress.active_attack_route)}</span>
            </div>
          )}
        </div>
      )}

      {progress.group_progress.length > 0 && (
        <div className={`${isTerminal ? 'bg-white/[0.02] border-white/5' : 'bg-white/[0.02] border-white/10'} border p-6 rounded-[24px] backdrop-blur-3xl`}>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm font-black text-white">阶段组概览</h3>
          </div>
          <div className="flex items-center gap-0 overflow-x-auto">
            {progress.group_progress.map((gp, idx) => {
              const displayState = toDisplayState(gp.state, isTerminal)
              const stateInfo = getGroupStateInfo(displayState)
              return (
                <div key={gp.group_code} className="flex items-center">
                  <div className={`flex flex-col items-center gap-1 px-5 py-3 rounded-xl border min-w-[100px] transition-all ${
                    displayState === 'active' ? 'bg-apple-blue/10 border-apple-blue/30 shadow-md shadow-apple-blue/10' :
                    displayState === 'completed' ? 'bg-apple-green/10 border-apple-green/20' :
                    displayState === 'blocked' ? 'bg-apple-amber/10 border-apple-amber/20' :
                    'bg-white/[0.02] border-white/5'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-apple-text-tertiary">{gp.group_code}</span>
                    <span className={`text-[11px] font-bold ${
                      stateInfo.color === 'primary' ? 'text-apple-blue-light' :
                      stateInfo.color === 'success' ? 'text-apple-green-light' :
                      stateInfo.color === 'warning' ? 'text-apple-amber' :
                      'text-apple-text-secondary'
                    }`}>{stateInfo.label}</span>
                  </div>
                  {idx < progress.group_progress.length - 1 && (
                    <div className="w-5 h-[2px] bg-white/10 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: '总单元数', value: progress.total_units || 0 },
          { label: '已完成', value: finished },
          { label: '运行中', value: progress.running || 0 },
          { label: '失败', value: progress.failed || 0 },
          { label: '总体进度', value: `${overall}%` },
        ].map((card) => (
          <div key={card.label} className="bg-white/[0.02] border border-white/10 p-5 rounded-[24px] backdrop-blur-3xl">
            <div className="text-[10px] text-apple-text-tertiary uppercase tracking-[0.2em] font-black mb-2">{card.label}</div>
            <div className="text-3xl font-black text-white">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/10 p-6 rounded-[24px] backdrop-blur-3xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-black text-white">总体进度</h3>
          <span className="text-sm font-bold text-apple-text-secondary">{finished} / {progress.total_units || 0}</span>
        </div>
        <Progress value={overall} color={progress.failed > 0 ? 'warning' : 'primary'} classNames={{ track: 'bg-white/5', indicator: progress.failed > 0 ? 'bg-apple-amber' : 'bg-apple-blue', label: 'text-white' }} />
      </div>

      <div className="bg-white/[0.02] border border-white/10 p-6 rounded-[24px] backdrop-blur-3xl flex flex-col gap-5">
        <h3 className="text-lg font-black text-white">阶段进度</h3>
        {(progress.stages || []).map((stage) => {
          const stageDone = (stage.succeeded || 0) + (stage.failed || 0)
          const stageTotal = stage.total_units || 0
          const waitingForSeed = stage.pending && stageTotal === 0
          const stageProgress = percent(stageDone, stageTotal)
          return (
            <div key={stage.stage} className="flex flex-col gap-2 border border-white/5 rounded-2xl px-4 py-4 bg-white/[0.01]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-black text-white">{getRouteLabel(routes, stage.stage)}</div>
                  <div className="text-xs text-apple-text-tertiary">
                    {waitingForSeed ? '等待前一路由完成后播种' : `完成 ${stageDone} / ${stageTotal}`}
                  </div>
                </div>
                <div className="text-xs text-apple-text-secondary text-right">
                  <div>运行中 {stage.running || 0}</div>
                  <div>失败 {stage.failed || 0}</div>
                </div>
              </div>
              <Progress value={waitingForSeed ? 0 : stageProgress} color={stage.failed > 0 ? 'warning' : 'success'} classNames={{ track: 'bg-white/5', indicator: stage.failed > 0 ? 'bg-apple-amber' : 'bg-apple-green' }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
