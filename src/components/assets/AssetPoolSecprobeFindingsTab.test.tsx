import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { useAssetPoolSecprobeFindings } from '@/api/adapters/asset'
import { AppProviders } from '@/app/providers'
import { AssetPoolSecprobeFindingsTab } from '@/components/assets/AssetPoolSecprobeFindingsTab'
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
    useAssetPoolSecprobeFindings: vi.fn(),
  }
})

function renderTab() {
  render(
    <MemoryRouter>
      <AppProviders>
        <AssetPoolSecprobeFindingsTab poolId="pool-1" />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('AssetPoolSecprobeFindingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigateMock.mockReset()
    useAuthStore.setState({
      token: '',
      hydrating: false,
      currentUser: null,
    })

    vi.mocked(useAssetPoolSecprobeFindings).mockReturnValue({
      data: {
        data: [{
          id: 'spf-asset-1',
          task_unit_id: 'unit-asset-1',
          task_id: 'task-secprobe-1',
          task_name: 'RDP 命中',
          asset_pool_id: 'pool-1',
          asset_pool_name: '核心资产池',
          finding_key: '198.51.100.8:3389:rdp:administrator',
          target_host: 'rdp-1',
          resolved_ip: '198.51.100.8',
          source_asset_kind: 'host',
          source_asset_key: 'host-rdp-1',
          port: 3389,
          service: 'rdp',
          probe_kind: 'credential',
          finding_type: 'credential-valid',
          success: true,
          username: 'administrator',
          password: 'P@ssw0rd',
          evidence: 'RDP credential accepted',
          error: '',
          enrichment: {},
          raw: {},
          matched_at: '2026-04-28T08:00:00Z',
          updated_at: '2026-04-28T08:00:00Z',
        }],
        pagination: { page: 1, page_size: 20, total: 1 },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
  })

  it('renders asset pool secprobe rows with source task and evidence', async () => {
    renderTab()

    expect(await screen.findByText('rdp-1 · 198.51.100.8')).toBeInTheDocument()
    expect(screen.getByText('rdp · :3389')).toBeInTheDocument()
    expect(screen.getByText('administrator')).toBeInTheDocument()
    expect(screen.getByText('RDP 命中 · task-secprobe-1')).toBeInTheDocument()
    expect(screen.getByText('RDP credential accepted')).toBeInTheDocument()
  })

  it('navigates to the task secprobe tab from the action button', async () => {
    const user = userEvent.setup()
    renderTab()

    await user.click(await screen.findByRole('button', { name: '查看任务' }))

    expect(navigateMock).toHaveBeenCalledWith('/tasks/task-secprobe-1?tab=secprobe')
  })
})
