import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { LoginPage } from '@/pages/LoginPage'
import { useAuthStore } from '@/store/auth'

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearToken()
    window.localStorage.clear()
  })

  it('should allow selecting a demo token preset', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: '使用 demo-admin' }))

    expect(useAuthStore.getState().token).toBe('demo-admin')
  })
})
