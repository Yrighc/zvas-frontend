import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { TaskSecprobeResultsTab } from '@/components/tasks/TaskSecprobeResultsTab'
import { useAuthStore } from '@/store/auth'
import { useTaskSecprobeFindings } from '@/api/adapters/task'

vi.mock('@/api/adapters/task', async () => {
  const actual = await vi.importActual<typeof import('@/api/adapters/task')>('@/api/adapters/task')
  return {
    ...actual,
    useTaskSecprobeFindings: vi.fn(),
  }
})

function renderTab() {
  render(
    <MemoryRouter>
      <AppProviders>
        <TaskSecprobeResultsTab taskId="task-secprobe-1" />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('TaskSecprobeResultsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      token: '',
      hydrating: false,
      currentUser: null,
    })

    vi.mocked(useTaskSecprobeFindings).mockReturnValue({
      data: {
        data: [{
          id: 'spf-1',
          task_unit_id: 'unit-1',
          task_id: 'task-secprobe-1',
          task_name: 'Secprobe 任务',
          asset_pool_id: 'pool-1',
          asset_pool_name: '默认资产池',
          finding_key: '192.0.2.10:22:ssh:root',
          target_host: '192.0.2.10',
          resolved_ip: '192.0.2.10',
          source_asset_kind: 'host',
          source_asset_key: 'host-1',
          port: 22,
          service: 'ssh',
          probe_kind: 'credential',
          finding_type: 'credential-valid',
          success: true,
          username: 'root',
          password: 'root',
          evidence: 'ssh root/root login succeeded',
          error: '',
          enrichment: { transport: 'tcp' },
          raw: { service: 'ssh', username: 'root' },
          matched_at: '2026-04-28T10:00:00Z',
          updated_at: '2026-04-28T10:00:00Z',
        }],
        pagination: { page: 1, page_size: 20, total: 1 },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
  })

  it('renders secprobe rows with host service and credential fields', async () => {
    renderTab()

    expect((await screen.findAllByText('192.0.2.10')).length).toBeGreaterThan(0)
    expect(screen.getByText('ssh')).toBeInTheDocument()
    expect(screen.getAllByText('root')).toHaveLength(2)
    expect(screen.getByText('命中')).toBeInTheDocument()
  })

  it('opens the detail drawer with evidence and source asset info', async () => {
    const user = userEvent.setup()
    renderTab()

    await user.click(await screen.findByRole('button', { name: '详情' }))

    expect(await screen.findByText('弱口令结果详情')).toBeInTheDocument()
    expect(screen.getByText('验证证据')).toBeInTheDocument()
    expect(screen.getAllByText('ssh root/root login succeeded').length).toBeGreaterThan(0)
    expect(screen.getByText('host')).toBeInTheDocument()
  })
})
