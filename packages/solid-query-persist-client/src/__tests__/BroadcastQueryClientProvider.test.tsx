import { cleanup, render, screen } from '@solidjs/testing-library'
import { QueryClient, useQuery } from '@tanstack/solid-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BroadcastQueryClientProvider } from '../BroadcastQueryClientProvider'

const mockState = vi.hoisted(() => {
  const state: { resolveRestore?: () => void } = {}
  const cleanupSession = vi.fn()
  const restore = vi.fn(() => {
    const restorePromise = new Promise<void>((resolve) => {
      state.resolveRestore = resolve
    })
    return [cleanupSession, restorePromise] as const
  })
  return { cleanupSession, restore, state }
})

vi.mock('@tanstack/query-broadcast-client-experimental', () => ({
  broadcastQueryClientRestore: mockState.restore,
}))

describe('BroadcastQueryClientProvider (solid)', () => {
  beforeEach(() => {
    mockState.cleanupSession.mockReset()
    mockState.restore.mockClear()
    mockState.state.resolveRestore = undefined
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('holds query observers until bootstrap completes', async () => {
    const queryKey = ['solid-bootstrap']
    const queryFn = vi.fn().mockResolvedValue('network')
    const queryClient = new QueryClient()
    queryClient.setQueryData(queryKey, 'cache', { updatedAt: Date.now() })

    function Page() {
      const query = useQuery(() => ({
        queryKey,
        queryFn,
        staleTime: Infinity,
      }))
      return <div>{query.data ?? query.fetchStatus}</div>
    }

    render(() => (
      <BroadcastQueryClientProvider
        client={queryClient}
        broadcastOptions={{ broadcastChannel: 'test-channel' }}
      >
        <Page />
      </BroadcastQueryClientProvider>
    ))

    expect(screen.getByText('cache')).toBeInTheDocument()
    expect(queryFn).not.toHaveBeenCalled()

    await mockState.state.resolveRestore?.()
    expect(queryFn).not.toHaveBeenCalled()
    expect(mockState.cleanupSession).not.toHaveBeenCalled()
    cleanup()
    expect(mockState.cleanupSession).toHaveBeenCalledOnce()
  })

  it('refetches a stale query after bootstrap completes', async () => {
    const queryKey = ['solid-stale-bootstrap']
    const queryFn = vi.fn().mockResolvedValue('network')
    const queryClient = new QueryClient()
    queryClient.setQueryData(queryKey, 'stale', { updatedAt: 0 })

    function Page() {
      const query = useQuery(() => ({ queryKey, queryFn, staleTime: 0 }))
      return <div>{query.data ?? query.fetchStatus}</div>
    }

    render(() => (
      <BroadcastQueryClientProvider
        client={queryClient}
        broadcastOptions={{ broadcastChannel: 'test-channel' }}
      >
        <Page />
      </BroadcastQueryClientProvider>
    ))

    await mockState.state.resolveRestore?.()
    await Promise.resolve()

    expect(queryFn).toHaveBeenCalledOnce()
    cleanup()
  })
})
