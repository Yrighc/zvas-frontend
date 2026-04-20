import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { RequirePermissions } from '@/router/guards'
import { useAuthStore } from '@/store/auth'
import { PERMISSIONS } from '@/utils/permissions'

describe('RequirePermissions', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: '',
      currentUser: null,
      hydrating: false,
    })
  })

  it('redirects to login when the token is missing', () => {
    render(
      <MemoryRouter initialEntries={['/iam/roles']}>
        <Routes>
          <Route
            path="/iam/roles"
            element={
              <RequirePermissions requiredPermissions={[PERMISSIONS.roleRead]}>
                <div>roles-page</div>
              </RequirePermissions>
            }
          />
          <Route path="/login" element={<div>login-page</div>} />
          <Route path="/403" element={<div>forbidden-page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('login-page')).toBeInTheDocument()
  })

  it('redirects to forbidden when the current user lacks the permission', () => {
    useAuthStore.setState({
      token: 'jwt-token',
      currentUser: {
        id: 'user-auditor',
        username: 'auditor',
        name: '审计员',
        role: 'auditor',
        roles: ['auditor'],
        permissions: [PERMISSIONS.auditRead],
      },
      hydrating: false,
    })

    render(
      <MemoryRouter initialEntries={['/iam/roles']}>
        <Routes>
          <Route
            path="/iam/roles"
            element={
              <RequirePermissions requiredPermissions={[PERMISSIONS.roleRead]}>
                <div>roles-page</div>
              </RequirePermissions>
            }
          />
          <Route path="/login" element={<div>login-page</div>} />
          <Route path="/403" element={<div>forbidden-page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('forbidden-page')).toBeInTheDocument()
  })

  it('renders the page when the current user has the permission', () => {
    useAuthStore.setState({
      token: 'jwt-token',
      currentUser: {
        id: 'user-admin',
        username: 'admin',
        name: '管理员',
        role: 'admin',
        roles: ['admin'],
        permissions: [PERMISSIONS.roleRead],
      },
      hydrating: false,
    })

    render(
      <MemoryRouter initialEntries={['/iam/roles']}>
        <Routes>
          <Route
            path="/iam/roles"
            element={
              <RequirePermissions requiredPermissions={[PERMISSIONS.roleRead]}>
                <div>roles-page</div>
              </RequirePermissions>
            }
          />
          <Route path="/login" element={<div>login-page</div>} />
          <Route path="/403" element={<div>forbidden-page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('roles-page')).toBeInTheDocument()
  })
})
