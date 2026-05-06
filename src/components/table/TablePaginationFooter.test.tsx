import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import { TablePaginationFooter } from './TablePaginationFooter'

describe('TablePaginationFooter', () => {
  it('renders the shared page-size selector and updates it', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    const onPageSizeChange = vi.fn()

    render(
      <TablePaginationFooter
        summary={<p>共 32 条</p>}
        page={1}
        total={32}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />,
    )

    expect(screen.getByText('共 32 条')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('每页条数'), '50')

    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })
})
