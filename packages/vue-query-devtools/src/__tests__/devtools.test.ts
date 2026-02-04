import { describe, expect, it, vi } from 'vitest'
import { VueQueryDevtools, VueQueryDevtoolsPanel } from '..'

// Mock vue-query to avoid requiring full Vue context
vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn(),
  onlineManager: {
    isOnline: () => true,
    subscribe: vi.fn(),
  },
}))

// Mock query-devtools to avoid rendering complexities
vi.mock('@tanstack/query-devtools', () => ({
  TanstackQueryDevtools: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    unmount: vi.fn(),
    setButtonPosition: vi.fn(),
    setPosition: vi.fn(),
    setInitialIsOpen: vi.fn(),
    setErrorTypes: vi.fn(),
    setTheme: vi.fn(),
  })),
}))

describe('VueQueryDevtools', () => {
  it('should export VueQueryDevtools component', () => {
    expect(VueQueryDevtools).toBeDefined()
  })

  it('should export VueQueryDevtoolsPanel component', () => {
    expect(VueQueryDevtoolsPanel).toBeDefined()
  })

  it('should be functions (no-op in non-development mode)', () => {
    // In test environment, NODE_ENV is 'test', so the devtools are no-op functions
    expect(typeof VueQueryDevtools).toBe('function')
    expect(typeof VueQueryDevtoolsPanel).toBe('function')
  })
})
