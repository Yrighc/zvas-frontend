import { useAuthStore } from '@/store/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
    window.localStorage.clear()
  })

  it('should save and clear session', () => {
    useAuthStore.getState().setSession('jwt-token', {
      id: 'user-admin',
      username: 'admin',
      name: '系统管理员',
      role: 'admin',
      roles: ['admin'],
      permissions: ['user:manage'],
    })

    expect(useAuthStore.getState().token).toBe('jwt-token')
    expect(useAuthStore.getState().currentUser?.username).toBe('admin')

    useAuthStore.getState().clearSession()
    expect(useAuthStore.getState().token).toBe('')
    expect(useAuthStore.getState().currentUser).toBeNull()
  })
})
