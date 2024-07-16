import { describe, expect, test } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/svelte'
import { derived, get, writable } from 'svelte/store'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from '../utils'
import BaseExample from './BaseExample.svelte'
import DisabledExample from './DisabledExample.svelte'
import PlaceholderData from './PlaceholderData.svelte'

describe('createQuery', () => {
  test('Return the correct states for a successful query', async () => {
    const statesStore = writable([])

    const options = {
      queryKey: ['test'],
      queryFn: async () => {
        await sleep(10)
        return 'Success'
      },
    }

    const rendered = render(BaseExample, {
      props: {
        options,
        queryClient: new QueryClient(),
        states: statesStore,
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success')).toBeInTheDocument()
    })

    const states = get(statesStore)

    expect(states).toHaveLength(2)

    expect(states[0]).toMatchObject({
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
      refetch: expect.any(Function),
      status: 'pending',
      fetchStatus: 'fetching',
    })

    expect(states[1]).toMatchObject({
      data: 'Success',
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
      refetch: expect.any(Function),
      status: 'success',
      fetchStatus: 'idle',
    })
  })

  test('Return the correct states for an unsuccessful query', async () => {
    const statesStore = writable([])

    const options = {
      queryKey: ['test'],
      queryFn: async () => Promise.reject(new Error('Rejected')),
      retry: 1,
      retryDelay: 1,
    }

    const rendered = render(BaseExample, {
      props: {
        options,
        queryClient: new QueryClient(),
        states: statesStore,
      },
    })

    await waitFor(() => rendered.getByText('Status: error'))

    const states = get(statesStore)

    expect(states).toHaveLength(3)

    expect(states[0]).toMatchObject({
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
      refetch: expect.any(Function),
      status: 'pending',
      fetchStatus: 'fetching',
    })

    expect(states[1]).toMatchObject({
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 1,
      failureReason: new Error('Rejected'),
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
      refetch: expect.any(Function),
      status: 'pending',
      fetchStatus: 'fetching',
    })

    expect(states[2]).toMatchObject({
      data: undefined,
      dataUpdatedAt: 0,
      error: new Error('Rejected'),
      errorUpdatedAt: expect.any(Number),
      failureCount: 2,
      failureReason: new Error('Rejected'),
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
      refetch: expect.any(Function),
      status: 'error',
      fetchStatus: 'idle',
    })
  })

  test('Accept a writable store for options', async () => {
    const statesStore = writable([])

    const optionsStore = writable({
      queryKey: ['test'],
      queryFn: async () => {
        await sleep(10)
        return 'Success'
      },
    })

    const rendered = render(BaseExample, {
      props: {
        options: optionsStore,
        queryClient: new QueryClient(),
        states: statesStore,
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success')).toBeInTheDocument()
    })
  })

  test('Accept a derived store for options', async () => {
    const statesStore = writable([])

    const writableStore = writable('test')

    const derivedStore = derived(writableStore, ($store) => ({
      queryKey: [$store],
      queryFn: async () => {
        await sleep(10)
        return 'Success'
      },
    }))

    const rendered = render(BaseExample, {
      props: {
        options: derivedStore,
        queryClient: new QueryClient(),
        states: statesStore,
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success')).toBeInTheDocument()
    })
  })

  test('Ensure reactivity when queryClient defaults are set', async () => {
    const statesStore = writable([])

    const writableStore = writable(1)

    const derivedStore = derived(writableStore, ($store) => ({
      queryKey: [$store],
      queryFn: async () => {
        await sleep(10)
        return `Success ${$store}`
      },
    }))

    const rendered = render(BaseExample, {
      props: {
        options: derivedStore,
        queryClient: new QueryClient({
          defaultOptions: { queries: { staleTime: 60 * 1000 } },
        }),
        states: statesStore,
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).not.toBeInTheDocument()
    })

    writableStore.set(2)

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).not.toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).toBeInTheDocument()
    })

    writableStore.set(1)

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).not.toBeInTheDocument()
    })
  })

  test('Keep previous data when placeholderData is set', async () => {
    const statesStore = writable([])

    const rendered = render(PlaceholderData, {
      props: {
        queryClient: new QueryClient(),
        states: statesStore,
      },
    })

    await waitFor(() => rendered.getByText('Data: 0'))

    fireEvent.click(rendered.getByRole('button', { name: 'setCount' }))

    await waitFor(() => rendered.getByText('Data: 1'))

    const states = get(statesStore)

    expect(states).toHaveLength(4)

    // Initial
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isSuccess: false,
      isPlaceholderData: false,
    })
    // Fetched
    expect(states[1]).toMatchObject({
      data: 0,
      isFetching: false,
      isSuccess: true,
      isPlaceholderData: false,
    })
    // Set state
    expect(states[2]).toMatchObject({
      data: 0,
      isFetching: true,
      isSuccess: true,
      isPlaceholderData: true,
    })
    // New data
    expect(states[3]).toMatchObject({
      data: 1,
      isFetching: false,
      isSuccess: true,
      isPlaceholderData: false,
    })
  })

  test('Should not fetch when switching to a disabled query', async () => {
    const rendered = render(DisabledExample)

    await waitFor(() => rendered.getByText('Data: 0'))

    fireEvent.click(rendered.getByRole('button', { name: /Increment/i }))

    await waitFor(() => {
      rendered.getByText('Count: 1')
      rendered.getByText('Data: undefined')
    })
  })
})
