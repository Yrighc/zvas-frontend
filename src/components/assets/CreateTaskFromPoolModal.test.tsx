import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { httpClient } from '@/api/client'
import { CreateTaskFromPoolModal } from '@/components/assets/CreateTaskFromPoolModal'
import { useAuthStore } from '@/store/auth'

function renderModal(isOpen: boolean) {
  return render(
    <MemoryRouter>
      <AppProviders>
        <CreateTaskFromPoolModal
          isOpen={isOpen}
          onClose={vi.fn()}
          poolId="pool-1"
          poolName="核心目标池"
        />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('CreateTaskFromPoolModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      token: '',
      currentUser: null,
      hydrating: false,
    })
  })

  it('does not request task templates until the modal is opened', async () => {
    const getSpy = vi.spyOn(httpClient, 'get').mockImplementation(async (url) => {
      if (url === '/task-templates') {
        return {
          data: {
            data: [{
              code: 'full_scan',
              name: '全量扫描',
              type: 'builtin',
              enabled: true,
              default_port_scan_mode: 'top_100',
              default_http_probe_enabled: true,
              default_stage_plan: ['asset_discovery'],
            }],
            pagination: { page: 1, page_size: 100, total: 1 },
          },
        } as never
      }

      if (url === '/task-templates/full_scan') {
        return {
          data: {
            data: {
              code: 'full_scan',
              name: '全量扫描',
              type: 'builtin',
              enabled: true,
              default_port_scan_mode: 'top_100',
              default_http_probe_enabled: true,
              default_stage_plan: ['asset_discovery'],
              default_concurrency: 10,
              default_rate: 100,
              default_timeout_ms: 5000,
              allow_port_mode_override: true,
              allow_http_probe_override: true,
              allow_advanced_override: true,
              supports_vul_scan: false,
              default_vul_scan_severity: [],
              preview_summary: '',
            },
          },
        } as never
      }

      throw new Error(`unexpected GET ${url}`)
    })

    const view = renderModal(false)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(getSpy).not.toHaveBeenCalled()

    view.rerender(
      <MemoryRouter>
        <AppProviders>
          <CreateTaskFromPoolModal
            isOpen
            onClose={vi.fn()}
            poolId="pool-1"
            poolName="核心目标池"
          />
        </AppProviders>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith('/task-templates', { params: { page_size: 100 } })
      expect(getSpy).toHaveBeenCalledWith('/task-templates/full_scan')
    })
  })
})
