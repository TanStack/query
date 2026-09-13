import { act, render } from '@testing-library/react'
import {
  IsRestoringProvider,
  QueryClient,
  useQuery,
} from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BroadcastQueryClientProvider } from '../BroadcastQueryClientProvider'

const mockState = vi.hoisted(() => {
  const state: {
    resolveRestore?: () => void
    restoreResolvers: Array<() => void>
  } = { restoreResolvers: [] }
  const cleanup = vi.fn()
  const restore = vi.fn(() => {
    const restorePromise = new Promise<void>((resolve) => {
      state.restoreResolvers.push(resolve)
      state.resolveRestore = resolve
    })
    return [cleanup, restorePromise] as const
  })
  return { cleanup, restore, state }
})

vi.mock('@tanstack/query-broadcast-client-experimental', () => ({
  broadcastQueryClientRestore: mockState.restore,
}))

describe('BroadcastQueryClientProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockState.cleanup.mockReset()
    mockState.restore.mockClear()
    mockState.state.resolveRestore = undefined
    mockState.state.restoreResolvers.length = 0
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('prevents a fresh query from fetching before bootstrap completes', async () => {
    const queryKey = ['bootstrap-provider']
    const queryFn = vi.fn().mockResolvedValue('from-network')
    const queryClient = new QueryClient()
    queryClient.setQueryData(queryKey, 'from-cache', {
      updatedAt: Date.now(),
    })

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

    expect(rendered.getByText('from-cache')).toBeInTheDocument()
    expect(queryFn).not.toHaveBeenCalled()
    expect(mockState.restore).toHaveBeenCalledWith({
      broadcastChannel: 'test-channel',
      queryClient,
    })

    await act(() => {
      mockState.state.resolveRestore?.()
    })

    expect(rendered.getByText('from-cache')).toBeInTheDocument()
    expect(queryFn).not.toHaveBeenCalled()

    rendered.unmount()
    expect(mockState.cleanup).toHaveBeenCalledOnce()
  })

  it('allows a stale query to refetch after bootstrap completes', async () => {
    const queryKey = ['stale-bootstrap-provider']
    const queryFn = vi.fn().mockResolvedValue('fresh-data')
    const queryClient = new QueryClient()
    queryClient.setQueryData(queryKey, 'stale-cache', { updatedAt: 0 })

    function Page() {
      const query = useQuery({
        queryKey,
        queryFn,
        staleTime: 0,
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

    expect(queryFn).not.toHaveBeenCalled()

    await act(() => {
      mockState.state.resolveRestore?.()
    })

    await act(async () => {
      await Promise.resolve()
    })
    expect(queryFn).toHaveBeenCalledOnce()
    rendered.unmount()
  })

  it('preserves a parent restore gate after local bootstrap completes', async () => {
    const queryFn = vi.fn().mockResolvedValue('network')
    const queryClient = new QueryClient()

    function Page() {
      const query = useQuery({
        queryKey: ['parent-restore-gate'],
        queryFn,
      })
      return <div>{query.fetchStatus}</div>
    }

    const rendered = render(
      <IsRestoringProvider value={true}>
        <BroadcastQueryClientProvider
          client={queryClient}
          broadcastOptions={{ broadcastChannel: 'test-channel' }}
        >
          <Page />
        </BroadcastQueryClientProvider>
      </IsRestoringProvider>,
    )

    await act(() => {
      mockState.state.resolveRestore?.()
    })

    expect(queryFn).not.toHaveBeenCalled()
    rendered.unmount()
  })

  it('allows an empty query to fetch after bootstrap completes', async () => {
    const queryFn = vi.fn().mockResolvedValue('network')
    const queryClient = new QueryClient()

    function Page() {
      const query = useQuery({
        queryKey: ['empty-bootstrap'],
        queryFn,
      })
      return <div>{query.fetchStatus}</div>
    }

    const rendered = render(
      <BroadcastQueryClientProvider
        client={queryClient}
        broadcastOptions={{ broadcastChannel: 'test-channel' }}
      >
        <Page />
      </BroadcastQueryClientProvider>,
    )

    expect(queryFn).not.toHaveBeenCalled()
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
    expect(mockState.cleanup).toHaveBeenCalledOnce()

    await act(() => {
      mockState.state.resolveRestore?.()
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(queryFn).toHaveBeenCalledOnce()
    rendered.unmount()
    expect(mockState.cleanup).toHaveBeenCalledTimes(2)
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
