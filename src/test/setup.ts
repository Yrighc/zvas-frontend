import '@testing-library/jest-dom/vitest'

class StorageMock {
  private store = new Map<string, string>()

  clear() {
    this.store.clear()
  }

  getItem(key: string) {
    return this.store.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.store.delete(key)
  }

  setItem(key: string, value: string) {
    this.store.set(key, value)
  }

  get length() {
    return this.store.size
  }
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const localStorageMock = new StorageMock()
const sessionStorageMock = new StorageMock()

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
})

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: sessionStorageMock,
})

Object.defineProperty(globalThis, 'localStorage', {
  writable: true,
  value: localStorageMock,
})

Object.defineProperty(globalThis, 'sessionStorage', {
  writable: true,
  value: sessionStorageMock,
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
})
