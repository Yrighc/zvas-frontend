import { useAuthStore } from '@/store/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearToken()
    window.localStorage.clear()
  })

  it('should save and clear token', () => {
    useAuthStore.getState().setToken('demo-admin')
    expect(useAuthStore.getState().token).toBe('demo-admin')

    useAuthStore.getState().clearToken()
    expect(useAuthStore.getState().token).toBe('')
  })
})
