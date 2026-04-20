import { Chip, Skeleton } from '@heroui/react'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

import { useRoleOptionsView } from '@/api/adapters/user'

export function RolesPage() {
  const rolesQuery = useRoleOptionsView()
  const roles = rolesQuery.data || []
  const permissionCatalog = Array.from(new Set(roles.flatMap((role) => role.permissions))).sort((a, b) => a.localeCompare(b))

  if (rolesQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-8 pb-20">
        <Skeleton className="h-12 w-64 rounded-2xl bg-white/5" />
        <Skeleton className="h-[420px] w-full rounded-[32px] bg-white/5" />
      </div>
    )
  }

  if (rolesQuery.isError) {
    return (
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-8 pb-20">
        <div className="flex items-center justify-center rounded-[32px] border border-white/5 bg-apple-tertiary-bg/10 p-20 backdrop-blur-3xl">
          <div className="flex flex-col items-center gap-4 opacity-80">
            <ShieldCheckIcon className="h-12 w-12 text-apple-red-light" />
            <p className="text-sm font-bold uppercase tracking-widest text-apple-text-tertiary">角色矩阵加载失败</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-10 p-8 pb-20 text-apple-text-primary animate-in fade-in duration-1000">
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="h-8 w-8 text-apple-blue-light" />
          <h1 className="text-3xl font-black tracking-tight text-white">角色与权限矩阵</h1>
        </div>
        <p className="max-w-3xl text-[14px] text-apple-text-secondary">
          当前阶段仅开放只读查看。矩阵数据直接来自角色接口，可用于核对内置角色与有效权限边界是否符合预期。
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {roles.map((role) => (
          <div key={role.code} className="rounded-[28px] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-3xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white">{role.name}</h2>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-apple-text-tertiary">{role.code}</p>
              </div>
              {role.isBuiltin && (
                <Chip size="sm" variant="flat" className="border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-apple-text-secondary">
                  内置
                </Chip>
              )}
            </div>
            <p className="min-h-[40px] text-[13px] leading-relaxed text-apple-text-secondary">{role.description || '暂无描述'}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {role.permissions.map((permission) => (
                <span key={permission} className="rounded-full border border-apple-blue/20 bg-apple-blue/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-apple-blue-light">
                  {permission}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl">
        <div className="border-b border-white/5 px-6 py-5">
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-apple-text-tertiary">Permission Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-apple-text-tertiary">权限码</th>
                {roles.map((role) => (
                  <th key={role.code} className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-apple-text-tertiary">
                    {role.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionCatalog.map((permission) => (
                <tr key={permission} className="border-b border-white/5 last:border-b-0">
                  <td className="px-6 py-4 font-mono text-[12px] font-bold text-white">{permission}</td>
                  {roles.map((role) => (
                    <td key={`${role.code}-${permission}`} className="px-4 py-4 text-center">
                      {role.permissions.includes(permission) ? (
                        <span className="inline-flex rounded-full border border-apple-green/20 bg-apple-green/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-apple-green-light">
                          Allow
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-apple-text-tertiary">
                          Deny
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
