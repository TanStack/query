/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { act, cleanup, render } from '@testing-library/preact'
import { QueryClient, useQuery } from '@tanstack/preact-query'
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

describe('BroadcastQueryClientProvider (preact)', () => {
  beforeEach(() => {
    mockState.cleanupSession.mockReset()
    mockState.restore.mockClear()
    mockState.state.resolveRestore = undefined
  })

  afterEach(() => {
    cleanup()
  })

  it('holds query observers until bootstrap completes', async () => {
    const queryKey = ['preact-bootstrap']
    const queryFn = vi.fn().mockResolvedValue('network')
    const queryClient = new QueryClient()
    queryClient.setQueryData(queryKey, 'cache', { updatedAt: Date.now() })

    function Page() {
      const query = useQuery({
        queryKey,
        queryFn,
        staleTime: Infinity,
      })
      return <div>{query.data ?? query.fetchStatus}</div>
    }

    const rendered = render(
      <BroadcastQueryClientProvider
        client={queryClient}
        broadcastOptions={{ broadcastChannel: 'test-channel' }}
      >
        <Page />
      </BroadcastQueryClientProvider>,
    )

    expect(rendered.getByText('cache')).toBeInTheDocument()
    expect(queryFn).not.toHaveBeenCalled()

    await act(() => {
      mockState.state.resolveRestore?.()
    })

    expect(queryFn).not.toHaveBeenCalled()
    rendered.unmount()
    expect(mockState.cleanupSession).toHaveBeenCalledOnce()
  })

  it('refetches a stale query after bootstrap completes', async () => {
    const queryKey = ['preact-stale-bootstrap']
    const queryFn = vi.fn().mockResolvedValue('network')
    const queryClient = new QueryClient()
    queryClient.setQueryData(queryKey, 'stale', { updatedAt: 0 })

    function Page() {
      const query = useQuery({ queryKey, queryFn, staleTime: 0 })
      return <div>{query.data ?? query.fetchStatus}</div>
    }

    const rendered = render(
      <BroadcastQueryClientProvider
        client={queryClient}
        broadcastOptions={{ broadcastChannel: 'test-channel' }}
      >
        <Page />
      </BroadcastQueryClientProvider>,
    )

    await act(() => {
      mockState.state.resolveRestore?.()
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(queryFn).toHaveBeenCalledOnce()
    rendered.unmount()
  })
})
