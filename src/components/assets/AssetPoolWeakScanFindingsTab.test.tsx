import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { useAssetPoolWeakScanFindings } from '@/api/adapters/asset'
import { AppProviders } from '@/app/providers'
import { AssetPoolWeakScanFindingsTab } from '@/components/assets/AssetPoolWeakScanFindingsTab'
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
    useAssetPoolWeakScanFindings: vi.fn(),
  }
})

function renderTab() {
  render(
    <MemoryRouter>
      <AppProviders>
        <AssetPoolWeakScanFindingsTab poolId="pool-1" />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('AssetPoolWeakScanFindingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigateMock.mockReset()
    useAuthStore.setState({
      token: '',
      hydrating: false,
      currentUser: null,
    })

    vi.mocked(useAssetPoolWeakScanFindings).mockReturnValue({
      data: {
        data: [{
          id: 'weak-asset-1',
          task_unit_id: 'unit-1',
          task_id: 'task-weak-1',
          task_name: '弱点巡检',
          asset_pool_id: 'pool-1',
          asset_pool_name: '核心资产池',
          target_url: 'https://gw-1.example.com',
          site_asset_id: 'site-1',
          finding_key: 'weak-finding-1',
          remote_scan_id: 'scan-1',
          remote_result_id: 'result-1',
          remote_vulnerability_id: 'remote-1',
          rule_id: 'rule-weak-1',
          rule_name: '登录页泄露',
          severity: 'high',
          status: 'open',
          tags: [],
          affects_url: 'https://gw-1.example.com/login',
          affects_detail: 'detail',
          cvss2: '',
          cvss3: '9.8',
          cvss_score: '9.8',
          description: '存在弱点',
          impact: '风险影响',
          recommendation: '修复建议',
          details: '补充信息',
          request: 'GET /login HTTP/1.1',
          response: 'HTTP/1.1 200 OK',
          source: 'weak_scan',
          matched_at: '2026-04-28T05:00:00Z',
          classification: {},
          evidence: {},
          raw: {},
          updated_at: '2026-04-28T05:00:00Z',
        }],
        pagination: { page: 1, page_size: 20, total: 1 },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
  })

  it('renders the source task summary in the weak scan row', async () => {
    renderTab()

    expect(await screen.findByText('弱点巡检')).toBeInTheDocument()
    expect(screen.getByText('登录页泄露')).toBeInTheDocument()
  })

  it('navigates to the task when clicking the source task summary', async () => {
    const user = userEvent.setup()
    renderTab()

    await user.click(await screen.findByText('弱点巡检'))

    expect(navigateMock).toHaveBeenCalledWith('/tasks/task-weak-1')
  })
})
