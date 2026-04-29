import { useQuery } from '@tanstack/react-query'

import { httpClient } from '@/api/client'
import type { PaginationMeta } from '@/api/adapters/asset'
import type { ApiEnvelope } from '@/types/http'

export interface FingerprintRuleView {
  id: number
  product_name: string
  rule_content: string
  status: number
  updated_at: string
}

export interface FingerprintRuleListParams {
  page?: number
  page_size?: number
  keyword?: string
  status?: number
}

export interface FingerprintRuleUpsertPayload {
  product_name: string
  rule_content: string
  status: number
}

export interface FingerprintRuleListResponse {
  data: FingerprintRuleView[]
  pagination?: PaginationMeta
}

function mapFingerprintRule(dto: Record<string, unknown>): FingerprintRuleView {
  return {
    id: Number(dto.id || 0),
    product_name: String(dto.product_name || ''),
    rule_content: String(dto.rule_content || ''),
    status: Number(dto.status || 0),
    updated_at: String(dto.updated_at || ''),
  }
}

export function useFingerprintRules(params: FingerprintRuleListParams) {
  return useQuery({
    queryKey: ['/fingerprints', params],
    queryFn: async (): Promise<FingerprintRuleListResponse> => {
      const res = await httpClient.get<ApiEnvelope<Record<string, unknown>[]>>('/fingerprints', { params })
      return {
        data: Array.isArray(res.data.data) ? res.data.data.map(mapFingerprintRule) : [],
        pagination: res.data.pagination as PaginationMeta | undefined,
      }
    },
  })
}

export function useFingerprintRule(id?: number) {
  return useQuery({
    queryKey: ['/fingerprints', id],
    enabled: Boolean(id && id > 0),
    queryFn: async (): Promise<FingerprintRuleView> => {
      const res = await httpClient.get<ApiEnvelope<Record<string, unknown>>>(`/fingerprints/${id}`)
      return mapFingerprintRule(res.data.data || {})
    },
  })
}

export async function createFingerprintRule(payload: FingerprintRuleUpsertPayload): Promise<FingerprintRuleView> {
  const res = await httpClient.post<ApiEnvelope<Record<string, unknown>>>('/fingerprints', payload)
  return mapFingerprintRule(res.data.data || {})
}

export async function updateFingerprintRule(id: number, payload: FingerprintRuleUpsertPayload): Promise<FingerprintRuleView> {
  const res = await httpClient.put<ApiEnvelope<Record<string, unknown>>>(`/fingerprints/${id}`, payload)
  return mapFingerprintRule(res.data.data || {})
}

export async function deleteFingerprintRule(id: number): Promise<void> {
  await httpClient.delete(`/fingerprints/${id}`)
}

export async function importFingerprintRules(content: string): Promise<number> {
  const res = await httpClient.post<ApiEnvelope<{ count?: number }>>('/fingerprints/import', { content })
  return Number(res.data.data?.count || 0)
}

export async function exportFingerprintRulesYAML(): Promise<void> {
  const response = await httpClient.get<Blob>('/fingerprints/export', {
    responseType: 'blob',
  })
  const disposition = String(response.headers['content-disposition'] || '')
  const matched = disposition.match(/filename\*=UTF-8''([^;]+)/i) || disposition.match(/filename="?([^"]+)"?/i)
  const fileName = matched ? decodeURIComponent(matched[1]) : 'fingerprints_export.yaml'
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/x-yaml',
  })
  const href = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(href)
}
