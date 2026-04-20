import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { getCurrentUser } from '@/api/adapters/auth'
import { useAuthStore } from '@/store/auth'

vi.mock('@/api/adapters/auth', () => ({
  getCurrentUser: vi.fn(),
}))

describe('AppProviders session bootstrap', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: '',
      currentUser: null,
      hydrating: false,
    })
  })

  it('syncs the current user when a token already exists', async () => {
    useAuthStore.setState({
      token: 'jwt-token',
      currentUser: null,
      hydrating: true,
    })
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-admin',
      username: 'admin',
      name: '系统管理员',
      role: 'admin',
      roles: ['admin'],
      permissions: ['role:read'],
    })

    render(
      <AppProviders>
        <div>app-ready</div>
      </AppProviders>,
    )

    expect(screen.getByText('app-ready')).toBeInTheDocument()

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalledTimes(1)
      expect(useAuthStore.getState().currentUser?.username).toBe('admin')
      expect(useAuthStore.getState().hydrating).toBe(false)
    })
  })
})
