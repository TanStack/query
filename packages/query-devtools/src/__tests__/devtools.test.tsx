import { describe, expect, it, vi } from 'vitest'
import { TanstackQueryDevtools, TanstackQueryDevtoolsPanel } from '..'
import type { QueryClient } from '@tanstack/query-core'

// Create a mock QueryClient
const createMockQueryClient = (): QueryClient =>
  ({
    getQueryCache: vi.fn(() => ({
      getAll: vi.fn(() => []),
      subscribe: vi.fn(),
      find: vi.fn(),
      findAll: vi.fn(),
    })),
    getMutationCache: vi.fn(() => ({
      getAll: vi.fn(() => []),
      subscribe: vi.fn(),
    })),
    getDefaultOptions: vi.fn(() => ({})),
    setDefaultOptions: vi.fn(),
    getQueryDefaults: vi.fn(),
    setQueryDefaults: vi.fn(),
    getMutationDefaults: vi.fn(),
    setMutationDefaults: vi.fn(),
    defaultQueryOptions: vi.fn((options) => options),
    defaultMutationOptions: vi.fn((options) => options),
  }) as unknown as QueryClient

// Mock onlineManager
const mockOnlineManager = {
  isOnline: () => true,
  subscribe: vi.fn(),
  setOnline: vi.fn(),
  setEventListener: vi.fn(),
}

describe('TanstackQueryDevtools', () => {
  it('should export TanstackQueryDevtools class', () => {
    expect(TanstackQueryDevtools).toBeDefined()
    expect(typeof TanstackQueryDevtools).toBe('function')
  })

  it('should create an instance with config', () => {
    const client = createMockQueryClient()
    const devtools = new TanstackQueryDevtools({
      client,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager: mockOnlineManager as any,
    })

    expect(devtools).toBeInstanceOf(TanstackQueryDevtools)
  })

  it('should throw error when mounting twice', () => {
    const client = createMockQueryClient()
    const devtools = new TanstackQueryDevtools({
      client,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager: mockOnlineManager as any,
    })

    const container = document.createElement('div')
    devtools.mount(container)

    expect(() => devtools.mount(container)).toThrow(
      'Devtools is already mounted',
    )

    devtools.unmount()
  })

  it('should throw error when unmounting without mounting', () => {
    const client = createMockQueryClient()
    const devtools = new TanstackQueryDevtools({
      client,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager: mockOnlineManager as any,
    })

    expect(() => devtools.unmount()).toThrow('Devtools is not mounted')
  })

  it('should allow setting button position', () => {
    const client = createMockQueryClient()
    const devtools = new TanstackQueryDevtools({
      client,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager: mockOnlineManager as any,
      buttonPosition: 'bottom-left',
    })

    // Should not throw
    expect(() => devtools.setButtonPosition('top-right')).not.toThrow()
  })

  it('should allow setting position', () => {
    const client = createMockQueryClient()
    const devtools = new TanstackQueryDevtools({
      client,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager: mockOnlineManager as any,
    })

    // Should not throw
    expect(() => devtools.setPosition('left')).not.toThrow()
  })

  it('should allow setting initial open state', () => {
    const client = createMockQueryClient()
    const devtools = new TanstackQueryDevtools({
      client,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager: mockOnlineManager as any,
    })

    // Should not throw
    expect(() => devtools.setInitialIsOpen(true)).not.toThrow()
  })

  it('should allow setting error types', () => {
    const client = createMockQueryClient()
    const devtools = new TanstackQueryDevtools({
      client,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager: mockOnlineManager as any,
    })

    // Should not throw
    expect(() => devtools.setErrorTypes([])).not.toThrow()
  })

  it('should allow setting client', () => {
    const client = createMockQueryClient()
    const devtools = new TanstackQueryDevtools({
      client,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager: mockOnlineManager as any,
    })

    const newClient = createMockQueryClient()
    // Should not throw
    expect(() => devtools.setClient(newClient)).not.toThrow()
  })

  it('should allow setting theme', () => {
    const client = createMockQueryClient()
    const devtools = new TanstackQueryDevtools({
      client,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager: mockOnlineManager as any,
    })

    // Should not throw
    expect(() => devtools.setTheme('dark')).not.toThrow()
    expect(() => devtools.setTheme('light')).not.toThrow()
    expect(() => devtools.setTheme('system')).not.toThrow()
  })
})

describe('TanstackQueryDevtoolsPanel', () => {
  it('should export TanstackQueryDevtoolsPanel class', () => {
    expect(TanstackQueryDevtoolsPanel).toBeDefined()
    expect(typeof TanstackQueryDevtoolsPanel).toBe('function')
  })

  it('should create an instance with config', () => {
    const client = createMockQueryClient()
    const devtoolsPanel = new TanstackQueryDevtoolsPanel({
      client,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager: mockOnlineManager as any,
    })

    expect(devtoolsPanel).toBeInstanceOf(TanstackQueryDevtoolsPanel)
  })
})
