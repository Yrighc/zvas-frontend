import { render, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { httpClient } from '@/api/client'
import { ManualInputModal } from '@/components/assets/ManualInputModal'
import { useAuthStore } from '@/store/auth'

function renderModal(isOpen: boolean) {
  return render(
    <AppProviders>
      <ManualInputModal isOpen={isOpen} onClose={vi.fn()} />
    </AppProviders>,
  )
}

describe('ManualInputModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      token: '',
      currentUser: null,
      hydrating: false,
    })
  })

  it('does not request asset pools until the modal is opened', async () => {
    const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
      data: {
        data: [],
        pagination: { page: 1, page_size: 100, total: 0 },
      },
    } as never)

    const view = renderModal(false)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(getSpy).not.toHaveBeenCalled()

    view.rerender(
      <AppProviders>
        <ManualInputModal isOpen onClose={vi.fn()} />
      </AppProviders>,
    )

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(1)
      expect(getSpy).toHaveBeenCalledWith('/asset-pools', { params: { page_size: 100 } })
    })
  })
})
