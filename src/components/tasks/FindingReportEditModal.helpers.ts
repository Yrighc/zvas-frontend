import type {
  TaskFindingRuleMapVM,
  TaskRecordVulnerabilityVM,
  UpdateTaskFindingPayload,
} from '@/api/adapters/task'
import {
  normalizeSeverityValue,
} from '@/utils/vulnerability'

export const NO_MAPPING_VALUE = '__none__'

export type FindingEditorState = {
  ruleName: string
  severity: string
  description: string
  remediation: string
}

export const EMPTY_EDITOR_STATE: FindingEditorState = {
  ruleName: '',
  severity: 'info',
  description: '',
  remediation: '',
}

export function formatPayloadValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.length ? value.map((item) => formatPayloadValue(item)).join(', ') : ''

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function firstNonEmptyPayloadText(...values: unknown[]): string {
  for (const value of values) {
    const text = formatPayloadValue(value).trim()
    if (text) {
      return text
    }
  }
  return ''
}

function getRawInfoMap(item: TaskRecordVulnerabilityVM | null): Record<string, unknown> {
  const info = item?.raw?.info
  return info && typeof info === 'object' && !Array.isArray(info) ? info as Record<string, unknown> : {}
}

function getOriginalFindingDescription(item: TaskRecordVulnerabilityVM | null): string {
  const info = getRawInfoMap(item)
  return firstNonEmptyPayloadText(info.description, item?.raw?.description)
}

function getOriginalFindingRemediation(item: TaskRecordVulnerabilityVM | null): string {
  const info = getRawInfoMap(item)
  const reference = Array.isArray(info.reference) ? info.reference.filter(Boolean).join('\n') : info.reference
  return firstNonEmptyPayloadText(info.remediation, info.solution, item?.raw?.remediation, reference)
}

function getOriginalFindingRuleName(item: TaskRecordVulnerabilityVM | null): string {
  const info = getRawInfoMap(item)
  return firstNonEmptyPayloadText(info.name, item?.raw?.rule_name, item?.rule_name)
}

function getOriginalFindingSeverity(item: TaskRecordVulnerabilityVM | null): string {
  const info = getRawInfoMap(item)
  return normalizeSeverityValue(firstNonEmptyPayloadText(info.severity, item?.raw?.severity, item?.severity, 'info')) || 'info'
}

export function buildEditorState(item: TaskRecordVulnerabilityVM | null): FindingEditorState {
  if (!item) {
    return { ...EMPTY_EDITOR_STATE }
  }

  const classification = { ...(item.classification || {}) }
  return {
    ruleName: item.rule_name || '',
    severity: normalizeSeverityValue(item.severity || 'info') || 'info',
    description: formatPayloadValue(classification.description),
    remediation: formatPayloadValue(classification.remediation ?? classification.solution),
  }
}

export function buildMappingPatch(
  selection: string,
  ruleMap?: TaskFindingRuleMapVM,
): UpdateTaskFindingPayload['mapping_patch'] | undefined {
  const currentID = ruleMap?.current?.vul_type_id ? String(ruleMap.current.vul_type_id) : NO_MAPPING_VALUE
  if (selection === currentID) {
    return undefined
  }
  if (selection === NO_MAPPING_VALUE) {
    return currentID === NO_MAPPING_VALUE ? undefined : { clear_mapping: true }
  }

  const vulTypeID = Number(selection)
  if (!Number.isInteger(vulTypeID) || vulTypeID <= 0) {
    return undefined
  }
  return { vul_type_id: vulTypeID }
}

export function buildInitialMappingSelection(ruleMap?: TaskFindingRuleMapVM): string {
  return ruleMap?.current?.vul_type_id ? String(ruleMap.current.vul_type_id) : NO_MAPPING_VALUE
}

export function buildInitialMappingQuery(ruleMap?: TaskFindingRuleMapVM): string {
  const selection = buildInitialMappingSelection(ruleMap)
  if (selection === NO_MAPPING_VALUE) {
    return '无映射'
  }
  return ruleMap?.candidates.find((candidate) => String(candidate.vul_type_id) === selection)?.vul_type || ''
}

export function buildFindingPatchPayload(
  item: TaskRecordVulnerabilityVM,
  formState: FindingEditorState,
  mappingPatch?: UpdateTaskFindingPayload['mapping_patch'],
): NonNullable<UpdateTaskFindingPayload['finding_patch']> {
  const displayedState = buildEditorState(item)
  const shouldRestoreOriginalFields = Boolean(mappingPatch)

  const nextRuleName = shouldRestoreOriginalFields && formState.ruleName.trim() === displayedState.ruleName.trim()
    ? getOriginalFindingRuleName(item)
    : formState.ruleName.trim()
  const nextSeverity = shouldRestoreOriginalFields && normalizeSeverityValue(formState.severity) === displayedState.severity
    ? getOriginalFindingSeverity(item)
    : normalizeSeverityValue(formState.severity)
  const nextDescription = shouldRestoreOriginalFields && formState.description.trim() === displayedState.description.trim()
    ? getOriginalFindingDescription(item)
    : formState.description.trim()
  const nextRemediation = shouldRestoreOriginalFields && formState.remediation.trim() === displayedState.remediation.trim()
    ? getOriginalFindingRemediation(item)
    : formState.remediation.trim()

  const classification = { ...(item.classification || {}) }

  if (nextDescription) {
    classification.description = nextDescription
  } else {
    delete classification.description
  }

  if (nextRemediation) {
    classification.remediation = nextRemediation
  } else {
    delete classification.remediation
  }

  return {
    rule_name: nextRuleName,
    severity: nextSeverity,
    matched_at: item.matched_at || undefined,
    target_url: item.target_url || undefined,
    host: item.host || undefined,
    ip: item.ip || undefined,
    port: typeof item.port === 'number' ? item.port : undefined,
    scheme: item.scheme || undefined,
    matcher_name: item.matcher_name || undefined,
    classification,
    evidence: item.evidence || undefined,
  }
}
