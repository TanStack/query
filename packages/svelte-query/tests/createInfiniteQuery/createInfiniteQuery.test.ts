import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { get, writable } from 'svelte/store'
import BaseExample from './BaseExample.svelte'
import SelectExample from './SelectExample.svelte'
import type { Writable } from 'svelte/store'
import type { QueryObserverResult } from '@tanstack/query-core'

describe('createInfiniteQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Return the correct states for a successful query', async () => {
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])

    const rendered = render(BaseExample, {
      props: {
        states: statesStore,
      },
    })

    await vi.waitFor(() => {
      expect(rendered.queryByText('Status: success')).toBeInTheDocument()
    })

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
      refetch: expect.any(Function),
      status: 'success',
      fetchStatus: 'idle',
      promise: expect.any(Promise),
    })
  })

  test('Select a part of the data', async () => {
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])

    const rendered = render(SelectExample, {
      props: {
        states: statesStore,
      },
    })

    await vi.waitFor(() => {
      expect(rendered.queryByText('count: 1')).toBeInTheDocument()
    })

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
})
