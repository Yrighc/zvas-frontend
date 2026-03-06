import { create } from 'zustand'

interface AuthState {
  token: string
  setToken: (token: string) => void
  clearToken: () => void
}

const STORAGE_KEY = 'zvas.console.auth.token'

/**
 * useAuthStore 管理当前控制台使用的 Bearer Token。
 */
export const useAuthStore = create<AuthState>((set) => ({
  token: readToken(),
  setToken: (token) => {
    const normalized = token.trim()
    writeToken(normalized)
    set({ token: normalized })
  },
  clearToken: () => {
    removeToken()
    set({ token: '' })
  },
}))

function readToken() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return ''
  }
  return window.localStorage.getItem(STORAGE_KEY) || ''
}

function writeToken(token: string) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, token)
}

function removeToken() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  window.localStorage.removeItem(STORAGE_KEY)
}
