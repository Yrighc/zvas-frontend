/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query'
import { httpClient } from '@/api/client'
import type { PaginationMeta } from './asset'

export interface TaskTemplateListItemVM {
  code: string
  name: string
  description: string
  is_builtin: boolean
  is_enabled: boolean
  default_port_scan_mode: string
  default_http_probe_enabled: boolean
  default_concurrency: number
  default_timeout_minutes: number
  preview_summary: string
  created_at: string
  updated_at: string
}

export interface TaskTemplateDetailVM extends TaskTemplateListItemVM {
  default_custom_ports: string
  allow_port_mode_override: boolean
  allow_http_probe_override: boolean
  allow_advanced_override: boolean
  default_stage_plan: string[]
  allowed_stages: string[]
}

function mapToTaskTemplateListItemVM(dto: any): TaskTemplateListItemVM {
  return {
    code: dto.code || '',
    name: dto.name || '',
    description: dto.description || '',
    is_builtin: Boolean(dto.builtin),
    is_enabled: Boolean(dto.enabled),
    default_port_scan_mode: dto.default_port_scan_mode || 'top_100',
    default_http_probe_enabled: Boolean(dto.default_http_probe_enabled),
    default_concurrency: dto.default_concurrency ?? 0,
    default_timeout_minutes: dto.default_timeout_ms ? Math.floor(dto.default_timeout_ms / 60000) : 0,
    preview_summary: Array.isArray(dto.preview_summary) ? dto.preview_summary.join('\n') : (dto.preview_summary || ''),
    created_at: dto.created_at || '',
    updated_at: dto.updated_at || dto.created_at || '',
  }
}

function mapToTaskTemplateDetailVM(dto: any): TaskTemplateDetailVM {
  return {
    ...mapToTaskTemplateListItemVM(dto),
    default_custom_ports: dto.default_ports || '',
    allow_port_mode_override: Boolean(dto.allow_port_mode_override),
    allow_http_probe_override: Boolean(dto.allow_http_probe_override),
    allow_advanced_override: Boolean(dto.allow_advanced_override),
    default_stage_plan: dto.default_stages || [],
    allowed_stages: dto.optional_stages || [],
  }
}

export function useTaskTemplates(params?: { keyword?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['task-templates', params],
    queryFn: async () => {
      const cleanParams = params 
        ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
        : undefined
      const res = await httpClient.get<{ data: any[]; pagination?: PaginationMeta }>('/task-templates', { params: cleanParams })
      return {
        ...res.data,
        data: (res.data.data || []).map(mapToTaskTemplateListItemVM),
      }
    },
  })
}

export function useTaskTemplateDetail(code?: string) {
  return useQuery({
    queryKey: ['task-templates', code],
    queryFn: async (): Promise<TaskTemplateDetailVM> => {
      const res = await httpClient.get<{ data: any }>(`/task-templates/${code}`)
      return mapToTaskTemplateDetailVM(res.data.data)
    },
    enabled: Boolean(code),
  })
}
