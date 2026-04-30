import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { useAssetPoolFindings } from '@/api/adapters/asset'
import { AppProviders } from '@/app/providers'
import { AssetPoolFindingsTab } from '@/components/assets/AssetPoolFindingsTab'
import { useAuthStore } from '@/store/auth'

const navigateMock = vi.fn()

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
    useAssetPoolFindings: vi.fn(),
  }
})

function renderTab() {
  render(
    <MemoryRouter>
      <AppProviders>
        <AssetPoolFindingsTab poolId="pool-1" />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('AssetPoolFindingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigateMock.mockReset()
    useAuthStore.setState({
      token: '',
      hydrating: false,
      currentUser: null,
    })

    vi.mocked(useAssetPoolFindings).mockReturnValue({
      data: {
        data: [{
          finding_id: 'finding-1',
          finding_type: 'nuclei',
          title: '登录页暴露',
          severity: 'high',
          status: 'open',
          asset_pool_id: 'pool-1',
          asset_pool_name: '核心资产池',
          asset_ref: 'https://gw-1.example.com',
          task_id: 'task-find-1',
          task_name: '周界扫描',
          snapshot_id: 'snapshot-1',
          asset_id: 'asset-1',
          rule_id: 'nuclei-login',
          base_url: 'https://gw-1.example.com',
          link: 'https://gw-1.example.com/login',
          target_url: 'https://gw-1.example.com/login',
          host: 'gw-1.example.com',
          ip: '203.0.113.7',
          port: 443,
          scheme: 'https',
          matcher_name: 'login',
          created_at: '2026-04-28T05:00:00Z',
          updated_at: '2026-04-28T05:00:00Z',
          detail: {},
          classification: {},
          evidence: {},
          raw: {},
        }],
        pagination: { page: 1, page_size: 20, total: 1 },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
  })

  it('renders the source task summary in the table row', async () => {
    renderTab()

    expect(await screen.findByText('周界扫描 · task-find-1')).toBeInTheDocument()
    expect(screen.getByText('登录页暴露')).toBeInTheDocument()
  })

  it('navigates to the task when clicking the source task summary', async () => {
    const user = userEvent.setup()
    renderTab()

    await user.click(await screen.findByText('周界扫描 · task-find-1'))

    expect(navigateMock).toHaveBeenCalledWith('/tasks/task-find-1')
  })
})
