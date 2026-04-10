import { getOrCreateTraceId } from '@/utils/trace'

describe('getOrCreateTraceId', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('should use crypto.randomUUID when available', () => {
    const randomUUID = vi.fn(() => 'uuid-from-crypto')
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: { randomUUID },
    })

    const traceId = getOrCreateTraceId()

    expect(traceId).toBe('uuid-from-crypto')
    expect(randomUUID).toHaveBeenCalledTimes(1)
  })

  it('should fallback when crypto.randomUUID is unavailable', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {},
    })

    const traceId = getOrCreateTraceId()

    expect(traceId).toMatch(/^trace-/)
  })

  it('should reuse trace id in one session', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: { randomUUID: vi.fn(() => 'session-trace-id') },
    })

    const first = getOrCreateTraceId()
    const second = getOrCreateTraceId()

    expect(first).toBeTruthy()
    expect(second).toBe(first)
  })
})
