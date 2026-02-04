import { describe, expect, it, vi } from 'vitest'
import { createHydrationStreamProvider } from '../HydrationStreamProvider'
import { ReactQueryStreamedHydration } from '../ReactQueryStreamedHydration'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useServerInsertedHTML: vi.fn((callback) => {
    // In test environment, just call the callback to test it doesn't throw
    callback()
  }),
}))

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
  isServer: false,
  useQueryClient: vi.fn(() => ({
    getQueryCache: () => ({
      subscribe: vi.fn(),
    }),
  })),
  dehydrate: vi.fn(() => ({ queries: [], mutations: [] })),
  hydrate: vi.fn(),
  defaultShouldDehydrateQuery: vi.fn(() => true),
}))

describe('HydrationStreamProvider', () => {
  it('should export createHydrationStreamProvider function', () => {
    expect(createHydrationStreamProvider).toBeDefined()
    expect(typeof createHydrationStreamProvider).toBe('function')
  })

  it('should create a provider with context', () => {
    const result = createHydrationStreamProvider<{ test: string }>()

    expect(result).toHaveProperty('Provider')
    expect(result).toHaveProperty('context')
    expect(typeof result.Provider).toBe('function')
  })
})

describe('ReactQueryStreamedHydration', () => {
  it('should export ReactQueryStreamedHydration component', () => {
    expect(ReactQueryStreamedHydration).toBeDefined()
    expect(typeof ReactQueryStreamedHydration).toBe('function')
  })
})
