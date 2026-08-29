// Ported to the 2.0 mutation contract: one `mutate(variables)` returning a
// safe-to-ignore Promise<TData>, no `mutateAsync`, no call-site callbacks,
// no onMutate context threading (the context PARAMETER passed to
// onSuccess/onError/onSettled is always undefined). See
// useMutation-semantics.test.tsx for the canonical patterns and
// port-notes/useMutation.md for what was deleted and why.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Errored,
  createRenderEffect,
  createSignal,
  createTrackedEffect,
} from 'solid-js'
import { fireEvent, render } from '@solidjs/testing-library'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { MutationCache, QueryCache, QueryClient, useMutation } from '..'
import {
  mockOnlineManagerIsOnline,
  renderWithClient,
  setActTimeout,
} from './utils'

describe('useMutation', () => {
  let queryCache: QueryCache
  let mutationCache: MutationCache
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    mutationCache = new MutationCache()
    queryClient = new QueryClient({ queryCache, mutationCache })
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should be able to reset `data`', async () => {
    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: () => Promise.resolve('mutation'),
      }))

      return (
        <div>
          <h1>{mutation.data ?? 'empty'}</h1>
          <button onClick={() => mutation.reset()}>reset</button>
          <button onClick={() => mutation.mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByRole('heading').textContent).toBe('empty')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByRole('heading').textContent).toBe('mutation')

    fireEvent.click(rendered.getByRole('button', { name: /reset/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByRole('heading').textContent).toBe('empty')
  })

  it('should be able to reset `error`', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const mutation = useMutation<string, Error>(() => ({
        mutationFn: () => {
          const err = new Error('Expected mock error. All is well!')
          err.stack = ''
          return Promise.reject(err)
        },
      }))

      return (
        <div>
          {mutation.error && <h1>{mutation.error.message}</h1>}
          <button onClick={() => mutation.reset()}>reset</button>
          <button onClick={() => mutation.mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.queryByRole('heading')).toBeNull()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByRole('heading').textContent).toBe(
      'Expected mock error. All is well!',
    )

    fireEvent.click(rendered.getByRole('button', { name: /reset/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.queryByRole('heading')).toBeNull()

    consoleMock.mockRestore()
  })

  it('should not emit a strict-read diagnostic on mount', () => {
    const consoleMock = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: () => Promise.resolve('mutation'),
      }))

      return <button disabled={mutation.isPending}>mutate</button>
    }

    renderWithClient(queryClient, () => <Page />)

    expect(
      consoleMock.mock.calls.filter((args) =>
        args.some((arg) => String(arg).includes('STRICT_READ_UNTRACKED')),
      ),
    ).toEqual([])

    consoleMock.mockRestore()
  })

  it('should be able to call `onSuccess` and `onSettled` after each successful mutate', async () => {
    let countRef = 0
    const [count, setCount] = createSignal(0)
    const onSuccessMock = vi.fn()
    const onSettledMock = vi.fn()

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (vars: { count: number }) => Promise.resolve(vars.count),
        onSuccess: (data) => {
          onSuccessMock(data)
        },
        onSettled: (data) => {
          onSettledMock(data)
        },
      }))

      return (
        <div>
          <h1>{count()}</h1>
          <button
            onClick={() => {
              countRef++
              setCount(countRef)
              return mutation.mutate({ count: countRef })
            }}
          >
            mutate
          </button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByRole('heading').textContent).toBe('0')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByRole('heading').textContent).toBe('3')

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
    const [count, setCount] = createSignal(0)
    type Value = { count: number }

    const mutateFn = vi.fn<(value: Value) => Promise<Value>>()

    mutateFn.mockImplementationOnce(() =>
      Promise.reject(new Error('Error test Jonas')),
    )

    mutateFn.mockImplementation((value) => sleep(10).then(() => value))

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: mutateFn,
      }))

      return (
        <div>
          <h1>Data {mutation.data?.count}</h1>
          <h2>Status {mutation.status}</h2>
          <h2>Failed {mutation.failureCount} times</h2>
          <h2>Failed because {mutation.failureReason?.message ?? 'null'}</h2>
          <button
            onClick={() => {
              const newCount = count() + 1
              setCount(newCount)
              return mutation.mutate({ count: newCount })
            }}
          >
            mutate
          </button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('Data')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    expect(rendered.getByText('Data')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Status error')).toBeInTheDocument()
    expect(rendered.getByText('Failed 1 times')).toBeInTheDocument()
    expect(
      rendered.getByText('Failed because Error test Jonas'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Status pending')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Status success')).toBeInTheDocument()
    expect(rendered.getByText('Data 2')).toBeInTheDocument()
    expect(rendered.getByText('Failed 0 times')).toBeInTheDocument()
    expect(rendered.getByText('Failed because null')).toBeInTheDocument()
  })

  it('should be able to call `onError` and `onSettled` after each failed mutate', async () => {
    const onErrorMock = vi.fn()
    const onSettledMock = vi.fn()
    let countRef = 0
    const [count, setCount] = createSignal(0)

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (vars: { count: number }) => {
          const error = new Error(
            `Expected mock error. All is well! ${vars.count}`,
          )
          error.stack = ''
          return Promise.reject(error)
        },
        onError: (error: Error) => {
          onErrorMock(error.message)
        },
        onSettled: (_data, error) => {
          onSettledMock(error?.message)
        },
      }))

      return (
        <div>
          <h1>{count()}</h1>
          <button
            onClick={() => {
              countRef++
              setCount(countRef)
              return mutation.mutate({ count: countRef })
            }}
          >
            mutate
          </button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByRole('heading').textContent).toBe('0')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByRole('heading').textContent).toBe('3')

    expect(onErrorMock).toHaveBeenCalledTimes(3)
    expect(onErrorMock).toHaveBeenNthCalledWith(
      1,
      'Expected mock error. All is well! 1',
    )
    expect(onErrorMock).toHaveBeenNthCalledWith(
      2,
      'Expected mock error. All is well! 2',
    )
    expect(onErrorMock).toHaveBeenNthCalledWith(
      3,
      'Expected mock error. All is well! 3',
    )

    expect(onSettledMock).toHaveBeenCalledTimes(3)
    expect(onSettledMock).toHaveBeenNthCalledWith(
      1,
      'Expected mock error. All is well! 1',
    )
    expect(onSettledMock).toHaveBeenNthCalledWith(
      2,
      'Expected mock error. All is well! 2',
    )
    expect(onSettledMock).toHaveBeenNthCalledWith(
      3,
      'Expected mock error. All is well! 3',
    )
  })

  // Ported from 'should be able to override the useMutation success
  // callbacks': call-site callbacks are gone; the portable behavior is that
  // options-level callbacks run before the awaited mutate promise resolves
  // with the result.
  it('should run success callbacks before the awaited mutate promise resolves', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (text: string) => sleep(10).then(() => text),
        onSuccess: () => {
          callbacks.push('useMutation.onSuccess')
        },
        onSettled: () => {
          callbacks.push('useMutation.onSettled')
        },
      }))

      return (
        <button
          onClick={async () => {
            const result = await mutation.mutate('todo')
            callbacks.push(`mutate.result:${result}`)
          }}
        >
          mutate
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual([
      'useMutation.onSuccess',
      'useMutation.onSettled',
      'mutate.result:todo',
    ])
  })

  // Ported from 'should be able to override the error callbacks when using
  // mutateAsync': mutateAsync is gone; awaiting mutate rejects with the
  // mutation error after the options-level error callbacks have run.
  it('should run error callbacks before the awaited mutate promise rejects', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (_text: string) =>
          sleep(10).then(() => Promise.reject(new Error('oops'))),
        onError: () => {
          callbacks.push('useMutation.onError')
        },
        onSettled: () => {
          callbacks.push('useMutation.onSettled')
        },
      }))

      return (
        <button
          onClick={async () => {
            try {
              await mutation.mutate('todo')
            } catch (error) {
              callbacks.push(`mutate.error:${(error as Error).message}`)
            }
          }}
        >
          mutate
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual([
      'useMutation.onError',
      'useMutation.onSettled',
      'mutate.error:oops',
    ])
  })

  it('should be able to use mutation defaults', async () => {
    const key = queryKey()

    queryClient.setMutationDefaults(key, {
      mutationFn: (text: string) => sleep(10).then(() => text),
    })

    function Page() {
      const mutation = useMutation<string, unknown, string>(() => ({
        mutationKey: key,
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>
            {`data: ${mutation.data ?? 'null'}, isPending: ${String(
              mutation.isPending,
            )}`}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(
      rendered.getByText('data: null, isPending: false'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText('data: null, isPending: true'),
    ).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('data: todo, isPending: false'),
    ).toBeInTheDocument()
  })

  it('should be able to retry a failed mutation', async () => {
    let count = 0

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (_text: string) => {
          count++
          return Promise.reject(new Error('oops'))
        },
        retry: 1,
        retryDelay: 5,
      }))

      createTrackedEffect(() => {
        const { mutate } = mutation
        setActTimeout(() => {
          mutate('todo')
        }, 10)
      })

      return null
    }

    renderWithClient(queryClient, () => <Page />)

    await vi.advanceTimersByTimeAsync(20)

    expect(count).toBe(2)
  })

  it('should not retry mutations while offline', async () => {
    const onlineMock = mockOnlineManagerIsOnline(false)

    let count = 0

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (_text: string) => {
          count++
          return Promise.reject(new Error('oops'))
        },
        retry: 1,
        retryDelay: 5,
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>
            {`error: ${
              mutation.error instanceof Error ? mutation.error.message : 'null'
            }, status: ${mutation.status}, isPaused: ${String(
              mutation.isPaused,
            )}`}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(
      rendered.getByText('error: null, status: idle, isPaused: false'),
    ).toBeInTheDocument()

    window.dispatchEvent(new Event('offline'))

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)

    expect(
      rendered.getByText('error: null, status: pending, isPaused: true'),
    ).toBeInTheDocument()

    expect(count).toBe(0)

    onlineMock.mockRestore()
    window.dispatchEvent(new Event('online'))

    await vi.advanceTimersByTimeAsync(6)
    expect(
      rendered.getByText('error: oops, status: error, isPaused: false'),
    ).toBeInTheDocument()

    expect(count).toBe(2)
  })

  it('should call onMutate even if paused', async () => {
    const onlineMock = mockOnlineManagerIsOnline(false)
    const onMutate = vi.fn()
    let count = 0

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: async (_text: string) => {
          count++
          await sleep(10)
          return count
        },
        onMutate,
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>
            {`data: ${mutation.data ?? 'null'}, status: ${
              mutation.status
            }, isPaused: ${String(mutation.isPaused)}`}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(
      rendered.getByText('data: null, status: idle, isPaused: false'),
    ).toBeInTheDocument()

    window.dispatchEvent(new Event('offline'))

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText('data: null, status: pending, isPaused: true'),
    ).toBeInTheDocument()

    expect(onMutate).toHaveBeenCalledTimes(1)
    expect(onMutate).toHaveBeenCalledWith('todo', {
      client: queryClient,
      meta: undefined,
      mutationKey: undefined,
    })

    onlineMock.mockRestore()
    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(11)
    expect(
      rendered.getByText('data: 1, status: success, isPaused: false'),
    ).toBeInTheDocument()

    expect(onMutate).toHaveBeenCalledTimes(1)
    expect(count).toBe(1)
  })

  it('should optimistically go to paused state if offline', async () => {
    const onlineMock = mockOnlineManagerIsOnline(false)
    let count = 0
    const states: Array<string> = []

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: async (_text: string) => {
          count++
          await sleep(10)
          return count
        },
      }))

      createRenderEffect(
        () => `${mutation.status}, ${mutation.isPaused}`,
        (state) => {
          states.push(state)
        },
      )

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>
            {`data: ${mutation.data ?? 'null'}, status: ${
              mutation.status
            }, isPaused: ${String(mutation.isPaused)}`}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    rendered.getByText('data: null, status: idle, isPaused: false')
    window.dispatchEvent(new Event('offline'))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText('data: null, status: pending, isPaused: true'),
    ).toBeInTheDocument()

    // no intermediate 'pending, false' state is expected because we don't start mutating!
    expect(states[0]).toBe('idle, false')
    expect(states[1]).toBe('pending, true')

    onlineMock.mockRestore()
    window.dispatchEvent(new Event('online'))

    await vi.advanceTimersByTimeAsync(11)
    expect(
      rendered.getByText('data: 1, status: success, isPaused: false'),
    ).toBeInTheDocument()
  })

  it('should be able to retry a mutation when online', async () => {
    const onlineMock = mockOnlineManagerIsOnline(false)
    const key = queryKey()

    let count = 0

    function Page() {
      const mutation = useMutation(() => ({
        mutationKey: key,
        mutationFn: async (_text: string) => {
          await sleep(10)
          count++
          return count > 1
            ? Promise.resolve(`data${count}`)
            : Promise.reject(new Error('oops'))
        },
        retry: 1,
        retryDelay: 5,
        networkMode: 'offlineFirst' as const,
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>status: {mutation.status}</div>
          <div>data: {mutation.data ?? 'null'}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('status: idle')).toBeInTheDocument()
    window.dispatchEvent(new Event('offline'))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(16)
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('status: pending')).toBeInTheDocument()

    // INTENDED DIVERGENCE (action transactions): the original test asserted
    // the rendered `isPaused: true` here. Mid-flight cache events (retry
    // failure at +10ms, pause) fire inside the action transaction's async
    // context, so the reactive surface holds its pre-flight face until
    // settle — held updates commit atomically by design. The mutation cache
    // state below carries those assertions instead.
    expect(
      queryClient.getMutationCache().findAll({ mutationKey: key }).length,
    ).toBe(1)
    expect(
      queryClient.getMutationCache().findAll({ mutationKey: key })[0]?.state,
    ).toMatchObject({
      status: 'pending',
      isPaused: true,
      failureCount: 1,
      failureReason: new Error('oops'),
    })

    onlineMock.mockRestore()
    window.dispatchEvent(new Event('online'))

    await vi.advanceTimersByTimeAsync(11)
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('data: data2')).toBeInTheDocument()

    expect(
      queryClient.getMutationCache().findAll({ mutationKey: key })[0]?.state,
    ).toMatchObject({
      status: 'success',
      isPaused: false,
      failureCount: 0,
      failureReason: null,
      data: 'data2',
    })
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should not change state if unmounted', () => {
    function Mutates() {
      const mutation = useMutation(() => ({ mutationFn: () => sleep(10) }))
      return <button onClick={() => mutation.mutate()}>mutate</button>
    }
    function Page() {
      const [mounted, setMounted] = createSignal(true)
      return (
        <div>
          <button onClick={() => setMounted(false)}>unmount</button>
          {mounted() && <Mutates />}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)
    fireEvent.click(rendered.getByText('mutate'))
    fireEvent.click(rendered.getByText('unmount'))
  })

  it('should be able to throw an error when throwOnError is set to true', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const mutation = useMutation<string, Error>(() => ({
        mutationFn: () => {
          const err = new Error('Expected mock error. All is well!')
          err.stack = ''
          return Promise.reject(err)
        },
        throwOnError: true,
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Errored
        fallback={() => (
          <div>
            <span>error</span>
          </div>
        )}
      >
        <Page />
      </Errored>
    ))

    fireEvent.click(rendered.getByText('mutate'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.queryByText('error')).not.toBeNull()

    consoleMock.mockRestore()
  })

  it('should be able to throw an error when throwOnError is a function that returns true', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    let boundary = false
    function Page() {
      const mutation = useMutation<string, Error>(() => ({
        mutationFn: () => {
          const err = new Error('mock error')
          err.stack = ''
          return Promise.reject(err)
        },
        throwOnError: () => {
          boundary = !boundary
          return !boundary
        },
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate()}>mutate</button>
          {mutation.error && mutation.error.message}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Errored
        fallback={() => (
          <div>
            <span>error boundary</span>
          </div>
        )}
      >
        <Page />
      </Errored>
    ))

    // first error goes to component
    fireEvent.click(rendered.getByText('mutate'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.queryByText('mock error')).not.toBeNull()

    // second error goes to boundary
    fireEvent.click(rendered.getByText('mutate'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.queryByText('error boundary')).not.toBeNull()

    consoleMock.mockRestore()
  })

  it('should pass meta to mutation on success', async () => {
    const successMock = vi.fn()

    const queryClientMutationMeta = new QueryClient({
      mutationCache: new MutationCache({
        onSuccess: (_, __, ___, mutation) => {
          successMock(mutation.meta?.metaSuccessMessage)
        },
      }),
    })

    const metaSuccessMessage = 'mutation succeeded'

    function Page() {
      const mutationSucceed = useMutation(() => ({
        mutationFn: () => Promise.resolve(''),
        meta: { metaSuccessMessage },
      }))

      return (
        <div>
          <button onClick={() => mutationSucceed.mutate()}>succeed</button>
          {mutationSucceed.isSuccess && <div>successTest</div>}
        </div>
      )
    }

    const rendered = renderWithClient(queryClientMutationMeta, () => <Page />)

    fireEvent.click(rendered.getByText('succeed'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.queryByText('successTest')).not.toBeNull()

    expect(successMock).toHaveBeenCalledTimes(1)
    expect(successMock).toHaveBeenCalledWith(metaSuccessMessage)
  })

  it('should pass meta to mutation on error', async () => {
    const errorMock = vi.fn()

    const queryClientMutationMeta = new QueryClient({
      mutationCache: new MutationCache({
        onError: (_, __, ___, mutation) => {
          errorMock(mutation.meta?.metaErrorMessage)
        },
      }),
    })

    const metaErrorMessage = 'mutation failed'

    function Page() {
      const mutationError = useMutation(() => ({
        mutationFn: () => {
          throw new Error('')
        },
        meta: { metaErrorMessage },
      }))

      return (
        <div>
          <button onClick={() => mutationError.mutate()}>error</button>
          {mutationError.isError && <div>errorTest</div>}
        </div>
      )
    }

    const rendered = renderWithClient(queryClientMutationMeta, () => <Page />)

    fireEvent.click(rendered.getByText('error'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.queryByText('errorTest')).not.toBeNull()

    expect(errorMock).toHaveBeenCalledTimes(1)
    expect(errorMock).toHaveBeenCalledWith(metaErrorMessage)
  })

  // Ported from 'should call cache callbacks when unmounted': call-site
  // callbacks are gone; the portable behavior is that the mutation keeps
  // running after unmount, options-level callbacks still fire, and gcTime 0
  // removes the settled mutation from the cache.
  it('should run the mutation and options callbacks when unmounted', async () => {
    const onSuccess = vi.fn()
    const onSettled = vi.fn()
    const mutationKey = queryKey()
    let count = 0

    function Page() {
      const [show, setShow] = createSignal(true)
      return (
        <div>
          <button onClick={() => setShow(false)}>hide</button>
          {show() && <Component />}
        </div>
      )
    }

    function Component() {
      const mutation = useMutation(() => ({
        mutationFn: async (_text: string) => {
          count++
          await sleep(10)
          return count
        },
        mutationKey: mutationKey,
        gcTime: 0,
        onSuccess,
        onSettled,
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /hide/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(
      queryClient.getMutationCache().findAll({ mutationKey: mutationKey }),
    ).toHaveLength(0)
    expect(count).toBe(1)

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledTimes(1)
  })

  // Ported from 'should call mutate callbacks only for the last observer':
  // the call-site-callback aspect is gone; the portable behavior is that
  // options callbacks fire for every mutate call and durable state reflects
  // the latest settle.
  it('should call options callbacks for every mutate and keep the latest result', async () => {
    const onSuccess = vi.fn()
    const onSettled = vi.fn()
    let count = 0

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: async (_text: string) => {
          count++
          await sleep(10)
          return `result${count}`
        },
        onSuccess,
        onSettled,
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>
            {`data: ${mutation.data ?? 'null'}, status: ${mutation.status}`}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('data: null, status: idle')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('data: result2, status: success'),
    ).toBeInTheDocument()

    expect(count).toBe(2)

    expect(onSuccess).toHaveBeenCalledTimes(2)
    expect(onSettled).toHaveBeenCalledTimes(2)
    // onMutateResult parameter is always undefined: no context threading.
    expect(onSuccess).toHaveBeenLastCalledWith('result2', 'todo', undefined, {
      client: queryClient,
      meta: undefined,
      mutationKey: undefined,
    })
    expect(onSettled).toHaveBeenLastCalledWith(
      'result2',
      null,
      'todo',
      undefined,
      {
        client: queryClient,
        meta: undefined,
        mutationKey: undefined,
      },
    )
  })

  it('should go to error state if onSuccess callback errors', async () => {
    const error = new Error('error from onSuccess')
    const onError = vi.fn()

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (_text: string) => sleep(10).then(() => 'result'),
        onSuccess: () => Promise.reject(error),
        onError,
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>status: {mutation.status}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    rendered.getByRole('button', { name: /mutate/i }).click()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('status: error')).toBeInTheDocument()

    expect(onError).toHaveBeenCalledWith(error, 'todo', undefined, {
      client: queryClient,
      meta: undefined,
      mutationKey: undefined,
    })
  })

  it('should go to error state if onError callback errors', async ({
    onTestFinished,
  }) => {
    // The onError rejection is reported as an unhandled rejection by
    // design (mirrors query-core's `void Promise.reject`); capture it so
    // it doesn't surface as runner noise.
    const unhandledRejectionFn = vi.fn()
    process.on('unhandledRejection', unhandledRejectionFn)
    onTestFinished(() => {
      process.off('unhandledRejection', unhandledRejectionFn)
    })

    const error = new Error('error from onError')
    const mutateFnError = new Error('mutateFnError')

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (_text: string) =>
          sleep(10).then(() => {
            throw mutateFnError
          }),
        onError: () => Promise.reject(error),
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>
            {`error: ${
              mutation.error instanceof Error ? mutation.error.message : 'null'
            }, status: ${mutation.status}`}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('error: null, status: idle')).toBeInTheDocument()

    rendered.getByRole('button', { name: /mutate/i }).click()
    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('error: mutateFnError, status: error'),
    ).toBeInTheDocument()
  })

  it('should go to error state if onSettled callback errors', async ({
    onTestFinished,
  }) => {
    // See above: the onSettled rejection is reported unhandled by design.
    const unhandledRejectionFn = vi.fn()
    process.on('unhandledRejection', unhandledRejectionFn)
    onTestFinished(() => {
      process.off('unhandledRejection', unhandledRejectionFn)
    })

    const error = new Error('error from onSettled')
    const mutateFnError = new Error('mutateFnError')
    const onError = vi.fn()

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (_text: string) =>
          sleep(10).then(() => {
            throw mutateFnError
          }),
        onSettled: () => Promise.reject(error),
        onError,
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>
            {`error: ${
              mutation.error instanceof Error ? mutation.error.message : 'null'
            }, status: ${mutation.status}`}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('error: null, status: idle')).toBeInTheDocument()

    rendered.getByRole('button', { name: /mutate/i }).click()
    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('error: mutateFnError, status: error'),
    ).toBeInTheDocument()

    expect(onError).toHaveBeenCalledWith(mutateFnError, 'todo', undefined, {
      client: queryClient,
      meta: undefined,
      mutationKey: undefined,
    })
  })

  it('should use provided custom queryClient', async () => {
    function Page() {
      const mutation = useMutation(
        () => ({
          mutationFn: (text: string) => {
            return Promise.resolve(text)
          },
        }),
        () => queryClient,
      )

      return (
        <div>
          <button onClick={() => mutation.mutate('custom client')}>
            mutate
          </button>
          <div>
            data: {mutation.data ?? 'null'}, status: {mutation.status}
          </div>
        </div>
      )
    }

    const rendered = render(() => <Page></Page>)

    expect(rendered.getByText('data: null, status: idle')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText('data: custom client, status: success'),
    ).toBeInTheDocument()
  })
})
