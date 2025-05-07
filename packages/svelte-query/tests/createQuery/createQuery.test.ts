import { describe, expect, test } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/svelte'
import { derived, get, writable } from 'svelte/store'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import BaseExample from './BaseExample.svelte'
import DisabledExample from './DisabledExample.svelte'
import PlaceholderData from './PlaceholderData.svelte'
import RefetchExample from './RefetchExample.svelte'
import type { Writable } from 'svelte/store'
import type { QueryObserverResult } from '@tanstack/query-core'

describe('createQuery', () => {
  test('Return the correct states for a successful query', async () => {
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])

    const options = {
      queryKey: ['test'],
      queryFn: async () => {
        await sleep(5)
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
      expect(rendered.queryByText('Status: success')).toBeInTheDocument()
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
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])

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
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])

    const optionsStore = writable({
      queryKey: ['test'],
      queryFn: async () => {
        await sleep(5)
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
      expect(rendered.queryByText('Status: success')).toBeInTheDocument()
    })
  })

  test('Accept a derived store for options', async () => {
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])

    const writableStore = writable('test')

    const derivedStore = derived(writableStore, ($store) => ({
      queryKey: [$store],
      queryFn: async () => {
        await sleep(5)
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
      expect(rendered.queryByText('Status: success')).toBeInTheDocument()
    })
  })

  test('Ensure reactivity when queryClient defaults are set', async () => {
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])

    const writableStore = writable(1)

    const derivedStore = derived(writableStore, ($store) => ({
      queryKey: [$store],
      queryFn: async () => {
        await sleep(5)
        return $store
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
      expect(rendered.queryByText('Data: 1')).toBeInTheDocument()
      expect(rendered.queryByText('Data: 2')).not.toBeInTheDocument()
    })

    writableStore.set(2)

    await waitFor(() => {
      expect(rendered.queryByText('Data: 1')).not.toBeInTheDocument()
      expect(rendered.queryByText('Data: 2')).toBeInTheDocument()
    })

    writableStore.set(1)

    await waitFor(() => {
      expect(rendered.queryByText('Data: 1')).toBeInTheDocument()
      expect(rendered.queryByText('Data: 2')).not.toBeInTheDocument()
    })
  })

  test('Keep previous data when placeholderData is set', async () => {
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])

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
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])

    const rendered = render(DisabledExample, {
      props: {
        states: statesStore,
      },
    })

    await waitFor(() => rendered.getByText('Data: 0'))

    fireEvent.click(rendered.getByRole('button', { name: /Increment/i }))

    await waitFor(() => {
      rendered.getByText('Count: 1')
      rendered.getByText('Data: undefined')
    })

    const states = get(statesStore)

    expect(states).toHaveLength(3)

    // Fetch query
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isSuccess: false,
    })

    // Fetched query
    expect(states[1]).toMatchObject({
      data: 0,
      isFetching: false,
      isSuccess: true,
    })

    // Switch to disabled query
    expect(states[2]).toMatchObject({
      data: undefined,
      isFetching: false,
      isSuccess: false,
    })
  })

  test('Create a new query when refetching a removed query', async () => {
    const statesStore: Writable<Array<QueryObserverResult>> = writable([])

    const rendered = render(RefetchExample, {
      props: {
        states: statesStore,
      },
    })

    await waitFor(() => rendered.getByText('Data: 1'))
    fireEvent.click(rendered.getByRole('button', { name: /Remove/i }))

    await sleep(5)

    fireEvent.click(rendered.getByRole('button', { name: /Refetch/i }))
    await waitFor(() => rendered.getByText('Data: 2'))

    const states = get(statesStore)

    expect(states.length).toBe(4)
    // Initial
    expect(states[0]).toMatchObject({ data: undefined, dataUpdatedAt: 0 })
    // Fetched
    expect(states[1]).toMatchObject({ data: 1 })
    // Switch
    expect(states[2]).toMatchObject({ data: undefined, dataUpdatedAt: 0 })
    // Fetched
    expect(states[3]).toMatchObject({ data: 2 })
  })
})
