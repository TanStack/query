import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync } from 'svelte'
import { fireEvent, render } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { createMutation } from '../../src/index.js'
import { withEffectRoot } from '../utils.svelte.js'
import Reset from './Reset.svelte'
import Success from './Success.svelte'
import Failure from './Failure.svelte'
import OptimisticUpdate from './OptimisticUpdate.svelte'

describe('createMutation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should be able to reset `error`', async () => {
    const rendered = render(Reset, {
      props: { queryClient },
    })

    expect(rendered.queryByText('Error: undefined')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Error: Expected mock error')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Reset/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Error: undefined')).toBeInTheDocument()
  })

  it('should be able to call `onSuccess` and `onSettled` after each successful mutate', async () => {
    const onSuccessMock = vi.fn()
    const onSettledMock = vi.fn()

    const rendered = render(Success, {
      props: {
        queryClient,
        onSuccessMock,
        onSettledMock,
      },
    })

    expect(rendered.queryByText('Count: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.queryByText('Count: 3')).toBeInTheDocument()

    expect(onSuccessMock).toHaveBeenCalledTimes(3)
    expect(onSuccessMock).toHaveBeenNthCalledWith(1, 1)
    expect(onSuccessMock).toHaveBeenNthCalledWith(2, 2)
    expect(onSuccessMock).toHaveBeenNthCalledWith(3, 3)

    expect(onSettledMock).toHaveBeenCalledTimes(3)
    expect(onSettledMock).toHaveBeenNthCalledWith(1, 1)
    expect(onSettledMock).toHaveBeenNthCalledWith(2, 2)
    expect(onSettledMock).toHaveBeenNthCalledWith(3, 3)
  })

  it('should set correct values for `failureReason` and `failureCount` on multiple mutate calls', async () => {
    type Value = { count: number }

    const mutationFn = vi.fn<(value: Value) => Promise<Value>>()

    mutationFn.mockImplementationOnce(() =>
      sleep(20).then(() => Promise.reject(`Expected mock error`)),
    )

    mutationFn.mockImplementation((value) => sleep(10).then(() => value))

    const rendered = render(Failure, {
      props: {
        queryClient,
        mutationFn,
      },
    })

    expect(rendered.queryByText('Data: undefined')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    expect(rendered.getByText('Data: undefined')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(21)
    expect(rendered.getByText('Status: error')).toBeInTheDocument()
    expect(rendered.getByText('Failure Count: 1')).toBeInTheDocument()
    expect(
      rendered.getByText('Failure Reason: Expected mock error'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Status: pending')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Status: success')).toBeInTheDocument()
    expect(rendered.getByText('Data: 2')).toBeInTheDocument()
    expect(rendered.getByText('Failure Count: 0')).toBeInTheDocument()
    expect(rendered.getByText('Failure Reason: undefined')).toBeInTheDocument()
  })

  it(
    'should recreate observer when queryClient changes',
    withEffectRoot(async () => {
      const queryClient1 = new QueryClient()
      const queryClient2 = new QueryClient()

      let activeClient = $state(queryClient1)

      const mutation = createMutation(
        () => ({
          mutationFn: (params: string) => sleep(10).then(() => params),
        }),
        () => activeClient,
      )

      mutation.mutate('first')
      await vi.advanceTimersByTimeAsync(11)

      expect(mutation.status).toBe('success')
      expect(mutation.data).toBe('first')

      activeClient = queryClient2
      flushSync()

      expect(mutation.status).toBe('idle')
      expect(mutation.data).toBeUndefined()
    }),
  )

  it('should update the cache in onMutate and roll back via onMutateResult in onError', async () => {
    const key = queryKey()
    queryClient.setQueryData<Array<string>>(key, ['Todo 1'])

    const rendered = render(OptimisticUpdate, {
      props: { queryClient, queryKey: key, shouldSucceed: false },
    })

    fireEvent.click(rendered.getByRole('button', { name: /add/i }))
    // The optimistic value lands after onMutate's first await, so flush
    // microtasks before asserting.
    await vi.advanceTimersByTimeAsync(0)

    expect(queryClient.getQueryData(key)).toEqual(['Todo 1', 'Todo 2'])

    await vi.advanceTimersByTimeAsync(11)

    expect(queryClient.getQueryData(key)).toEqual(['Todo 1'])
  })

  it('should keep the optimistic update in place when the mutation succeeds', async () => {
    const key = queryKey()
    queryClient.setQueryData<Array<string>>(key, ['Todo 1'])

    const rendered = render(OptimisticUpdate, {
      props: { queryClient, queryKey: key, shouldSucceed: true },
    })

    fireEvent.click(rendered.getByRole('button', { name: /add/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(queryClient.getQueryData(key)).toEqual(['Todo 1', 'Todo 2'])
  })
})
