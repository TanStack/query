import { describe, expect, it, vi } from 'vitest'
import { SvelteQueryDevtools } from '..'

// Mock svelte-query to avoid requiring full Svelte context
vi.mock('@tanstack/svelte-query', () => ({
  useQueryClient: vi.fn(() => ({})),
  onlineManager: {
    isOnline: () => true,
    subscribe: vi.fn(),
  },
}))

// Mock esm-env to control environment
vi.mock('esm-env', () => ({
  BROWSER: false,
  DEV: false,
}))

// Mock query-devtools
vi.mock('@tanstack/query-devtools', () => ({
  TanstackQueryDevtools: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    unmount: vi.fn(),
    setButtonPosition: vi.fn(),
    setPosition: vi.fn(),
    setInitialIsOpen: vi.fn(),
    setErrorTypes: vi.fn(),
  })),
}))

describe('SvelteQueryDevtools', () => {
  it('should export SvelteQueryDevtools component', () => {
    expect(SvelteQueryDevtools).toBeDefined()
  })

  it('should be a valid Svelte component', () => {
    // Svelte components are objects with specific shape
    expect(typeof SvelteQueryDevtools).toBe('function')
  })
})
