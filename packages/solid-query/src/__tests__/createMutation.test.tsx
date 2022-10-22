import '@testing-library/jest-dom'
import {
  createContext,
  createEffect,
  createRenderEffect,
  createSignal,
  ErrorBoundary,
} from 'solid-js'
import { fireEvent, render, screen, waitFor } from 'solid-testing-library'
import type { QueryClient } from '..'
import {
  createMutation,
  MutationCache,
  QueryCache,
  QueryClientProvider,
} from '..'
import type { CreateMutationResult } from '../types'
import {
  createQueryClient,
  mockNavigatorOnLine,
  queryKey,
  setActTimeout,
  sleep,
} from './utils'

describe('useMutation', () => {
  const queryCache = new QueryCache()
  const mutationCache = new MutationCache()
  const queryClient = createQueryClient({ queryCache, mutationCache })

  it('should be able to reset `data`', async () => {
    function Page() {
      const mutation = createMutation(() => Promise.resolve('mutation'))

      return (
        <div>
          <h1>{mutation.data ?? 'empty'}</h1>
          <button onClick={() => mutation.reset()}>reset</button>
          <button onClick={() => mutation.mutate()}>mutate</button>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(screen.getByRole('heading').textContent).toBe('empty')

    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading').textContent).toBe('mutation')
    })

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading').textContent).toBe('empty')
    })
  })

  it('should be able to reset `error`', async () => {
    function Page() {
      const mutation = createMutation<string, Error>(() => {
        const err = new Error('Expected mock error. All is well!')
        err.stack = ''
        return Promise.reject(err)
      })

      return (
        <div>
          {mutation.error && <h1>{mutation.error.message}</h1>}
          <button onClick={() => mutation.reset()}>reset</button>
          <button onClick={() => mutation.mutate()}>mutate</button>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => {
      expect(screen.queryByRole('heading')).toBeNull()
    })

    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading').textContent).toBe(
        'Expected mock error. All is well!',
      )
    })

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))

    await waitFor(() => {
      expect(screen.queryByRole('heading')).toBeNull()
    })
  })

  it('should be able to call `onSuccess` and `onSettled` after each successful mutate', async () => {
    const [count, setCount] = createSignal(0)
    const onSuccessMock = jest.fn()
    const onSettledMock = jest.fn()

    function Page() {
      const mutation = createMutation(
        (vars: { count: number }) => Promise.resolve(vars.count),
        {
          onSuccess: (data) => {
            onSuccessMock(data)
          },
          onSettled: (data) => {
            onSettledMock(data)
          },
        },
      )

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(screen.getByRole('heading').textContent).toBe('0')

    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))
    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))
    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading').textContent).toBe('3')
    })

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(3)
    })

    expect(onSuccessMock).toHaveBeenCalledWith(1)
    expect(onSuccessMock).toHaveBeenCalledWith(2)
    expect(onSuccessMock).toHaveBeenCalledWith(3)

    await waitFor(() => {
      expect(onSettledMock).toHaveBeenCalledTimes(3)
    })

    expect(onSettledMock).toHaveBeenCalledWith(1)
    expect(onSettledMock).toHaveBeenCalledWith(2)
    expect(onSettledMock).toHaveBeenCalledWith(3)
  })

  it('should set correct values for `failureReason` and `failureCount` on multiple mutate calls', async () => {
    const [count, setCount] = createSignal(0)
    type Value = { count: number }

    const mutateFn = jest.fn<Promise<Value>, [value: Value]>()

    mutateFn.mockImplementationOnce(() => {
      return Promise.reject('Error test Jonas')
    })

    mutateFn.mockImplementation(async (value) => {
      await sleep(10)
      return Promise.resolve(value)
    })

    function Page() {
      const mutation = createMutation<Value, string, Value>(mutateFn)

      return (
        <div>
          <h1>Data {mutation.data?.count}</h1>
          <h2>Status {mutation.status}</h2>
          <h2>Failed {mutation.failureCount} times</h2>
          <h2>Failed because {mutation.failureReason ?? 'null'}</h2>
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('Data'))

    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))
    await waitFor(() => screen.getByText('Data'))
    await waitFor(() => screen.getByText('Status error'))
    await waitFor(() => screen.getByText('Failed 1 times'))
    await waitFor(() => screen.getByText('Failed because Error test Jonas'))

    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))
    await waitFor(() => screen.getByText('Status loading'))
    await waitFor(() => screen.getByText('Status success'))
    await waitFor(() => screen.getByText('Data 2'))
    await waitFor(() => screen.getByText('Failed 0 times'))
    await waitFor(() => screen.getByText('Failed because null'))
  })

  it('should be able to call `onError` and `onSettled` after each failed mutate', async () => {
    const onErrorMock = jest.fn()
    const onSettledMock = jest.fn()
    const [count, setCount] = createSignal(0)

    function Page() {
      const mutation = createMutation(
        (vars: { count: number }) => {
          const error = new Error(
            `Expected mock error. All is well! ${vars.count}`,
          )
          error.stack = ''
          return Promise.reject(error)
        },
        {
          onError: (error: Error) => {
            onErrorMock(error.message)
          },
          onSettled: (_data, error) => {
            onSettledMock(error?.message)
          },
        },
      )

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(screen.getByRole('heading').textContent).toBe('0')

    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))
    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))
    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading').textContent).toBe('3')
    })

    await waitFor(() => {
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

    await waitFor(() => {
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
    const callbacks: string[] = []

    function Page() {
      const mutation = createMutation(async (text: string) => text, {
        onSuccess: async () => {
          callbacks.push('useMutation.onSuccess')
        },
        onSettled: async () => {
          callbacks.push('useMutation.onSettled')
        },
      })

      createEffect(() => {
        const { mutateAsync } = mutation
        setActTimeout(async () => {
          try {
            const result = await mutateAsync('todo', {
              onSuccess: async () => {
                callbacks.push('mutateAsync.onSuccess')
              },
              onSettled: async () => {
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

    await sleep(100)

    expect(callbacks).toEqual([
      'useMutation.onSuccess',
      'useMutation.onSettled',
      'mutateAsync.onSuccess',
      'mutateAsync.onSettled',
      'mutateAsync.result:todo',
    ])
  })

  it('should be able to override the error callbacks when using mutateAsync', async () => {
    const callbacks: string[] = []

    function Page() {
      const mutation = createMutation(
        async (_text: string) => Promise.reject('oops'),
        {
          onError: async () => {
            callbacks.push('useMutation.onError')
          },
          onSettled: async () => {
            callbacks.push('useMutation.onSettled')
          },
        },
      )

      createEffect(() => {
        const { mutateAsync } = mutation
        setActTimeout(async () => {
          try {
            await mutateAsync('todo', {
              onError: async () => {
                callbacks.push('mutateAsync.onError')
              },
              onSettled: async () => {
                callbacks.push('mutateAsync.onSettled')
              },
            })
          } catch (error) {
            callbacks.push(`mutateAsync.error:${error}`)
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

    await sleep(100)

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

    queryClient.setMutationDefaults(key(), {
      mutationFn: async (text: string) => {
        await sleep(10)
        return text
      },
    })

    const states: CreateMutationResult<any, any, any, any>[] = []

    function Page() {
      const mutation = createMutation<string, unknown, string>(key())

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

    await sleep(100)

    expect(states.length).toBe(3)
    expect(states[0]).toMatchObject({ data: undefined, isLoading: false })
    expect(states[1]).toMatchObject({ data: undefined, isLoading: true })
    expect(states[2]).toMatchObject({ data: 'todo', isLoading: false })
  })

  it('should be able to retry a failed mutation', async () => {
    let count = 0

    function Page() {
      const mutation = createMutation(
        (_text: string) => {
          count++
          return Promise.reject('oops')
        },
        {
          retry: 1,
          retryDelay: 5,
        },
      )

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

    await sleep(100)

    expect(count).toBe(2)
  })

  it('should not retry mutations while offline', async () => {
    const onlineMock = mockNavigatorOnLine(false)

    let count = 0

    function Page() {
      const mutation = createMutation(
        (_text: string) => {
          count++
          return Promise.reject(new Error('oops'))
        },
        {
          retry: 1,
          retryDelay: 5,
        },
      )

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => {
      expect(
        screen.getByText('error: null, status: idle, isPaused: false'),
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))

    await waitFor(() => {
      expect(
        screen.getByText('error: null, status: loading, isPaused: true'),
      ).toBeInTheDocument()
    })

    expect(count).toBe(0)

    onlineMock.mockReturnValue(true)
    window.dispatchEvent(new Event('online'))

    await sleep(100)

    await waitFor(() => {
      expect(
        screen.getByText('error: oops, status: error, isPaused: false'),
      ).toBeInTheDocument()
    })

    expect(count).toBe(2)

    onlineMock.mockRestore()
  })

  it('should call onMutate even if paused', async () => {
    const onlineMock = mockNavigatorOnLine(false)
    const onMutate = jest.fn()
    let count = 0

    function Page() {
      const mutation = createMutation(
        async (_text: string) => {
          count++
          await sleep(10)
          return count
        },
        {
          onMutate,
        },
      )

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await screen.findByText('data: null, status: idle, isPaused: false')

    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))

    await screen.findByText('data: null, status: loading, isPaused: true')

    expect(onMutate).toHaveBeenCalledTimes(1)
    expect(onMutate).toHaveBeenCalledWith('todo')

    onlineMock.mockReturnValue(true)
    window.dispatchEvent(new Event('online'))

    await screen.findByText('data: 1, status: success, isPaused: false')

    expect(onMutate).toHaveBeenCalledTimes(1)
    expect(count).toBe(1)

    onlineMock.mockRestore()
  })

  it('should optimistically go to paused state if offline', async () => {
    const onlineMock = mockNavigatorOnLine(false)
    let count = 0
    const states: Array<string> = []

    function Page() {
      const mutation = createMutation(async (_text: string) => {
        count++
        await sleep(10)
        return count
      })

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await screen.findByText('data: null, status: idle, isPaused: false')

    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))

    await screen.findByText('data: null, status: loading, isPaused: true')

    // no intermediate 'loading, false' state is expected because we don't start mutating!
    expect(states[0]).toBe('idle, false')
    expect(states[1]).toBe('loading, true')

    onlineMock.mockReturnValue(true)
    window.dispatchEvent(new Event('online'))

    await screen.findByText('data: 1, status: success, isPaused: false')

    onlineMock.mockRestore()
  })

  it('should be able to retry a mutation when online', async () => {
    const onlineMock = mockNavigatorOnLine(false)

    let count = 0
    const states: CreateMutationResult<any, any, any, any>[] = []

    function Page() {
      const mutation = createMutation(
        async (_text: string) => {
          await sleep(1)
          count++
          return count > 1 ? Promise.resolve('data') : Promise.reject('oops')
        },
        {
          retry: 1,
          retryDelay: 5,
          networkMode: 'offlineFirst',
        },
      )

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

    await sleep(50)

    expect(states.length).toBe(4)
    expect(states[0]).toMatchObject({
      isLoading: false,
      isPaused: false,
      failureCount: 0,
      failureReason: null,
    })
    expect(states[1]).toMatchObject({
      isLoading: true,
      isPaused: false,
      failureCount: 0,
      failureReason: null,
    })
    expect(states[2]).toMatchObject({
      isLoading: true,
      isPaused: false,
      failureCount: 1,
      failureReason: 'oops',
    })
    expect(states[3]).toMatchObject({
      isLoading: true,
      isPaused: true,
      failureCount: 1,
      failureReason: 'oops',
    })

    onlineMock.mockReturnValue(true)
    window.dispatchEvent(new Event('online'))

    await sleep(50)

    expect(states.length).toBe(6)
    expect(states[4]).toMatchObject({
      isLoading: true,
      isPaused: false,
      failureCount: 1,
      failureReason: 'oops',
    })
    expect(states[5]).toMatchObject({
      isLoading: false,
      isPaused: false,
      failureCount: 0,
      failureReason: null,
      data: 'data',
    })

    onlineMock.mockRestore()
  })

  it('should not change state if unmounted', async () => {
    function Mutates() {
      const mutation = createMutation(() => sleep(10))
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    fireEvent.click(screen.getByText('mutate'))
    fireEvent.click(screen.getByText('unmount'))
  })

  it('should be able to throw an error when useErrorBoundary is set to true', async () => {
    function Page() {
      const mutation = createMutation<string, Error>(
        () => {
          const err = new Error('Expected mock error. All is well!')
          err.stack = ''
          return Promise.reject(err)
        },
        { useErrorBoundary: true },
      )

      return (
        <div>
          <button onClick={() => mutation.mutate()}>mutate</button>
        </div>
      )
    }

    render(() => (
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

    fireEvent.click(screen.getByText('mutate'))

    await waitFor(() => {
      expect(screen.queryByText('error')).not.toBeNull()
    })
  })

  it('should be able to throw an error when useErrorBoundary is a function that returns true', async () => {
    let boundary = false
    function Page() {
      const mutation = createMutation<string, Error>(
        () => {
          const err = new Error('mock error')
          err.stack = ''
          return Promise.reject(err)
        },
        {
          useErrorBoundary: () => {
            boundary = !boundary
            return !boundary
          },
        },
      )

      return (
        <div>
          <button onClick={() => mutation.mutate()}>mutate</button>
          {mutation.error && mutation.error.message}
        </div>
      )
    }

    render(() => (
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
    fireEvent.click(screen.getByText('mutate'))
    await waitFor(() => {
      expect(screen.queryByText('mock error')).not.toBeNull()
    })

    // second error goes to boundary
    fireEvent.click(screen.getByText('mutate'))
    await waitFor(() => {
      expect(screen.queryByText('error boundary')).not.toBeNull()
    })
  })

  it('should pass meta to mutation', async () => {
    const errorMock = jest.fn()
    const successMock = jest.fn()

    const queryClientMutationMeta = createQueryClient({
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
      const mutationSucceed = createMutation(async () => '', {
        meta: { metaSuccessMessage },
      })
      const mutationError = createMutation(
        async () => {
          throw new Error('')
        },
        {
          meta: { metaErrorMessage },
        },
      )

      return (
        <div>
          <button onClick={() => mutationSucceed.mutate()}>succeed</button>
          <button onClick={() => mutationError.mutate()}>error</button>
          {mutationSucceed.isSuccess && <div>successTest</div>}
          {mutationError.isError && <div>errorTest</div>}
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClientMutationMeta}>
        <Page />
      </QueryClientProvider>
    ))

    fireEvent.click(screen.getByText('succeed'))
    fireEvent.click(screen.getByText('error'))

    await waitFor(() => {
      expect(screen.queryByText('successTest')).not.toBeNull()
      expect(screen.queryByText('errorTest')).not.toBeNull()
    })

    expect(successMock).toHaveBeenCalledTimes(1)
    expect(successMock).toHaveBeenCalledWith(metaSuccessMessage)
    expect(errorMock).toHaveBeenCalledTimes(1)
    expect(errorMock).toHaveBeenCalledWith(metaErrorMessage)
  })

  it('should call cache callbacks when unmounted', async () => {
    const onSuccess = jest.fn()
    const onSuccessMutate = jest.fn()
    const onSettled = jest.fn()
    const onSettledMutate = jest.fn()
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
      const mutation = createMutation(
        async (_text: string) => {
          count++
          await sleep(10)
          return count
        },
        {
          mutationKey: mutationKey(),
          cacheTime: 0,
          onSuccess,
          onSettled,
        },
      )

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await screen.findByText('data: null, status: idle, isPaused: false')

    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))
    fireEvent.click(screen.getByRole('button', { name: /hide/i }))

    await waitFor(() => {
      expect(
        queryClient.getMutationCache().findAll({ mutationKey: mutationKey() }),
      ).toHaveLength(0)
    })

    expect(count).toBe(1)

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSuccessMutate).toHaveBeenCalledTimes(0)
    expect(onSettledMutate).toHaveBeenCalledTimes(0)
  })

  describe('with custom context', () => {
    it('should be able to reset `data`', async () => {
      const context = createContext<QueryClient | undefined>(undefined)

      function Page() {
        const mutation = createMutation(() => Promise.resolve('mutation'), {
          context,
        })

        return (
          <div>
            <h1>{mutation.data ?? 'empty'}</h1>
            <button onClick={() => mutation.reset()}>reset</button>
            <button onClick={() => mutation.mutate()}>mutate</button>
          </div>
        )
      }

      render(() => (
        <QueryClientProvider client={queryClient} context={context}>
          <Page />
        </QueryClientProvider>
      ))

      expect(screen.getByRole('heading').textContent).toBe('empty')

      fireEvent.click(screen.getByRole('button', { name: /mutate/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading').textContent).toBe('mutation')
      })

      fireEvent.click(screen.getByRole('button', { name: /reset/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading').textContent).toBe('empty')
      })
    })

    it('should throw if the context is not passed to useMutation', async () => {
      const context = createContext<QueryClient | undefined>(undefined)

      function Page() {
        const { data = '' } = createMutation(() => Promise.resolve('mutation'))

        return (
          <div>
            <h1 data-testid="title">{data}</h1>
          </div>
        )
      }

      render(() => (
        <QueryClientProvider client={queryClient} context={context}>
          <ErrorBoundary fallback={() => <div>error boundary</div>}>
            <Page />
          </ErrorBoundary>
          ,
        </QueryClientProvider>
      ))

      await waitFor(() => screen.getByText('error boundary'))
    })
  })

  it('should call mutate callbacks only for the last observer', async () => {
    const onSuccess = jest.fn()
    const onSuccessMutate = jest.fn()
    const onSettled = jest.fn()
    const onSettledMutate = jest.fn()
    let count = 0

    function Page() {
      const mutation = createMutation(
        async (_text: string) => {
          count++
          await sleep(10)
          return `result${count}`
        },
        {
          onSuccess,
          onSettled,
        },
      )

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await screen.findByText('data: null, status: idle')

    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))
    fireEvent.click(screen.getByRole('button', { name: /mutate/i }))

    await screen.findByText('data: result2, status: success')

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
    const onError = jest.fn()

    function Page() {
      const mutation = createMutation(
        async (_text: string) => {
          await sleep(10)
          return 'result'
        },
        {
          onSuccess: () => Promise.reject(error),
          onError,
        },
      )

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>status: {mutation.status}</div>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await screen.findByText('status: idle')

    screen.getByRole('button', { name: /mutate/i }).click()

    await screen.findByText('status: error')

    expect(onError).toHaveBeenCalledWith(error, 'todo', undefined)
  })

  it('should go to error state if onError callback errors', async () => {
    const error = new Error('error from onError')
    const mutateFnError = new Error('mutateFnError')

    function Page() {
      const mutation = createMutation(
        async (_text: string) => {
          await sleep(10)
          throw mutateFnError
        },
        {
          onError: () => Promise.reject(error),
        },
      )

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await screen.findByText('error: null, status: idle')

    screen.getByRole('button', { name: /mutate/i }).click()

    await screen.findByText('error: mutateFnError, status: error')
  })

  it('should go to error state if onSettled callback errors', async () => {
    const error = new Error('error from onSettled')
    const mutateFnError = new Error('mutateFnError')
    const onError = jest.fn()

    function Page() {
      const mutation = createMutation(
        async (_text: string) => {
          await sleep(10)
          throw mutateFnError
        },
        {
          onSettled: () => Promise.reject(error),
          onError,
        },
      )

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await screen.findByText('error: null, status: idle')

    screen.getByRole('button', { name: /mutate/i }).click()

    await screen.findByText('error: mutateFnError, status: error')

    expect(onError).toHaveBeenCalledWith(mutateFnError, 'todo', undefined)
  })
})
