import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { useTaskWeakScanFindings } from '@/api/adapters/task'
import { AppProviders } from '@/app/providers'
import { TaskWeakScanResultsTab } from '@/components/tasks/TaskWeakScanResultsTab'
import { useAuthStore } from '@/store/auth'

vi.mock('@/api/adapters/task', async () => {
  const actual = await vi.importActual<typeof import('@/api/adapters/task')>('@/api/adapters/task')
  return {
    ...actual,
    useTaskWeakScanFindings: vi.fn(),
  }
})

function renderTab() {
  render(
    <MemoryRouter>
      <AppProviders>
        <TaskWeakScanResultsTab taskId="task-weak-1" />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('TaskWeakScanResultsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      token: '',
      hydrating: false,
      currentUser: null,
    })

    vi.mocked(useTaskWeakScanFindings).mockReturnValue({
      data: {
        data: [{
          id: 'weak-1',
          task_unit_id: 'unit-1',
          task_id: 'task-weak-1',
          target_url: 'https://demo.example.com',
          site_asset_id: 'site-1',
          finding_key: 'finding-1',
          remote_scan_id: 'scan-1',
          remote_result_id: 'result-1',
          remote_vulnerability_id: 'remote-1',
          rule_id: 'rule-1',
          rule_name: '弱点规则一',
          severity: 'high',
          status: 'open',
          tags: ['demo'],
          affects_url: 'https://demo.example.com/login',
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
          matched_at: '2026-04-28T10:00:00Z',
          classification: {},
          evidence: {},
          raw: {},
          updated_at: '2026-04-28T10:00:00Z',
        }],
        pagination: { page: 1, page_size: 20, total: 1 },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
  })

  it('renders weak scan summary columns and opens the detail drawer', async () => {
    const user = userEvent.setup()
    renderTab()

    expect(await screen.findByRole('columnheader', { name: '影响地址' })).toBeInTheDocument()
    expect(screen.getByText(/https:\/\/demo\.example\.com\/login/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查看详情' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '查看详情' }))

    expect(await screen.findByText('弱点扫描详情')).toBeInTheDocument()
    expect(screen.getByText('风险影响')).toBeInTheDocument()
  })
})
