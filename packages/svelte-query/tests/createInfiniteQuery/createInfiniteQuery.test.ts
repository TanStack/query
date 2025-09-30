import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { fireEvent, render } from '@testing-library/svelte'
import { get, writable } from 'svelte/store'
import BaseExample from './BaseExample.svelte'
import SelectExample from './SelectExample.svelte'
import ChangeClient from './ChangeClient.svelte'
import type { Writable } from 'svelte/store'
import type {  QueryObserverResult } from '@tanstack/query-core'

describe('createInfiniteQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

 it('should return the correct states for a successful query', async () => {
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])

    const rendered = render(BaseExample, {
      props: {
        states: statesStore,
      },
    })

    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Status: success')).toBeInTheDocument()

    const states = get(statesStore)

    expect(states).toHaveLength(2)
    expect(states[0]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      fetchNextPage: expect.any(Function),
      fetchPreviousPage: expect.any(Function),
      hasNextPage: false,
      hasPreviousPage: false,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isPaused: false,
      isFetchNextPageError: false,
      isFetchingNextPage: false,
      isFetchPreviousPageError: false,
      isFetchingPreviousPage: false,
      isLoading: true,
      isPending: true,
      isInitialLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      isEnabled: true,
      refetch: expect.any(Function),
      status: 'pending',
      fetchStatus: 'fetching',
      promise: expect.any(Promise),
    })
    expect(states[1]).toEqual({
      data: { pages: [0], pageParams: [0] },
      dataUpdatedAt: expect.any(Number),
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      fetchNextPage: expect.any(Function),
      fetchPreviousPage: expect.any(Function),
      hasNextPage: true,
      hasPreviousPage: false,
      isError: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isPaused: false,
      isFetchNextPageError: false,
      isFetchingNextPage: false,
      isFetchPreviousPageError: false,
      isFetchingPreviousPage: false,
      isLoading: false,
      isPending: false,
      isInitialLoading: false,
      isLoadingError: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: true,
      isEnabled: true,
      refetch: expect.any(Function),
      status: 'success',
      fetchStatus: 'idle',
      promise: expect.any(Promise),
    })
  })

  it('should be able to select a part of the data', async () => {
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])

    const rendered = render(SelectExample, {
      props: {
        states: statesStore,
      },
    })

    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('count: 1')).toBeInTheDocument()

    const states = get(statesStore)

    expect(states).toHaveLength(2)
    expect(states[0]).toMatchObject({
      data: undefined,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      data: { pages: ['count: 1'] },
      isSuccess: true,
    })
  })

it('should be able to set new pages with the query client', async () => {
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])
    const queryClient = new QueryClient()

    const rendered = render(ChangeClient, {
      props: {
        states: statesStore,
        queryClient,
      },
    })

    await vi.advanceTimersByTimeAsync(11)
     expect(
      rendered.getByText('Data: {"pages":[0],"pageParams":[0]}'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /setPages/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(
      rendered.getByText('Data: {"pages":[7,8],"pageParams":[7,8]}'),
    ).toBeInTheDocument()
  })
})
