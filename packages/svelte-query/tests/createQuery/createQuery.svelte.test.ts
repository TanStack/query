import { describe, expect, test } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import { ref, sleep } from '../utils.svelte.js'
import BaseExample from './BaseExample.svelte'
import DisabledExample from './DisabledExample.svelte'
import PlaceholderData from './PlaceholderData.svelte'
import RefetchExample from './RefetchExample.svelte'
import type { QueryObserverResult } from '@tanstack/query-core'

describe('createQuery', () => {
  test('Return the correct states for a successful query', async () => {
    let states = ref<Array<QueryObserverResult>>([])

    const options = {
      queryKey: ['test'],
      queryFn: async () => {
        await sleep(5)
        return 'Success'
      },
    }

    const rendered = render(BaseExample, {
      props: {
        options: () => options,
        queryClient: new QueryClient(),
        states,
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Status: success')).toBeInTheDocument()
    })

    expect(states.value).toHaveLength(2)

    expect(states.value[0]).toMatchObject({
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

    expect(states.value[1]).toMatchObject({
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
    let states = ref<Array<QueryObserverResult>>([])

    const options = {
      queryKey: ['test'],
      queryFn: async () => Promise.reject(new Error('Rejected')),
      retry: 1,
      retryDelay: 1,
    }

    const rendered = render(BaseExample, {
      props: {
        options: () => options,
        queryClient: new QueryClient(),
        states,
      },
    })

    await waitFor(() => rendered.getByText('Status: error'))

    expect(states.value).toHaveLength(3)

    expect(states.value[0]).toMatchObject({
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

    expect(states.value[1]).toMatchObject({
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

    expect(states.value[2]).toMatchObject({
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
    let states = ref<Array<QueryObserverResult>>([])

    const optionsStore = $state(() => ({
      queryKey: ['test'],
      queryFn: async () => {
        await sleep(5)
        return 'Success'
      },
    }))

    const rendered = render(BaseExample, {
      props: {
        options: optionsStore,
        queryClient: new QueryClient(),
        states,
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Status: success')).toBeInTheDocument()
    })
  })

  test('Accept a derived store for options', async () => {
    let states = ref<Array<QueryObserverResult>>([])

    const writableStore = $state('test')

    const derivedStore = $derived(() => ({
      queryKey: [writableStore],
      queryFn: async () => {
        await sleep(5)
        return 'Success'
      },
    }))

    const rendered = render(BaseExample, {
      props: {
        options: derivedStore,
        queryClient: new QueryClient(),
        states,
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Status: success')).toBeInTheDocument()
    })
  })

  test('Ensure reactivity when queryClient defaults are set', async () => {
    let states = ref<Array<QueryObserverResult>>([])

    let writableStore = $state(1)

    const derivedStore = $derived(() => ({
      queryKey: [writableStore],
      queryFn: async () => {
        await sleep(5)
        return writableStore
      },
    }))

    const rendered = render(BaseExample, {
      props: {
        options: derivedStore,
        queryClient: new QueryClient({
          defaultOptions: { queries: { staleTime: 60 * 1000 } },
        }),
        states,
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Data: 1')).toBeInTheDocument()
      expect(rendered.queryByText('Data: 2')).not.toBeInTheDocument()
    })

    writableStore = 2

    await waitFor(() => {
      expect(rendered.queryByText('Data: 1')).not.toBeInTheDocument()
      expect(rendered.queryByText('Data: 2')).toBeInTheDocument()
    })

    writableStore = 1

    await waitFor(() => {
      expect(rendered.queryByText('Data: 1')).toBeInTheDocument()
      expect(rendered.queryByText('Data: 2')).not.toBeInTheDocument()
    })
  })

  test('Keep previous data when placeholderData is set', async () => {
    let states = ref<Array<QueryObserverResult>>([])

    const rendered = render(PlaceholderData, {
      props: {
        queryClient: new QueryClient(),
        states,
      },
    })

    await waitFor(() => rendered.getByText('Data: 0'))

    fireEvent.click(rendered.getByRole('button', { name: 'setCount' }))

    await waitFor(() => rendered.getByText('Data: 1'))

    expect(states.value).toHaveLength(4)

    // Initial
    expect(states.value[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isSuccess: false,
      isPlaceholderData: false,
    })

    // Fetched
    expect(states.value[1]).toMatchObject({
      data: 0,
      isFetching: false,
      isSuccess: true,
      isPlaceholderData: false,
    })

    // Set state
    expect(states.value[2]).toMatchObject({
      data: 0,
      isFetching: true,
      isSuccess: true,
      isPlaceholderData: true,
    })

    // New data
    expect(states.value[3]).toMatchObject({
      data: 1,
      isFetching: false,
      isSuccess: true,
      isPlaceholderData: false,
    })
  })

  test('Should not fetch when switching to a disabled query', async () => {
    let states = ref<Array<QueryObserverResult>>([])

    const rendered = render(DisabledExample, {
      props: {
        states,
      },
    })

    await waitFor(() => rendered.getByText('Data: 0'))

    fireEvent.click(rendered.getByRole('button', { name: /Increment/i }))

    await waitFor(() => {
      rendered.getByText('Count: 0')
      rendered.getByText('Data: 0')
    })

    expect(states.value).toHaveLength(3)

    // Fetch query
    expect(states.value[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isSuccess: false,
    })

    // Fetched query
    expect(states.value[1]).toMatchObject({
      data: 0,
      isFetching: false,
      isSuccess: true,
    })

    // Switch to disabled query
    expect(states.value[2]).toMatchObject({
      data: undefined,
      isFetching: false,
      isSuccess: false,
    })
  })

  test('Create a new query when refetching a removed query', async () => {
    let states = ref<Array<QueryObserverResult>>([])

    const rendered = render(RefetchExample, {
      props: {
        states,
      },
    })

    await waitFor(() => rendered.getByText('Data: 1'))
    fireEvent.click(rendered.getByRole('button', { name: /Remove/i }))

    await sleep(5)

    fireEvent.click(rendered.getByRole('button', { name: /Refetch/i }))
    await waitFor(() => rendered.getByText('Data: 2'))

    expect(states.value).toHaveLength(4)
    // Initial
    expect(states.value[0]).toMatchObject({ data: undefined, dataUpdatedAt: 0 })
    // Fetched
    expect(states.value[1]).toMatchObject({ data: 1 })
    // Switch
    expect(states.value[2]).toMatchObject({ data: undefined, dataUpdatedAt: 0 })
    // Fetched
    expect(states.value[3]).toMatchObject({ data: 2 })
  })
})
