import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, useQuery } from '..'
import { queryOptions } from '../queryOptions'
import { renderWithClient } from './utils'
import type { UseQueryOptions, UseQueryResult } from '../types'

describe('queryOptions', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the object received as a parameter without any modification.', () => {
    const key = queryKey()
    const object: UseQueryOptions = {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 5),
    } as const

    expect(queryOptions(object)).toStrictEqual(object)
  })

  describe('useQuery', () => {
    it('should allow to set default data value with queryOptions', async () => {
      const key = queryKey()
      const options = queryOptions({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
      })

      function Page() {
        const { data = 'default' } = useQuery(options)

        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      expect(rendered.getByText('default')).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('test')).toBeInTheDocument()
    })

    it('should return the correct states for a successful query with queryOptions', async () => {
      const key = queryKey()
      const states: Array<UseQueryResult<string>> = []
      const options = queryOptions({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
      })

      function Page() {
        const state = useQuery(options)

        states.push(state)

        if (state.isPending) {
          return <span>pending</span>
        }

        if (state.isLoadingError) {
          return <span>{state.error.message}</span>
        }

        return <span>{state.data}</span>
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('test')).toBeInTheDocument()

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
        isPending: true,
        isInitialLoading: true,
        isLoading: true,
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
        isPending: false,
        isInitialLoading: false,
        isLoading: false,
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

      expect(states[0]!.promise).toEqual(states[1]!.promise)
    })

    it('should return the correct states for an unsuccessful query with queryOptions', async () => {
      const key = queryKey()
      const states: Array<UseQueryResult> = []
      let index = 0
      const options = queryOptions({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() =>
            Promise.reject(new Error(`rejected #${++index}`)),
          ),
        retry: 1,
        retryDelay: 10,
      })

      function Page() {
        const state = useQuery(options)

        states.push(state)

        return (
          <div>
            <h1>Status: {state.status}</h1>
            <div>Failure Count: {state.failureCount}</div>
            <div>Failure Reason: {state.failureReason?.message}</div>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await vi.advanceTimersByTimeAsync(31)
      expect(rendered.getByText('Status: error')).toBeInTheDocument()

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
        isPending: true,
        isInitialLoading: true,
        isLoading: true,
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
        data: undefined,
        dataUpdatedAt: 0,
        error: null,
        errorUpdatedAt: 0,
        failureCount: 1,
        failureReason: new Error('rejected #1'),
        errorUpdateCount: 0,
        isError: false,
        isFetched: false,
        isFetchedAfterMount: false,
        isFetching: true,
        isPaused: false,
        isPending: true,
        isInitialLoading: true,
        isLoading: true,
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
      expect(states[2]).toEqual({
        data: undefined,
        dataUpdatedAt: 0,
        error: new Error('rejected #2'),
        errorUpdatedAt: expect.any(Number),
        failureCount: 2,
        failureReason: new Error('rejected #2'),
        errorUpdateCount: 1,
        isError: true,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isPaused: false,
        isPending: false,
        isInitialLoading: false,
        isLoading: false,
        isLoadingError: true,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: true,
        isSuccess: false,
        isEnabled: true,
        refetch: expect.any(Function),
        status: 'error',
        fetchStatus: 'idle',
        promise: expect.any(Promise),
      })

      expect(states[0]!.promise).toEqual(states[1]!.promise)
      expect(states[1]!.promise).toEqual(states[2]!.promise)
    })

    it('should be able to select a part of the data with queryOptions', async () => {
      const key = queryKey()
      const states: Array<UseQueryResult<string>> = []
      const options = queryOptions({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ name: 'test' })),
        select: (data) => data.name,
      })

      function Page() {
        const state = useQuery(options)

        states.push(state)

        return <div>{state.data}</div>
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('test')).toBeInTheDocument()

      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ data: undefined })
      expect(states[1]).toMatchObject({ data: 'test' })
    })

    it('should support disabled queries via queryOptions', async () => {
      const key = queryKey()
      const options = queryOptions({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        enabled: false,
      })

      function Page() {
        const query = useQuery(options)

        return (
          <div>
            <div>FetchStatus: {query.fetchStatus}</div>
            <h2>Data: {query.data || 'no data'}</h2>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      expect(rendered.getByText('FetchStatus: idle')).toBeInTheDocument()
      expect(rendered.getByText('Data: no data')).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('FetchStatus: idle')).toBeInTheDocument()
      expect(rendered.getByText('Data: no data')).toBeInTheDocument()
    })

    it('should mark query as fetching when using initialData with queryOptions', async () => {
      const key = queryKey()
      const results: Array<UseQueryResult<string>> = []
      const options = queryOptions({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'serverData'),
        initialData: 'initialData',
      })

      function Page() {
        const result = useQuery(options)

        results.push(result)

        return <div>data: {result.data}</div>
      }

      const rendered = renderWithClient(queryClient, <Page />)

      expect(rendered.getByText('data: initialData')).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('data: serverData')).toBeInTheDocument()

      expect(results.length).toBe(2)
      expect(results[0]).toMatchObject({
        data: 'initialData',
        isFetching: true,
      })
      expect(results[1]).toMatchObject({
        data: 'serverData',
        isFetching: false,
      })
    })

    it('should start with status pending, fetchStatus idle if enabled is false with queryOptions', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const options1 = queryOptions({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 'data1'),
        enabled: false,
      })
      const options2 = queryOptions({
        queryKey: key2,
        queryFn: () => sleep(10).then(() => 'data2'),
      })

      function Page() {
        const first = useQuery(options1)
        const second = useQuery(options2)

        return (
          <div>
            <div>
              First Status: {first.status}, {first.fetchStatus}
            </div>
            <div>
              Second Status: {second.status}, {second.fetchStatus}
            </div>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      expect(
        rendered.getByText('First Status: pending, idle'),
      ).toBeInTheDocument()
      expect(
        rendered.getByText('Second Status: pending, fetching'),
      ).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(11)
      expect(
        rendered.getByText('First Status: pending, idle'),
      ).toBeInTheDocument()
      expect(
        rendered.getByText('Second Status: success, idle'),
      ).toBeInTheDocument()
    })
  })
})
