import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { useAssetPools, useDeleteAssetPool } from '@/api/adapters/asset'
import { AppProviders } from '@/app/providers'
import { AssetPoolsPage } from '@/pages/assets/AssetPoolsPage'
import { useAuthStore } from '@/store/auth'

const navigateMock = vi.fn()
const refetchMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/api/adapters/asset', async () => {
  const actual = await vi.importActual<typeof import('@/api/adapters/asset')>('@/api/adapters/asset')
  return {
    ...actual,
    useAssetPools: vi.fn(),
    useDeleteAssetPool: vi.fn(),
  }
})

function renderPage() {
  render(
    <MemoryRouter>
      <AppProviders>
        <AssetPoolsPage />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('AssetPoolsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigateMock.mockReset()
    useAuthStore.setState({
      token: '',
      hydrating: false,
      currentUser: {
        id: 'user-admin',
        username: 'admin',
        name: 'Admin',
        role: 'admin',
        roles: ['admin'],
        permissions: ['asset:search', 'asset:update', 'asset:import'],
      },
    })

    vi.mocked(useAssetPools).mockReturnValue({
      data: {
        data: [{
          id: 'pool-1',
          name: '核心目标池',
          description: 'desc',
          tags: [],
          asset_count: 6,
          ip_count: 3,
          site_count: 1,
          domain_count: 2,
          task_count: 4,
          finding_count: 7,
          created_at: '2026-04-30T08:00:00Z',
          updated_at: '2026-04-30T09:00:00Z',
          status: 'active',
        }],
        pagination: {
          page: 1,
          page_size: 20,
          total: 1,
        },
      },
      isPending: false,
      isError: false,
      refetch: refetchMock,
    } as never)

    vi.mocked(useDeleteAssetPool).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never)
  })

  it('renders ip site and domain counts in the asset pool list', async () => {
    renderPage()

    expect(await screen.findByRole('columnheader', { name: 'IP' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '站点' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '域名' })).toBeInTheDocument()
    const targetCell = screen.getByText('核心目标池')
    const row = targetCell.closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLTableRowElement).getByText('3')).toBeInTheDocument()
    expect(within(row as HTMLTableRowElement).getByText('1')).toBeInTheDocument()
    expect(within(row as HTMLTableRowElement).getByText('2')).toBeInTheDocument()
  })
})
