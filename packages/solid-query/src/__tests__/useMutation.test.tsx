import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ErrorBoundary,
  createEffect,
  createRenderEffect,
  createSignal,
} from 'solid-js'
import { fireEvent, render } from '@solidjs/testing-library'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useMutation,
} from '..'
import { mockOnlineManagerIsOnline, setActTimeout } from './utils'
import type { UseMutationResult } from '../types'

describe('useMutation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const queryCache = new QueryCache()
  const mutationCache = new MutationCache()
  const queryClient = new QueryClient({ queryCache, mutationCache })

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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByRole('heading').textContent).toBe('empty')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await vi.waitFor(() => {
      expect(rendered.getByRole('heading').textContent).toBe('mutation')
    })

    fireEvent.click(rendered.getByRole('button', { name: /reset/i }))

    await vi.waitFor(() => {})
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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.queryByRole('heading')).toBeNull()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await vi.waitFor(() => {
      expect(rendered.getByRole('heading').textContent).toBe(
        'Expected mock error. All is well!',
      )
    })

    fireEvent.click(rendered.getByRole('button', { name: /reset/i }))

    await vi.waitFor(() => {
      expect(rendered.queryByRole('heading')).toBeNull()
    })

    consoleMock.mockRestore()
  })

  it('should be able to call `onSuccess` and `onSettled` after each successful mutate', async () => {
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
              setCount((c) => c + 1)
              return mutation.mutate({ count: count() })
            }}
          >
            mutate
          </button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByRole('heading').textContent).toBe('0')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await vi.waitFor(() => {
      expect(rendered.getByRole('heading').textContent).toBe('3')
    })

    await vi.waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(3)
    })

    expect(onSuccessMock).toHaveBeenCalledWith(1)
    expect(onSuccessMock).toHaveBeenCalledWith(2)
    expect(onSuccessMock).toHaveBeenCalledWith(3)

    await vi.waitFor(() => {
      expect(onSettledMock).toHaveBeenCalledTimes(3)
    })

    expect(onSettledMock).toHaveBeenCalledWith(1)
    expect(onSettledMock).toHaveBeenCalledWith(2)
    expect(onSettledMock).toHaveBeenCalledWith(3)
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
              setCount((c) => c + 1)
              return mutation.mutate({ count: count() })
            }}
          >
            mutate
          </button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('Data')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    expect(rendered.getByText('Data')).toBeInTheDocument()
    await vi.waitFor(() =>
      expect(rendered.getByText('Status error')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('Failed 1 times')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(
        rendered.getByText('Failed because Error test Jonas'),
      ).toBeInTheDocument(),
    )

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.waitFor(() =>
      expect(rendered.getByText('Status pending')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('Status success')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('Data 2')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('Failed 0 times')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('Failed because null')).toBeInTheDocument(),
    )
  })

  it('should be able to call `onError` and `onSettled` after each failed mutate', async () => {
    const onErrorMock = vi.fn()
    const onSettledMock = vi.fn()
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
              setCount((c) => c + 1)
              return mutation.mutate({ count: count() })
            }}
          >
            mutate
          </button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByRole('heading').textContent).toBe('0')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await vi.waitFor(() => {
      expect(rendered.getByRole('heading').textContent).toBe('3')
    })

    await vi.waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledTimes(3)
    })
    expect(onErrorMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 1',
    )
    expect(onErrorMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 2',
    )
    expect(onErrorMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 3',
    )

    await vi.waitFor(() => {
      expect(onSettledMock).toHaveBeenCalledTimes(3)
    })
    expect(onSettledMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 1',
    )
    expect(onSettledMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 2',
    )
    expect(onSettledMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 3',
    )
  })

  it('should be able to override the useMutation success callbacks', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (text: string) => Promise.resolve(text),
        onSuccess: () => {
          callbacks.push('useMutation.onSuccess')
        },
        onSettled: () => {
          callbacks.push('useMutation.onSettled')
        },
      }))

      createEffect(() => {
        const { mutateAsync } = mutation
        setActTimeout(async () => {
          try {
            const result = await mutateAsync('todo', {
              onSuccess: () => {
                callbacks.push('mutateAsync.onSuccess')
              },
              onSettled: () => {
                callbacks.push('mutateAsync.onSettled')
              },
            })
            callbacks.push(`mutateAsync.result:${result}`)
          } catch {}
        }, 10)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual([
      'useMutation.onSuccess',
      'useMutation.onSettled',
      'mutateAsync.onSuccess',
      'mutateAsync.onSettled',
      'mutateAsync.result:todo',
    ])
  })

  it('should be able to override the error callbacks when using mutateAsync', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (_text: string) => Promise.reject(new Error('oops')),

        onError: () => {
          callbacks.push('useMutation.onError')
        },
        onSettled: () => {
          callbacks.push('useMutation.onSettled')
        },
      }))

      createEffect(() => {
        const { mutateAsync } = mutation
        setActTimeout(async () => {
          try {
            await mutateAsync('todo', {
              onError: () => {
                callbacks.push('mutateAsync.onError')
              },
              onSettled: () => {
                callbacks.push('mutateAsync.onSettled')
              },
            })
          } catch (error) {
            callbacks.push(`mutateAsync.error:${(error as Error).message}`)
          }
        }, 10)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual([
      'useMutation.onError',
      'useMutation.onSettled',
      'mutateAsync.onError',
      'mutateAsync.onSettled',
      'mutateAsync.error:oops',
    ])
  })

  it('should be able to use mutation defaults', async () => {
    const key = queryKey()

    queryClient.setMutationDefaults(key, {
      mutationFn: (text: string) => sleep(10).then(() => text),
    })

    const states: Array<UseMutationResult<any, any, any, any>> = []

    function Page() {
      const mutation = useMutation<string, unknown, string>(() => ({
        mutationKey: key,
      }))

      createRenderEffect(() => {
        states.push({ ...mutation })
      })

      createEffect(() => {
        const { mutate } = mutation
        setActTimeout(() => {
          mutate('todo')
        }, 10)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(20)

    expect(states.length).toBe(3)
    expect(states[0]).toMatchObject({ data: undefined, isPending: false })
    expect(states[1]).toMatchObject({ data: undefined, isPending: true })
    expect(states[2]).toMatchObject({ data: 'todo', isPending: false })
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

      createEffect(() => {
        const { mutate } = mutation
        setActTimeout(() => {
          mutate('todo')
        }, 10)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(
      rendered.getByText('error: null, status: idle, isPaused: false'),
    ).toBeInTheDocument()

    window.dispatchEvent(new Event('offline'))

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    expect(
      rendered.getByText('error: null, status: pending, isPaused: true'),
    ).toBeInTheDocument()

    expect(count).toBe(0)

    onlineMock.mockRestore()
    window.dispatchEvent(new Event('online'))

    await vi.advanceTimersByTimeAsync(5)
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
            data: {mutation.data ?? 'null'}, status: {mutation.status},
            isPaused: {String(mutation.isPaused)}
          </div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await rendered.findByText('data: null, status: idle, isPaused: false')

    window.dispatchEvent(new Event('offline'))

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await rendered.findByText('data: null, status: pending, isPaused: true')

    expect(onMutate).toHaveBeenCalledTimes(1)
    expect(onMutate).toHaveBeenCalledWith('todo')

    onlineMock.mockRestore()
    window.dispatchEvent(new Event('online'))

    await vi.advanceTimersByTimeAsync(10)
    await rendered.findByText('data: 1, status: success, isPaused: false')

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

      createRenderEffect(() => {
        states.push(`${mutation.status}, ${mutation.isPaused}`)
      })

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>
            data: {mutation.data ?? 'null'}, status: {mutation.status},
            isPaused: {String(mutation.isPaused)}
          </div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await rendered.findByText('data: null, status: idle, isPaused: false')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await rendered.findByText('data: null, status: pending, isPaused: true')

    // no intermediate 'pending, false' state is expected because we don't start mutating!
    expect(states[0]).toBe('idle, false')
    expect(states[1]).toBe('pending, true')

    onlineMock.mockReturnValue(true)
    window.dispatchEvent(new Event('online'))

    await vi.advanceTimersByTimeAsync(10)
    await rendered.findByText('data: 1, status: success, isPaused: false')

    onlineMock.mockRestore()
  })

  it('should be able to retry a mutation when online', async () => {
    const onlineMock = mockOnlineManagerIsOnline(false)

    let count = 0
    const states: Array<UseMutationResult<any, any, any, any>> = []

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: async (_text: string) => {
          await sleep(1)
          count++
          return count > 1
            ? Promise.resolve('data')
            : Promise.reject(new Error('oops'))
        },
        retry: 1,
        retryDelay: 5,
        networkMode: 'offlineFirst',
      }))

      createRenderEffect(() => {
        states.push({ ...mutation })
      })

      createEffect(() => {
        const { mutate } = mutation
        setActTimeout(() => {
          window.dispatchEvent(new Event('offline'))
          mutate('todo')
        }, 10)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(16)

    expect(states.length).toBe(4)
    expect(states[0]).toMatchObject({
      isPending: false,
      isPaused: false,
      failureCount: 0,
      failureReason: null,
    })
    expect(states[1]).toMatchObject({
      isPending: true,
      isPaused: false,
      failureCount: 0,
      failureReason: null,
    })
    expect(states[2]).toMatchObject({
      isPending: true,
      isPaused: false,
      failureCount: 1,
      failureReason: new Error('oops'),
    })
    expect(states[3]).toMatchObject({
      isPending: true,
      isPaused: true,
      failureCount: 1,
      failureReason: new Error('oops'),
    })

    onlineMock.mockRestore()
    window.dispatchEvent(new Event('online'))

    await vi.advanceTimersByTimeAsync(1)

    expect(states.length).toBe(6)
    expect(states[4]).toMatchObject({
      isPending: true,
      isPaused: false,
      failureCount: 1,
      failureReason: new Error('oops'),
    })
    expect(states[5]).toMatchObject({
      isPending: false,
      isPaused: false,
      failureCount: 0,
      failureReason: null,
      data: 'data',
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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary
          fallback={() => (
            <div>
              <span>error</span>
            </div>
          )}
        >
          <Page />
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    fireEvent.click(rendered.getByText('mutate'))

    await vi.waitFor(() => {
      expect(rendered.queryByText('error')).not.toBeNull()
    })

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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary
          fallback={() => (
            <div>
              <span>error boundary</span>
            </div>
          )}
        >
          <Page />
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    // first error goes to component
    fireEvent.click(rendered.getByText('mutate'))
    await vi.waitFor(() => {
      expect(rendered.queryByText('mock error')).not.toBeNull()
    })

    // second error goes to boundary
    fireEvent.click(rendered.getByText('mutate'))
    await vi.waitFor(() => {
      expect(rendered.queryByText('error boundary')).not.toBeNull()
    })

    consoleMock.mockRestore()
  })

  it('should pass meta to mutation', async () => {
    const errorMock = vi.fn()
    const successMock = vi.fn()

    const queryClientMutationMeta = new QueryClient({
      mutationCache: new MutationCache({
        onSuccess: (_, __, ___, mutation) => {
          successMock(mutation.meta?.metaSuccessMessage)
        },
        onError: (_, __, ___, mutation) => {
          errorMock(mutation.meta?.metaErrorMessage)
        },
      }),
    })

    const metaSuccessMessage = 'mutation succeeded'
    const metaErrorMessage = 'mutation failed'

    function Page() {
      const mutationSucceed = useMutation(() => ({
        mutationFn: () => Promise.resolve(''),
        meta: { metaSuccessMessage },
      }))
      const mutationError = useMutation(() => ({
        mutationFn: () => {
          throw new Error('')
        },
        meta: { metaErrorMessage },
      }))

      return (
        <div>
          <button onClick={() => mutationSucceed.mutate()}>succeed</button>
          <button onClick={() => mutationError.mutate()}>error</button>
          {mutationSucceed.isSuccess && <div>successTest</div>}
          {mutationError.isError && <div>errorTest</div>}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClientMutationMeta}>
        <Page />
      </QueryClientProvider>
    ))

    fireEvent.click(rendered.getByText('succeed'))
    fireEvent.click(rendered.getByText('error'))

    await vi.waitFor(() => {
      expect(rendered.queryByText('successTest')).not.toBeNull()
      expect(rendered.queryByText('errorTest')).not.toBeNull()
    })

    expect(successMock).toHaveBeenCalledTimes(1)
    expect(successMock).toHaveBeenCalledWith(metaSuccessMessage)
    expect(errorMock).toHaveBeenCalledTimes(1)
    expect(errorMock).toHaveBeenCalledWith(metaErrorMessage)
  })

  it('should call cache callbacks when unmounted', async () => {
    const onSuccess = vi.fn()
    const onSuccessMutate = vi.fn()
    const onSettled = vi.fn()
    const onSettledMutate = vi.fn()
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
          <button
            onClick={() =>
              mutation.mutate('todo', {
                onSuccess: onSuccessMutate,
                onSettled: onSettledMutate,
              })
            }
          >
            mutate
          </button>
          <div>
            data: {mutation.data ?? 'null'}, status: {mutation.status},
            isPaused: {String(mutation.isPaused)}
          </div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await rendered.findByText('data: null, status: idle, isPaused: false')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /hide/i }))

    await vi.waitFor(() => {
      expect(
        queryClient.getMutationCache().findAll({ mutationKey: mutationKey }),
      ).toHaveLength(0)
    })

    expect(count).toBe(1)

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSuccessMutate).toHaveBeenCalledTimes(0)
    expect(onSettledMutate).toHaveBeenCalledTimes(0)
  })

  it('should call mutate callbacks only for the last observer', async () => {
    const onSuccess = vi.fn()
    const onSuccessMutate = vi.fn()
    const onSettled = vi.fn()
    const onSettledMutate = vi.fn()
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
          <button
            onClick={() =>
              mutation.mutate('todo', {
                onSuccess: onSuccessMutate,
                onSettled: onSettledMutate,
              })
            }
          >
            mutate
          </button>
          <div>
            data: {mutation.data ?? 'null'}, status: {mutation.status}
          </div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await rendered.findByText('data: null, status: idle')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await vi.advanceTimersByTimeAsync(10)
    await rendered.findByText('data: result2, status: success')

    expect(count).toBe(2)

    expect(onSuccess).toHaveBeenCalledTimes(2)
    expect(onSettled).toHaveBeenCalledTimes(2)
    expect(onSuccessMutate).toHaveBeenCalledTimes(1)
    expect(onSuccessMutate).toHaveBeenCalledWith('result2', 'todo', undefined)
    expect(onSettledMutate).toHaveBeenCalledTimes(1)
    expect(onSettledMutate).toHaveBeenCalledWith(
      'result2',
      null,
      'todo',
      undefined,
    )
  })

  it('should go to error state if onSuccess callback errors', async () => {
    const error = new Error('error from onSuccess')
    const onError = vi.fn()

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: async (_text: string) => {
          await sleep(10)
          return 'result'
        },
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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await rendered.findByText('status: idle')

    rendered.getByRole('button', { name: /mutate/i }).click()

    await vi.advanceTimersByTimeAsync(10)
    await rendered.findByText('status: error')

    expect(onError).toHaveBeenCalledWith(error, 'todo', undefined)
  })

  it('should go to error state if onError callback errors', async () => {
    const error = new Error('error from onError')
    const mutateFnError = new Error('mutateFnError')

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: async (_text: string) => {
          await sleep(10)
          throw mutateFnError
        },
        onError: () => Promise.reject(error),
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>
            error:{' '}
            {mutation.error instanceof Error ? mutation.error.message : 'null'},
            status: {mutation.status}
          </div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.waitFor(() =>
      expect(
        rendered.getByText('error: null, status: idle'),
      ).toBeInTheDocument(),
    )

    rendered.getByRole('button', { name: /mutate/i }).click()

    await vi.advanceTimersByTimeAsync(10)
    await vi.waitFor(() =>
      expect(
        rendered.getByText('error: mutateFnError, status: error'),
      ).toBeInTheDocument(),
    )
  })

  it('should go to error state if onSettled callback errors', async () => {
    const error = new Error('error from onSettled')
    const mutateFnError = new Error('mutateFnError')
    const onError = vi.fn()

    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: async (_text: string) => {
          await sleep(10)
          throw mutateFnError
        },
        onSettled: () => Promise.reject(error),
        onError,
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>
            error:{' '}
            {mutation.error instanceof Error ? mutation.error.message : 'null'},
            status: {mutation.status}
          </div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await rendered.findByText('error: null, status: idle')

    rendered.getByRole('button', { name: /mutate/i }).click()

    await vi.advanceTimersByTimeAsync(10)
    await rendered.findByText('error: mutateFnError, status: error')

    expect(onError).toHaveBeenCalledWith(mutateFnError, 'todo', undefined)
  })

  it('should use provided custom queryClient', async () => {
    function Page() {
      const mutation = useMutation(
        () => ({
          mutationFn: async (text: string) => {
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

    await vi.waitFor(() =>
      expect(
        rendered.getByText('data: null, status: idle'),
      ).toBeInTheDocument(),
    )

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await vi.waitFor(() =>
      expect(
        rendered.getByText('data: custom client, status: success'),
      ).toBeInTheDocument(),
    )
  })
})
