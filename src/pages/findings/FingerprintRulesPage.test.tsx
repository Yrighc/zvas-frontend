import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { FingerprintRulesPage } from '@/pages/findings/FingerprintRulesPage'
import {
  createFingerprintRule,
  deleteFingerprintRule,
  exportFingerprintRulesYAML,
  importFingerprintRules,
  updateFingerprintRule,
  useFingerprintRules,
} from '@/api/adapters/fingerprint'

vi.mock('@/api/adapters/fingerprint', () => ({
  useFingerprintRules: vi.fn(),
  createFingerprintRule: vi.fn(),
  updateFingerprintRule: vi.fn(),
  deleteFingerprintRule: vi.fn(),
  importFingerprintRules: vi.fn(),
  exportFingerprintRulesYAML: vi.fn(),
}))

describe('FingerprintRulesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useFingerprintRules).mockReturnValue({
      data: {
        data: [
          {
            id: 11,
            product_name: 'Nginx',
            rule_content: 'header="Server: nginx"',
            status: 1,
            updated_at: '2026-04-29T02:00:00Z',
          },
          {
            id: 12,
            product_name: 'Jenkins',
            rule_content: 'body="/jenkins/login"',
            status: 0,
            updated_at: '2026-04-29T03:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 2,
        },
      },
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    } as never)

    vi.mocked(createFingerprintRule).mockResolvedValue({
      id: 13,
      product_name: 'Spring Boot Admin',
      rule_content: 'title="Spring Boot Admin"',
      status: 1,
      updated_at: '2026-04-29T04:00:00Z',
    })
    vi.mocked(updateFingerprintRule).mockResolvedValue({
      id: 11,
      product_name: 'Nginx',
      rule_content: 'header="Server: nginx"',
      status: 0,
      updated_at: '2026-04-29T05:00:00Z',
    })
    vi.mocked(deleteFingerprintRule).mockResolvedValue()
    vi.mocked(importFingerprintRules).mockResolvedValue(2)
    vi.mocked(exportFingerprintRulesYAML).mockResolvedValue()
  })

  function renderPage() {
    render(
      <AppProviders>
        <MemoryRouter>
          <FingerprintRulesPage />
        </MemoryRouter>
      </AppProviders>,
    )
  }

  it('renders fingerprint list and opens edit drawer from table actions', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole('heading', { name: '指纹管理' })).toBeInTheDocument()
    expect(screen.getByText('Nginx')).toBeInTheDocument()
    expect(screen.getByText('Jenkins')).toBeInTheDocument()

    const nginxRow = screen.getByText('Nginx').closest('tr')
    expect(nginxRow).not.toBeNull()
    await user.click(within(nginxRow as HTMLTableRowElement).getByRole('button', { name: '编辑' }))

    expect(await screen.findByRole('heading', { name: '编辑指纹规则' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Nginx')).toBeInTheDocument()
    expect(screen.getByDisplayValue('header="Server: nginx"')).toBeInTheDocument()
  })

  it('creates fingerprint rule from drawer form', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '新增规则' }))
    await user.type(screen.getByLabelText('产品名称'), 'Spring Boot Admin')
    await user.type(screen.getByLabelText('规则内容'), 'title="Spring Boot Admin"')
    await user.click(screen.getByRole('button', { name: '创建规则' }))

    await waitFor(() =>
      expect(vi.mocked(createFingerprintRule).mock.calls[0]?.[0]).toEqual({
        product_name: 'Spring Boot Admin',
        rule_content: 'title="Spring Boot Admin"',
        status: 1,
      }),
    )
  })

  it('imports yaml content through modal', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '导入 YAML' }))
    await user.type(screen.getByRole('textbox'), '- product_name: nginx')
    await user.click(screen.getByRole('button', { name: '立即导入' }))

    await waitFor(() => expect(vi.mocked(importFingerprintRules).mock.calls[0]?.[0]).toBe('- product_name: nginx'))
  })
})
