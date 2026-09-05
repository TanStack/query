import { act, render } from '@testing-library/react'
import {
  IsRestoringProvider,
  QueryClient,
  useQuery,
} from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BroadcastQueryClientProvider } from '../BroadcastQueryClientProvider'

const mockState = vi.hoisted(() => {
  const state: { resolveRestore?: () => void } = {}
  const cleanup = vi.fn()
  const restore = vi.fn(() => {
    const restorePromise = new Promise<void>((resolve) => {
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
})
