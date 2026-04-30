import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { getCurrentUser } from '@/api/adapters/auth'
import { useAssetPools } from '@/api/adapters/asset'
import { httpClient } from '@/api/client'
import { useAuthStore } from '@/store/auth'

vi.mock('@/api/adapters/auth', () => ({
  getCurrentUser: vi.fn(),
}))

function AssetPoolsProbe() {
  const query = useAssetPools({ page: 1, page_size: 20 })
  return <div>{query.data ? 'asset-pools-ready' : 'asset-pools-loading'}</div>
}

describe('AppProviders session bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      token: '',
      currentUser: null,
      hydrating: false,
    })
  })

  it('syncs the current user only once under StrictMode when a token already exists', async () => {
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
      <StrictMode>
        <AppProviders>
          <div>app-ready</div>
        </AppProviders>
      </StrictMode>,
    )

    expect(screen.getByText('app-ready')).toBeInTheDocument()

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalledTimes(1)
      expect(useAuthStore.getState().currentUser?.username).toBe('admin')
      expect(useAuthStore.getState().hydrating).toBe(false)
    })
  })

  it('reuses the asset pools query under StrictMode without issuing a second request', async () => {
    const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
      data: {
        data: [],
        pagination: { page: 1, page_size: 20, total: 0 },
      },
    } as never)

    render(
      <StrictMode>
        <AppProviders>
          <AssetPoolsProbe />
        </AppProviders>
      </StrictMode>,
    )

    expect(await screen.findByText('asset-pools-ready')).toBeInTheDocument()

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(1)
    })
  })
})
