/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { act, cleanup, render } from '@testing-library/preact'
import { QueryClient, useQuery } from '@tanstack/preact-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BroadcastQueryClientProvider } from '../BroadcastQueryClientProvider'

const mockState = vi.hoisted(() => {
  const state: {
    resolveRestore?: () => void
    restoreResolvers: Array<() => void>
  } = { restoreResolvers: [] }
  const cleanupSession = vi.fn()
  const restore = vi.fn(() => {
    const restorePromise = new Promise<void>((resolve) => {
      state.restoreResolvers.push(resolve)
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
    mockState.state.restoreResolvers.length = 0
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

  it('gates a replacement QueryClient before its restore effect runs', async () => {
    const queryKey = ['replacement-client-bootstrap']
    const queryFn = vi.fn().mockResolvedValue('network')
    const firstClient = new QueryClient()
    const replacementClient = new QueryClient()
    firstClient.setQueryData(queryKey, 'first-cache', {
      updatedAt: Date.now(),
    })

    function Page() {
      const query = useQuery({ queryKey, queryFn, staleTime: Infinity })
      return <div>{query.data ?? query.fetchStatus}</div>
    }

    const rendered = render(
      <BroadcastQueryClientProvider
        client={firstClient}
        broadcastOptions={{ broadcastChannel: 'test-channel' }}
      >
        <Page key="first" />
      </BroadcastQueryClientProvider>,
    )

    await act(() => {
      mockState.state.resolveRestore?.()
    })

    rendered.rerender(
      <BroadcastQueryClientProvider
        client={replacementClient}
        broadcastOptions={{ broadcastChannel: 'test-channel' }}
      >
        <Page key="replacement" />
      </BroadcastQueryClientProvider>,
    )

    expect(queryFn).not.toHaveBeenCalled()
    expect(mockState.restore).toHaveBeenCalledTimes(2)
    expect(mockState.cleanupSession).toHaveBeenCalledOnce()

    await act(() => {
      mockState.state.resolveRestore?.()
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(queryFn).toHaveBeenCalledOnce()
    rendered.unmount()
    expect(mockState.cleanupSession).toHaveBeenCalledTimes(2)
  })

  it('does not let old restore promises open a rapidly replaced client gate', async () => {
    const queryFn = vi.fn().mockResolvedValue('network')
    const firstClient = new QueryClient()
    const replacementClient = new QueryClient()
    const finalClient = new QueryClient()

    function Page() {
      const query = useQuery({
        queryKey: ['stale-restore-promise'],
        queryFn,
      })
      return <div>{query.fetchStatus}</div>
    }

    const rendered = render(
      <BroadcastQueryClientProvider
        client={firstClient}
        broadcastOptions={{ broadcastChannel: 'test-channel' }}
      >
        <Page key="first" />
      </BroadcastQueryClientProvider>,
    )

    rendered.rerender(
      <BroadcastQueryClientProvider
        client={replacementClient}
        broadcastOptions={{ broadcastChannel: 'test-channel' }}
      >
        <Page key="replacement" />
      </BroadcastQueryClientProvider>,
    )

    rendered.rerender(
      <BroadcastQueryClientProvider
        client={finalClient}
        broadcastOptions={{ broadcastChannel: 'test-channel' }}
      >
        <Page key="final" />
      </BroadcastQueryClientProvider>,
    )

    const firstRestore = mockState.state.restoreResolvers[0]
    const replacementRestore = mockState.state.restoreResolvers[1]
    const finalRestore = mockState.state.restoreResolvers[2]
    expect(firstRestore).toEqual(expect.any(Function))
    expect(replacementRestore).toEqual(expect.any(Function))
    expect(finalRestore).toEqual(expect.any(Function))

    await act(async () => {
      firstRestore?.()
      await Promise.resolve()
    })
    expect(queryFn).not.toHaveBeenCalled()

    await act(async () => {
      replacementRestore?.()
      await Promise.resolve()
    })
    expect(queryFn).not.toHaveBeenCalled()

    await act(async () => {
      finalRestore?.()
      await Promise.resolve()
    })
    expect(queryFn).toHaveBeenCalledOnce()
    rendered.unmount()
  })

  it('does not restart restore when the QueryClient is unchanged', () => {
    const queryClient = new QueryClient()
    const rendered = render(
      <BroadcastQueryClientProvider
        client={queryClient}
        broadcastOptions={{ broadcastChannel: 'test-channel' }}
      />,
    )

    rendered.rerender(
      <BroadcastQueryClientProvider
        client={queryClient}
        broadcastOptions={{ broadcastChannel: 'test-channel' }}
      />,
    )

    expect(mockState.restore).toHaveBeenCalledOnce()
    rendered.unmount()
  })
})
