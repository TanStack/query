import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync } from 'svelte'
import { fireEvent, render } from '@testing-library/svelte'
import { QueryClient, noop } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { createMutation } from '../../src/index.js'
import { withEffectRoot } from '../utils.svelte.js'
import Reset from './Reset.svelte'
import Success from './Success.svelte'
import Failure from './Failure.svelte'
import OptimisticUpdate from './OptimisticUpdate.svelte'
import SuccessContext from './SuccessContext.svelte'
import InvalidateFromContext from './InvalidateFromContext.svelte'
import PerCallSuccess from './PerCallSuccess.svelte'
import MutationFnContext from './MutationFnContext.svelte'
import ParallelMutateAsync from './ParallelMutateAsync.svelte'
import ConcurrentMutate from './ConcurrentMutate.svelte'

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

  it(
    'should call mutate callbacks when createMutation has no callbacks',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (text: string) => sleep(10).then(() => text),
        }),
        () => queryClient,
      )

      mutation.mutate('todo', {
        onSuccess: () => callbacks.push('mutate.onSuccess'),
        onSettled: () => callbacks.push('mutate.onSettled'),
      })
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual(['mutate.onSuccess', 'mutate.onSettled'])
    }),
  )

  it(
    'should call mutate error callbacks when createMutation has no callbacks',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (_text: string) =>
            sleep(10).then(() => Promise.reject(new Error('oops'))),
        }),
        () => queryClient,
      )

      mutation.mutate('todo', {
        onError: () => callbacks.push('mutate.onError'),
        onSettled: () => callbacks.push('mutate.onSettled'),
      })
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual(['mutate.onError', 'mutate.onSettled'])
    }),
  )

  it(
    'should call only mutate onSuccess when createMutation has no callbacks',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (text: string) => sleep(10).then(() => text),
        }),
        () => queryClient,
      )

      mutation.mutate('todo', {
        onSuccess: () => callbacks.push('mutate.onSuccess'),
      })
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual(['mutate.onSuccess'])
    }),
  )

  it(
    'should call only mutate onError when createMutation has no callbacks',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (_text: string) =>
            sleep(10).then(() => Promise.reject(new Error('oops'))),
        }),
        () => queryClient,
      )

      mutation.mutate('todo', {
        onError: () => callbacks.push('mutate.onError'),
      })
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual(['mutate.onError'])
    }),
  )

  it(
    'should call only mutate onSettled when createMutation has no callbacks',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (text: string) => sleep(10).then(() => text),
        }),
        () => queryClient,
      )

      mutation.mutate('todo', {
        onSettled: () => callbacks.push('mutate.onSettled'),
      })
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual(['mutate.onSettled'])
    }),
  )

  it(
    'should call mutateAsync callbacks when createMutation has no callbacks',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (text: string) => sleep(10).then(() => text),
        }),
        () => queryClient,
      )

      mutation.mutateAsync('todo', {
        onSuccess: () => callbacks.push('mutateAsync.onSuccess'),
        onSettled: () => callbacks.push('mutateAsync.onSettled'),
      })
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual([
        'mutateAsync.onSuccess',
        'mutateAsync.onSettled',
      ])
    }),
  )

  it(
    'should call mutateAsync error callbacks when createMutation has no callbacks',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (_text: string) =>
            sleep(10).then(() => Promise.reject(new Error('oops'))),
        }),
        () => queryClient,
      )

      mutation
        .mutateAsync('todo', {
          onError: () => callbacks.push('mutateAsync.onError'),
          onSettled: () => callbacks.push('mutateAsync.onSettled'),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual([
        'mutateAsync.onError',
        'mutateAsync.onSettled',
      ])
    }),
  )

  it(
    'should call only mutateAsync onSuccess when createMutation has no callbacks',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (text: string) => sleep(10).then(() => text),
        }),
        () => queryClient,
      )

      mutation.mutateAsync('todo', {
        onSuccess: () => callbacks.push('mutateAsync.onSuccess'),
      })
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual(['mutateAsync.onSuccess'])
    }),
  )

  it(
    'should call only mutateAsync onError when createMutation has no callbacks',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (_text: string) =>
            sleep(10).then(() => Promise.reject(new Error('oops'))),
        }),
        () => queryClient,
      )

      mutation
        .mutateAsync('todo', {
          onError: () => callbacks.push('mutateAsync.onError'),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual(['mutateAsync.onError'])
    }),
  )

  it(
    'should call only mutateAsync onSettled when createMutation has no callbacks',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (text: string) => sleep(10).then(() => text),
        }),
        () => queryClient,
      )

      mutation.mutateAsync('todo', {
        onSettled: () => callbacks.push('mutateAsync.onSettled'),
      })
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual(['mutateAsync.onSettled'])
    }),
  )

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
    'should be able to call `onSuccess` callback after successful mutateAsync',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (text: string) => sleep(10).then(() => text),
          onSuccess: () => callbacks.push('useMutation.onSuccess'),
        }),
        () => queryClient,
      )

      mutation.mutateAsync('todo', {
        onSuccess: () => callbacks.push('mutateAsync.onSuccess'),
      })
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual([
        'useMutation.onSuccess',
        'mutateAsync.onSuccess',
      ])
    }),
  )

  it(
    'should be able to call `onError` callback after failed mutateAsync',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (_text: string) =>
            sleep(10).then(() => Promise.reject(new Error('oops'))),
          onError: () => callbacks.push('useMutation.onError'),
        }),
        () => queryClient,
      )

      mutation
        .mutateAsync('todo', {
          onError: () => callbacks.push('mutateAsync.onError'),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual(['useMutation.onError', 'mutateAsync.onError'])
    }),
  )

  it(
    'should be able to call `onSettled` callback after mutateAsync',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (text: string) => sleep(10).then(() => text),
          onSettled: () => callbacks.push('useMutation.onSettled'),
        }),
        () => queryClient,
      )

      mutation.mutateAsync('todo', {
        onSettled: () => callbacks.push('mutateAsync.onSettled'),
      })
      await vi.advanceTimersByTimeAsync(10)

      expect(callbacks).toEqual([
        'useMutation.onSettled',
        'mutateAsync.onSettled',
      ])
    }),
  )

  it(
    'should be able to override the useMutation success callbacks',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (text: string) => sleep(10).then(() => text),
          onSuccess: () =>
            sleep(10).then(() => callbacks.push('useMutation.onSuccess')),
          onSettled: () =>
            sleep(10).then(() => callbacks.push('useMutation.onSettled')),
        }),
        () => queryClient,
      )

      mutation
        .mutateAsync('todo', {
          onSuccess: () => callbacks.push('mutateAsync.onSuccess'),
          onSettled: () => callbacks.push('mutateAsync.onSettled'),
        })
        .then((result) => callbacks.push(`mutateAsync.result:${result}`))
      await vi.advanceTimersByTimeAsync(30)

      expect(callbacks).toEqual([
        'useMutation.onSuccess',
        'useMutation.onSettled',
        'mutateAsync.onSuccess',
        'mutateAsync.onSettled',
        'mutateAsync.result:todo',
      ])
    }),
  )

  it(
    'should be able to override the error callbacks when using mutateAsync',
    withEffectRoot(async () => {
      const callbacks: Array<string> = []

      const mutation = createMutation(
        () => ({
          mutationFn: (_text: string) =>
            sleep(10).then(() => Promise.reject(new Error('oops'))),
          onError: () =>
            sleep(10).then(() => callbacks.push('useMutation.onError')),
          onSettled: () =>
            sleep(10).then(() => callbacks.push('useMutation.onSettled')),
        }),
        () => queryClient,
      )

      mutation
        .mutateAsync('todo', {
          onError: () => callbacks.push('mutateAsync.onError'),
          onSettled: () => callbacks.push('mutateAsync.onSettled'),
        })
        .catch((error) =>
          callbacks.push(`mutateAsync.error:${(error as Error).message}`),
        )
      await vi.advanceTimersByTimeAsync(30)

      expect(callbacks).toEqual([
        'useMutation.onError',
        'useMutation.onSettled',
        'mutateAsync.onError',
        'mutateAsync.onSettled',
        'mutateAsync.error:oops',
      ])
    }),
  )

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

  it('should pass a non-undefined onMutateResult alongside context to onSuccess', async () => {
    const onSuccessMock = vi.fn()

    const rendered = render(SuccessContext, {
      props: { queryClient, onSuccessMock },
    })

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(onSuccessMock).toHaveBeenCalledTimes(1)
    const [data, variables, onMutateResult, context] =
      onSuccessMock.mock.calls[0]!
    expect(data).toBe('TODO')
    expect(variables).toBe('todo')
    expect(onMutateResult).toEqual({ startedWith: 'todo' })
    expect(context.client).toBe(queryClient)
    expect(context.meta).toBeUndefined()
    expect(context.mutationKey).toBeUndefined()
  })

  it('should include mutationKey in the context passed to hook-level callbacks', async () => {
    const onSuccessMock = vi.fn()

    const rendered = render(SuccessContext, {
      props: { queryClient, mutationKey: ['todos', 'add'], onSuccessMock },
    })

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(onSuccessMock).toHaveBeenCalledTimes(1)
    expect(onSuccessMock.mock.calls[0]?.[3].mutationKey).toEqual([
      'todos',
      'add',
    ])
  })

  it('should give mutationFn the same QueryClient instance via context', async () => {
    const key = queryKey()
    queryClient.setQueryData(key, 'tag-from-this-client')

    const rendered = render(MutationFnContext, {
      props: { queryClient, queryKey: key },
    })

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByText('data: tag-from-this-client')).toBeInTheDocument()
  })

  it('should let onSuccess invalidate queries via context.client without a useQueryClient() closure', async () => {
    const key = queryKey()
    queryClient.setQueryData(key, 'data')

    const rendered = render(InvalidateFromContext, {
      props: { queryClient, queryKey: key },
    })

    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })

  it('should give a per-call onSuccess the same QueryClient instance via context', async () => {
    const perCallOnSuccess = vi.fn()

    const rendered = render(PerCallSuccess, {
      props: { queryClient, perCallOnSuccess },
    })

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(perCallOnSuccess).toHaveBeenCalledTimes(1)
    expect(perCallOnSuccess.mock.calls[0]?.[3].client).toBe(queryClient)
  })

  it('should be able to run multiple mutateAsync calls in parallel with Promise.all', async () => {
    const rendered = render(ParallelMutateAsync, {
      props: { queryClient, strategy: 'all' },
    })

    fireEvent.click(rendered.getByRole('button', { name: /upload all/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText(
        'result: uploaded: file1, uploaded: file2, uploaded: file3',
      ),
    ).toBeInTheDocument()
  })

  it('should handle Promise.all rejection when one parallel mutateAsync call fails', async () => {
    const rendered = render(ParallelMutateAsync, {
      props: { queryClient, strategy: 'all', failOn: 'file2' },
    })

    fireEvent.click(rendered.getByRole('button', { name: /upload all/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText('result: error: upload failed'),
    ).toBeInTheDocument()
  })

  it('should handle partial failure in parallel mutateAsync calls with Promise.allSettled', async () => {
    const rendered = render(ParallelMutateAsync, {
      props: { queryClient, strategy: 'allSettled', failOn: 'file2' },
    })

    fireEvent.click(rendered.getByRole('button', { name: /upload all/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText(
        'result: uploaded: file1, error: upload failed, uploaded: file3',
      ),
    ).toBeInTheDocument()
  })

  it('should only fire the per-call onSuccess for the last mutate() call', async () => {
    const onSuccessPerCall = vi.fn()

    const rendered = render(ConcurrentMutate, {
      props: { queryClient, onSuccessPerCall },
    })

    expect(rendered.getByText('data: null, status: idle')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))

    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText('data: Todo 2, status: success'),
    ).toBeInTheDocument()

    expect(onSuccessPerCall).toHaveBeenCalledTimes(1)
    expect(onSuccessPerCall).toHaveBeenCalledWith(
      'Todo 2',
      'Todo 2',
      undefined,
      expect.anything(),
    )
  })
})
