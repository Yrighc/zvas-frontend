import { getOrCreateTraceId } from '@/utils/trace'

describe('getOrCreateTraceId', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('should reuse trace id in one session', () => {
    const first = getOrCreateTraceId()
    const second = getOrCreateTraceId()

    expect(first).toBeTruthy()
    expect(second).toBe(first)
  })
})
