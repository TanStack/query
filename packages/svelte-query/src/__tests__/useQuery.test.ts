import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, it, expect } from 'vitest';
import { useQuery, useQueryClient, type UseQueryResult } from '..'

// @ts-ignore
import Page from '../__mocks__/Page.svelte'
import {
  expectType,
  queryKey,
  setActTimeout,
  simplefetcher,
  sleep,
} from './utils'

describe('useQuery', () => {
  const queryClient = useQueryClient()

  it('should allow to set default data value', async () => {
    const key = queryKey()
    const query = useQuery(key, simplefetcher)

    render(Page, {
      props: {
        queryKey: key,
        query,
        defaultData: 'default',
      },
    })

    screen.getByText('default')

    const testText = screen.queryByText('test')

    expect(testText).not.toBeInTheDocument()
  })

  it('should return the correct states for a successful query', async () => {
    const key = queryKey()
    const query = useQuery<string, Error>(key, simplefetcher)
    const states: UseQueryResult<string>[] = []
    let state!: UseQueryResult<string, Error>

    query.subscribe((result) => {
      states.push(result)
      state = result
    })

    if (state.isLoading) {
      expectType<undefined>(state.data)
      expectType<null>(state.error)
    }

    if (state.isLoadingError) {
      expectType<undefined>(state.data)
      expectType<Error>(state.error)
    }

    if (state.isSuccess) {
      expectType<string>(state.data)
      expectType<Error | null>(state.error)
    }

    render(Page, {
      props: {
        queryKey: key,
        query,
      },
    })

    await waitFor(() => screen.getByText('test'))

    expect(states.length).toEqual(2)

    expect(states[0]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isPaused: false,
      isLoading: true,
      isInitialLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'loading',
      fetchStatus: 'fetching',
    })

    expect(states[1]).toEqual({
      data: 'test',
      dataUpdatedAt: expect.any(Number),
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isError: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isPaused: false,
      isLoading: false,
      isInitialLoading: false,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: true,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'success',
      fetchStatus: 'idle',
    })
  })

  it('should return the correct states for a unsuccessful query', async () => {
    const key = queryKey()
    const states: UseQueryResult<undefined, string>[] = []

    const query = useQuery<string[], string, undefined>(
      key,
      () => Promise.reject('rejected'),
      {
        retry: 1,
        retryDelay: 1,
      },
    )

    let state!: UseQueryResult<undefined, string>

    query.subscribe((result) => {
      states.push(result)

      state = result
    })

    if (state.isLoading) {
      expectType<undefined>(state.data)
      expectType<null>(state.error)
    }

    if (state.isLoadingError) {
      expectType<undefined>(state.data)
    }

    render(Page, {
      props: {
        queryKey: key,
        query,
      },
    })

    await waitFor(() => screen.getByText('Status: error'))

    expect(states[0]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isPaused: false,
      isLoading: true,
      isInitialLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'loading',
      fetchStatus: 'fetching',
    })

    expect(states[1]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: 'rejected',
      errorUpdatedAt: expect.any(Number),
      failureCount: 2,
      failureReason: 'rejected',
      errorUpdateCount: 1,
      isError: true,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isPaused: false,
      isLoading: false,
      isInitialLoading: false,
      isLoadingError: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'error',
      fetchStatus: 'idle',
    })
  })

  it('should set isFetchedAfterMount to true after a query has been fetched', async () => {
    const key = queryKey()
    const states: UseQueryResult<string, Error>[] = []

    await queryClient.prefetchQuery(key, () => 'prefetched')
    const query = useQuery<string, Error>(key, () => 'data')

    query.subscribe(async (result) => {
      states.push(result)
    })

    render(Page, {
      props: {
        queryKey: key,
        query,
      },
    })

    await sleep(10)

    expect(states[0]).toMatchObject({
      data: 'prefetched',
      isFetched: true,
      isFetchedAfterMount: false,
    })
    expect(states[1]).toMatchObject({
      data: 'data',
      isFetched: true,
      isFetchedAfterMount: true,
    })
  })

  it('should call onSuccess after a query has been fetched', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []
    const onSuccess = jest.fn()
    const query = useQuery(
      key,
      async () => {
        await sleep(10)
        return 'data'
      },
      { onSuccess },
    )

    query.subscribe(async (result) => {
      states.push(result)
    })

    const rendered = render(Page, {
      props: {
        queryKey: key,
        query,
      },
    })

    await rendered.findByText('data')
    expect(states.length).toBe(2)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('data')
  })

  it('should call onSuccess after a query has been refetched', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []
    const onSuccess = jest.fn()
    let count = 0
    const query = useQuery(
      key,
      async () => {
        count++
        await sleep(10)
        return 'data' + count
      },
      { onSuccess },
    )

    query.subscribe(async (result) => {
      states.push(result)
    })

    render(Page, {
      props: {
        queryKey: key,
        query,
      },
    })

    await screen.findByText('data1')
    fireEvent.click(screen.getByRole('button', { name: /refetch/i }))
    await screen.findByText('data2')

    expect(states.length).toBe(3) //loading, success, success after refetch
    expect(count).toBe(2)
    expect(onSuccess).toHaveBeenCalledTimes(2)
  })

  it('should call onSuccess after a disabled query has been fetched', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []
    const onSuccess = jest.fn()
    const query = useQuery(key, () => 'data', { enabled: false, onSuccess })

    let rendered = 0
    query.subscribe(async (result) => {
      rendered++
      states.push(result)

      // Lazy Hack: Should be called inside a component lifecycle hook
      if (rendered < 2)
        setActTimeout(() => {
          result.refetch()
        }, 10)
    })

    render(Page, {
      props: {
        queryKey: key,
        query,
      },
    })

    await sleep(50)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('data')
  })
})
