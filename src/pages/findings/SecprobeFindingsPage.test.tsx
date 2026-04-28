import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { useAssetPools } from '@/api/adapters/asset'
import { useSecprobeFindings } from '@/api/adapters/finding'
import { AppProviders } from '@/app/providers'
import { SecprobeFindingsPage } from '@/pages/findings/SecprobeFindingsPage'
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
    useAssetPools: vi.fn(),
  }
})

vi.mock('@/api/adapters/finding', async () => {
  const actual = await vi.importActual<typeof import('@/api/adapters/finding')>('@/api/adapters/finding')
  return {
    ...actual,
    useSecprobeFindings: vi.fn(),
  }
})

function renderPage() {
  render(
    <MemoryRouter>
      <AppProviders>
        <SecprobeFindingsPage />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('SecprobeFindingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigateMock.mockReset()
    useAuthStore.setState({
      token: '',
      hydrating: false,
      currentUser: null,
    })

    vi.mocked(useAssetPools).mockReturnValue({
      data: {
        data: [{ id: 'pool-1', name: '生产资产池' }],
        pagination: { page: 1, page_size: 100, total: 1 },
      },
    } as never)

    vi.mocked(useSecprobeFindings).mockReturnValue({
      data: {
        data: [{
          id: 'spf-global-1',
          task_unit_id: 'unit-global-1',
          task_id: 'task-global-1',
          task_name: '全网 SSH 弱口令',
          asset_pool_id: 'pool-1',
          asset_pool_name: '生产资产池',
          finding_key: '203.0.113.5:22:ssh:root',
          target_host: '203.0.113.5',
          resolved_ip: '203.0.113.5',
          source_asset_kind: 'host',
          source_asset_key: 'host-global-1',
          port: 22,
          service: 'ssh',
          probe_kind: 'credential',
          finding_type: 'credential-valid',
          success: true,
          username: 'root',
          password: 'toor',
          evidence: 'password accepted',
          error: '',
          enrichment: {},
          raw: {},
          matched_at: '2026-04-28T07:00:00Z',
          updated_at: '2026-04-28T07:00:00Z',
        }],
        pagination: { page: 1, page_size: 20, total: 1 },
      },
      isPending: false,
      refetch: vi.fn(),
    } as never)
  })

  it('renders global secprobe findings with task and asset pool columns', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: '全局弱口令结果' })).toBeInTheDocument()
    expect(screen.getAllByText('203.0.113.5').length).toBeGreaterThan(0)
    expect(screen.getByText('ssh')).toBeInTheDocument()
    expect(screen.getByText('全网 SSH 弱口令')).toBeInTheDocument()
    expect(screen.getAllByText('生产资产池').length).toBeGreaterThan(0)
  })

  it('navigates to the task secprobe tab when clicking view task', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '查看任务' }))

    expect(navigateMock).toHaveBeenCalledWith('/tasks/task-global-1?tab=secprobe')
  })
})
