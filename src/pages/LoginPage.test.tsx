import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { login } from '@/api/adapters/auth'
import { LoginPage } from '@/pages/LoginPage'
import { useAuthStore } from '@/store/auth'

vi.mock('@/api/adapters/auth', () => ({
  login: vi.fn(),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
    window.localStorage.clear()
    vi.mocked(login).mockReset()
  })

  it('should login with username and password', async () => {
    vi.mocked(login).mockResolvedValue({
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      expiresAt: '2026-03-06T16:11:32Z',
      user: {
        id: 'user-admin',
        username: 'admin',
        name: '系统管理员',
        role: 'admin',
        roles: ['admin'],
        permissions: ['user:manage'],
      },
    })

    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.clear(screen.getByLabelText('用户名'))
    await user.type(screen.getByLabelText('用户名'), 'admin')
    await user.clear(screen.getByLabelText('密码'))
    await user.type(screen.getByLabelText('密码'), 'Admin@123456')
    await user.click(screen.getByRole('button', { name: '登录' }))

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('jwt-token')
      expect(useAuthStore.getState().currentUser?.username).toBe('admin')
    })
  })
})
