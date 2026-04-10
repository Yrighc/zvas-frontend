const TRACE_STORAGE_KEY = 'zvas.console.trace-id'

function createFallbackTraceId() {
  const now = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 12)
  return `trace-${now}-${random}`
}

function generateTraceId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return createFallbackTraceId()
}

/**
 * getOrCreateTraceId 生成或复用单浏览器会话的 trace id。
 */
export function getOrCreateTraceId() {
  const existing = window.sessionStorage.getItem(TRACE_STORAGE_KEY)
  if (existing) {
    return existing
  }

  const traceId = generateTraceId()
  window.sessionStorage.setItem(TRACE_STORAGE_KEY, traceId)
  return traceId
}
