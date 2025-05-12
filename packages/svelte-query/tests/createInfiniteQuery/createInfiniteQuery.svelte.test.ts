import { describe, expect, test } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import { ref } from '../utils.svelte.js'
import BaseExample from './BaseExample.svelte'
import SelectExample from './SelectExample.svelte'
import type { QueryObserverResult } from '@tanstack/query-core'

describe('createInfiniteQuery', () => {
  test('Return the correct states for a successful query', async () => {
    let states = ref<Array<QueryObserverResult>>([])

    const rendered = render(BaseExample, {
      props: {
        states,
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Status: success')).toBeInTheDocument()
    })

    expect(states.value).toHaveLength(2)

    expect(states.value[0]).toEqual({
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

    expect(states.value[1]).toEqual({
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
    let states = ref<Array<QueryObserverResult>>([])

    const rendered = render(SelectExample, {
      props: {
        states,
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('count: 1')).toBeInTheDocument()
    })

    expect(states.value).toHaveLength(2)

    expect(states.value[0]).toMatchObject({
      data: undefined,
      isSuccess: false,
    })

    expect(states.value[1]).toMatchObject({
      data: { pages: ['count: 1'] },
      isSuccess: true,
    })
  })
})
