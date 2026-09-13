import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { ref } from '../utils.svelte.js'
import Base from './Base.svelte'
import Select from './Select.svelte'
import ChangeClient from './ChangeClient.svelte'
import ErrorBoundary from './ErrorBoundary.svelte'
import InitialData from './InitialData.svelte'
import type { QueryObserverResult } from '@tanstack/query-core'

describe('createInfiniteQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should return the correct states for a successful query', async () => {
    let states = ref<Array<QueryObserverResult>>([])

    const rendered = render(Base, {
      props: {
        queryClient,
        states,
      },
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Status: success')).toBeInTheDocument()

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
      isEnabled: true,
      refetch: expect.any(Function),
      status: 'pending',
      fetchStatus: 'fetching',
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
      isEnabled: true,
      refetch: expect.any(Function),
      status: 'success',
      fetchStatus: 'idle',
    })
  })

  it('should render with initialData and no pending state', async () => {
    let states = ref<Array<QueryObserverResult>>([])

    const rendered = render(InitialData, {
      props: {
        queryClient,
        states,
      },
    })

    expect(rendered.getByText('Status: success')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)

    expect(states.value.every((state) => state.status === 'success')).toBe(true)
    expect(states.value[0]?.data).toEqual({ pages: [0], pageParams: [0] })
  })

  it('should be able to select a part of the data', async () => {
    let states = ref<Array<QueryObserverResult>>([])

    const rendered = render(Select, {
      props: {
        queryClient,
        states,
      },
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('count: 1')).toBeInTheDocument()

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

  it('should be able to set new pages with the query client', async () => {
    const rendered = render(ChangeClient, {
      props: {
        queryClient,
      },
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('Data: {"pages":[0],"pageParams":[0]}'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /setPages/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('Data: {"pages":[7,8],"pageParams":[7,8]}'),
    ).toBeInTheDocument()
  })

  it('should throw error to the nearest svelte:boundary when throwOnError is true', async () => {
    const key = queryKey()
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const rendered = render(ErrorBoundary, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => Promise.reject(new Error('Error test')),
          getNextPageParam: () => undefined,
          initialPageParam: 0,
          retry: false,
          throwOnError: true,
        }),
      },
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('error-boundary')).toHaveTextContent(
      'Error test',
    )

    consoleMock.mockRestore()
  })

  it('should throw error to the nearest svelte:boundary when throwOnError function returns true', async () => {
    const key = queryKey()
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const rendered = render(ErrorBoundary, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => Promise.reject(new Error('Local Error')),
          getNextPageParam: () => undefined,
          initialPageParam: 0,
          retry: false,
          throwOnError: (err: Error) => err.message === 'Local Error',
        }),
      },
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('error-boundary')).toHaveTextContent(
      'Local Error',
    )

    consoleMock.mockRestore()
  })

  it('should not throw to the nearest svelte:boundary when throwOnError function returns false', async () => {
    const key = queryKey()

    const rendered = render(ErrorBoundary, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => Promise.reject(new Error('Local Error')),
          getNextPageParam: () => undefined,
          initialPageParam: 0,
          retry: false,
          throwOnError: (err: Error) => err.message !== 'Local Error',
        }),
      },
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.queryByTestId('error-boundary')).not.toBeInTheDocument()
    expect(rendered.getByTestId('status')).toHaveTextContent('error')
  })

  it('should throw error to the nearest svelte:boundary when queryFn rejects with a falsy error and throwOnError is in use', async () => {
    const key = queryKey()
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const rendered = render(ErrorBoundary, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => Promise.reject(),
          getNextPageParam: () => undefined,
          initialPageParam: 0,
          retry: false,
          throwOnError: true,
        }),
      },
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('error-boundary')).toBeInTheDocument()

    consoleMock.mockRestore()
  })
})
