import { create } from 'zustand'

import type { AuthUserView } from '@/types/auth'

interface AuthState {
  token: string
  currentUser: AuthUserView | null
  hydrating: boolean
  setSession: (token: string, user: AuthUserView | null) => void
  setCurrentUser: (user: AuthUserView | null) => void
  setHydrating: (hydrating: boolean) => void
  clearSession: () => void
}

const TOKEN_STORAGE_KEY = 'zvas.console.auth.token'
const USER_STORAGE_KEY = 'zvas.console.auth.user'

/**
 * useAuthStore 管理当前控制台登录态。
 */
export const useAuthStore = create<AuthState>((set) => ({
  token: readToken(),
  currentUser: readUser(),
  hydrating: Boolean(readToken()),
  setSession: (token, user) => {
    const normalized = token.trim()
    writeToken(normalized)
    writeUser(user)
    set({ token: normalized, currentUser: user, hydrating: false })
  },
  setCurrentUser: (user) => {
    writeUser(user)
    set((state) => ({ ...state, currentUser: user }))
  },
  setHydrating: (hydrating) => {
    set((state) => ({ ...state, hydrating }))
  },
  clearSession: () => {
    removeToken()
    removeUser()
    set({ token: '', currentUser: null, hydrating: false })
  },
}))

function readToken() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return ''
  }
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) || ''
}

function writeToken(token: string) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

function removeToken() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

function readUser() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }
  const raw = window.localStorage.getItem(USER_STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as AuthUserView
  } catch {
    window.localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

function writeUser(user: AuthUserView | null) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  if (!user) {
    window.localStorage.removeItem(USER_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

function removeUser() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  window.localStorage.removeItem(USER_STORAGE_KEY)
}
