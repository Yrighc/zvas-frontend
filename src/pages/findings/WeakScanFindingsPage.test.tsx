import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { useAssetPools } from '@/api/adapters/asset'
import { useWeakScanFindings } from '@/api/adapters/finding'
import { AppProviders } from '@/app/providers'
import { WeakScanFindingsPage } from '@/pages/findings/WeakScanFindingsPage'
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
    useWeakScanFindings: vi.fn(),
  }
})

function renderPage() {
  render(
    <MemoryRouter>
      <AppProviders>
        <WeakScanFindingsPage />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('WeakScanFindingsPage', () => {
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
        data: [{ id: 'pool-1', name: '核心资产池' }],
        pagination: { page: 1, page_size: 100, total: 1 },
      },
    } as never)

    vi.mocked(useWeakScanFindings).mockReturnValue({
      data: {
        data: [{
          id: 'weak-global-1',
          task_unit_id: 'unit-weak-1',
          task_id: 'task-weak-1',
          task_name: 'Web 巡检',
          asset_pool_id: 'pool-1',
          asset_pool_name: '核心资产池',
          target_url: 'https://gw-1.example.com',
          site_asset_id: 'site-1',
          finding_key: 'finding-weak-1',
          remote_scan_id: 'scan-1',
          remote_result_id: 'result-1',
          remote_vulnerability_id: 'remote-weak-1',
          rule_id: 'rule-weak-1',
          rule_name: '登录页泄露',
          severity: 'high',
          status: 'open',
          tags: ['auth'],
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
          matched_at: '2026-04-28T06:00:00Z',
          classification: {},
          evidence: {},
          raw: {},
          updated_at: '2026-04-28T06:00:00Z',
        }],
        pagination: { page: 1, page_size: 20, total: 1 },
      },
      isPending: false,
      refetch: vi.fn(),
    } as never)
  })

  it('renders weak scan summaries with rule identity and asset-pool context', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: '全局弱点扫描结果' })).toBeInTheDocument()
    expect(screen.getByText('登录页泄露 · rule-weak-1')).toBeInTheDocument()
    expect(screen.getByText('Web 巡检 · 核心资产池')).toBeInTheDocument()
    expect(screen.getByText('https://gw-1.example.com/login')).toBeInTheDocument()
  })

  it('navigates to the task weak scan tab when clicking view task', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '查看任务' }))

    expect(navigateMock).toHaveBeenCalledWith('/tasks/task-weak-1?tab=weak_scan')
  })
})
