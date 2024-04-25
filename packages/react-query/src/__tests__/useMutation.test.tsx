import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { MutationCache, QueryCache, useMutation } from '..'
import {
  createQueryClient,
  mockOnlineManagerIsOnline,
  queryKey,
  renderWithClient,
  setActTimeout,
  sleep,
} from './utils'
import type { UseMutationResult } from '../types'

describe('useMutation', () => {
  const queryCache = new QueryCache()
  const mutationCache = new MutationCache()
  const queryClient = createQueryClient({ queryCache, mutationCache })

  it('should be able to reset `data`', async () => {
    function Page() {
      const {
        mutate,
        data = 'empty',
        reset,
      } = useMutation({ mutationFn: () => Promise.resolve('mutation') })

      return (
        <div>
          <h1>{data}</h1>
          <button onClick={() => reset()}>reset</button>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const { getByRole } = renderWithClient(queryClient, <Page />)

    expect(getByRole('heading').textContent).toBe('empty')

    fireEvent.click(getByRole('button', { name: /mutate/i }))

    await waitFor(() => {
      expect(getByRole('heading').textContent).toBe('mutation')
    })

    fireEvent.click(getByRole('button', { name: /reset/i }))

    await waitFor(() => {
      expect(getByRole('heading').textContent).toBe('empty')
    })
  })

  it('should be able to reset `error`', async () => {
    function Page() {
      const { mutate, error, reset } = useMutation<string, Error>({
        mutationFn: () => {
          const err = new Error('Expected mock error. All is well!')
          err.stack = ''
          return Promise.reject(err)
        },
      })

      return (
        <div>
          {error && <h1>{error.message}</h1>}
          <button onClick={() => reset()}>reset</button>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const { getByRole, queryByRole } = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      expect(queryByRole('heading')).toBeNull()
    })

    fireEvent.click(getByRole('button', { name: /mutate/i }))

    await waitFor(() => {
      expect(getByRole('heading').textContent).toBe(
        'Expected mock error. All is well!',
      )
    })

    fireEvent.click(getByRole('button', { name: /reset/i }))

    await waitFor(() => {
      expect(queryByRole('heading')).toBeNull()
    })
  })

  it('should be able to call `onSuccess` and `onSettled` after each successful mutate', async () => {
    let count = 0
    const onSuccessMock = vi.fn()
    const onSettledMock = vi.fn()

    function Page() {
      const { mutate } = useMutation({
        mutationFn: (vars: { count: number }) => Promise.resolve(vars.count),

        onSuccess: (data) => {
          onSuccessMock(data)
        },
        onSettled: (data) => {
          onSettledMock(data)
        },
      })

      return (
        <div>
          <h1>{count}</h1>
          <button onClick={() => mutate({ count: ++count })}>mutate</button>
        </div>
      )
    }

    const { getByRole } = renderWithClient(queryClient, <Page />)

    expect(getByRole('heading').textContent).toBe('0')

    fireEvent.click(getByRole('button', { name: /mutate/i }))
    fireEvent.click(getByRole('button', { name: /mutate/i }))
    fireEvent.click(getByRole('button', { name: /mutate/i }))

    await waitFor(() => {
      expect(getByRole('heading').textContent).toBe('3')
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
    let count = 0
    type Value = { count: number }

    const mutateFn = vi.fn<[value: Value], Promise<Value>>()

    mutateFn.mockImplementationOnce(() => {
      return Promise.reject(new Error('Error test Jonas'))
    })

    mutateFn.mockImplementation(async (value) => {
      await sleep(10)
      return Promise.resolve(value)
    })

    function Page() {
      const { mutate, failureCount, failureReason, data, status } = useMutation(
        { mutationFn: mutateFn },
      )

      return (
        <div>
          <h1>Data {data?.count}</h1>
          <h2>Status {status}</h2>
          <h2>Failed {failureCount} times</h2>
          <h2>Failed because {failureReason?.message ?? 'null'}</h2>
          <button onClick={() => mutate({ count: ++count })}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('Data'))

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await waitFor(() => rendered.getByText('Data'))
    await waitFor(() => rendered.getByText('Status error'))
    await waitFor(() => rendered.getByText('Failed 1 times'))
    await waitFor(() => rendered.getByText('Failed because Error test Jonas'))

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await waitFor(() => rendered.getByText('Status pending'))
    await waitFor(() => rendered.getByText('Status success'))
    await waitFor(() => rendered.getByText('Data 2'))
    await waitFor(() => rendered.getByText('Failed 0 times'))
    await waitFor(() => rendered.getByText('Failed because null'))
  })

  it('should be able to call `onError` and `onSettled` after each failed mutate', async () => {
    const onErrorMock = vi.fn()
    const onSettledMock = vi.fn()
    let count = 0

    function Page() {
      const { mutate } = useMutation({
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
      })

      return (
        <div>
          <h1>{count}</h1>
          <button onClick={() => mutate({ count: ++count })}>mutate</button>
        </div>
      )
    }

    const { getByRole } = renderWithClient(queryClient, <Page />)

    expect(getByRole('heading').textContent).toBe('0')

    fireEvent.click(getByRole('button', { name: /mutate/i }))
    fireEvent.click(getByRole('button', { name: /mutate/i }))
    fireEvent.click(getByRole('button', { name: /mutate/i }))

    await waitFor(() => {
      expect(getByRole('heading').textContent).toBe('3')
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
    const callbacks: Array<string> = []

    function Page() {
      const { mutateAsync } = useMutation({
        mutationFn: async (text: string) => text,
        onSuccess: async () => {
          callbacks.push('useMutation.onSuccess')
        },
        onSettled: async () => {
          callbacks.push('useMutation.onSettled')
        },
      })

      React.useEffect(() => {
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
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

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
    const callbacks: Array<string> = []

    function Page() {
      const { mutateAsync } = useMutation({
        mutationFn: async (_text: string) => Promise.reject(new Error('oops')),
        onError: async () => {
          callbacks.push('useMutation.onError')
        },
        onSettled: async () => {
          callbacks.push('useMutation.onSettled')
        },
      })

      React.useEffect(() => {
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
            callbacks.push(`mutateAsync.error:${(error as Error).message}`)
          }
        }, 10)
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

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

    queryClient.setMutationDefaults(key, {
      mutationFn: async (text: string) => {
        await sleep(10)
        return text
      },
    })

    const states: Array<UseMutationResult<any, any, any, any>> = []

    function Page() {
      const state = useMutation<string, unknown, string>({ mutationKey: key })

      states.push(state)

      const { mutate } = state

      React.useEffect(() => {
        setActTimeout(() => {
          mutate('todo')
        }, 10)
      }, [mutate])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(100)

    expect(states.length).toBe(3)
    expect(states[0]).toMatchObject({ data: undefined, isPending: false })
    expect(states[1]).toMatchObject({ data: undefined, isPending: true })
    expect(states[2]).toMatchObject({ data: 'todo', isPending: false })
  })

  it('should be able to retry a failed mutation', async () => {
    let count = 0

    function Page() {
      const { mutate } = useMutation({
        mutationFn: (_text: string) => {
          count++
          return Promise.reject(new Error('oops'))
        },
        retry: 1,
        retryDelay: 5,
      })

      React.useEffect(() => {
        setActTimeout(() => {
          mutate('todo')
        }, 10)
      }, [mutate])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(100)

    expect(count).toBe(2)
  })

  it('should not retry mutations while offline', async () => {
    const onlineMock = mockOnlineManagerIsOnline(false)

    let count = 0

    function Page() {
      const mutation = useMutation({
        mutationFn: (_text: string) => {
          count++
          return Promise.reject(new Error('oops'))
        },
        retry: 1,
        retryDelay: 5,
      })

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>
            error:{' '}
            {mutation.error instanceof Error ? mutation.error.message : 'null'},
            status: {mutation.status}, isPaused: {String(mutation.isPaused)}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      expect(
        rendered.getByText('error: null, status: idle, isPaused: false'),
      ).toBeInTheDocument()
    })

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await waitFor(() => {
      expect(
        rendered.getByText('error: null, status: pending, isPaused: true'),
      ).toBeInTheDocument()
    })

    expect(count).toBe(0)

    onlineMock.mockReturnValue(true)
    queryClient.getMutationCache().resumePausedMutations()

    await sleep(100)

    await waitFor(() => {
      expect(
        rendered.getByText('error: oops, status: error, isPaused: false'),
      ).toBeInTheDocument()
    })

    expect(count).toBe(2)
    onlineMock.mockRestore()
  })

  it('should call onMutate even if paused', async () => {
    const onlineMock = mockOnlineManagerIsOnline(false)
    const onMutate = vi.fn()
    let count = 0

    function Page() {
      const mutation = useMutation({
        mutationFn: async (_text: string) => {
          count++
          await sleep(10)
          return count
        },
        onMutate,
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

    const rendered = renderWithClient(queryClient, <Page />)

    await rendered.findByText('data: null, status: idle, isPaused: false')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await rendered.findByText('data: null, status: pending, isPaused: true')

    expect(onMutate).toHaveBeenCalledTimes(1)
    expect(onMutate).toHaveBeenCalledWith('todo')

    onlineMock.mockReturnValue(true)
    queryClient.getMutationCache().resumePausedMutations()

    await rendered.findByText('data: 1, status: success, isPaused: false')

    expect(onMutate).toHaveBeenCalledTimes(1)
    expect(count).toBe(1)

    onlineMock.mockRestore()
  })

  it('should optimistically go to paused state if offline', async () => {
    const onlineMock = mockOnlineManagerIsOnline(false)
    let count = 0
    const states: Array<string> = []

    function Page() {
      const mutation = useMutation({
        mutationFn: async (_text: string) => {
          count++
          await sleep(10)
          return count
        },
      })

      states.push(`${mutation.status}, ${mutation.isPaused}`)

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

    const rendered = renderWithClient(queryClient, <Page />)

    await rendered.findByText('data: null, status: idle, isPaused: false')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await rendered.findByText('data: null, status: pending, isPaused: true')

    // no intermediate 'pending, false' state is expected because we don't start mutating!
    expect(states[0]).toBe('idle, false')
    expect(states[1]).toBe('pending, true')

    onlineMock.mockReturnValue(true)
    queryClient.getMutationCache().resumePausedMutations()

    await rendered.findByText('data: 1, status: success, isPaused: false')

    onlineMock.mockRestore()
  })

  it('should be able to retry a mutation when online', async () => {
    const onlineMock = mockOnlineManagerIsOnline(false)
    const key = queryKey()

    let count = 0

    function Page() {
      const state = useMutation({
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
        networkMode: 'offlineFirst',
      })

      return (
        <div>
          <button onClick={() => state.mutate('todo')}>mutate</button>
          <div>status: {state.status}</div>
          <div>isPaused: {String(state.isPaused)}</div>
          <div>data: {state.data ?? 'null'}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('status: idle'))
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await waitFor(() => rendered.getByText('isPaused: true'))

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

    onlineMock.mockReturnValue(true)
    queryClient.getMutationCache().resumePausedMutations()

    await waitFor(() => rendered.getByText('data: data2'))

    expect(
      queryClient.getMutationCache().findAll({ mutationKey: key })[0]?.state,
    ).toMatchObject({
      status: 'success',
      isPaused: false,
      failureCount: 0,
      failureReason: null,
      data: 'data2',
    })

    onlineMock.mockRestore()
  })

  it('should not change state if unmounted', async () => {
    function Mutates() {
      const { mutate } = useMutation({ mutationFn: () => sleep(10) })
      return <button onClick={() => mutate()}>mutate</button>
    }
    function Page() {
      const [mounted, setMounted] = React.useState(true)
      return (
        <div>
          <button onClick={() => setMounted(false)}>unmount</button>
          {mounted && <Mutates />}
        </div>
      )
    }

    const { getByText } = renderWithClient(queryClient, <Page />)
    fireEvent.click(getByText('mutate'))
    fireEvent.click(getByText('unmount'))
  })

  it('should be able to throw an error when throwOnError is set to true', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    function Page() {
      const { mutate } = useMutation<string, Error>({
        mutationFn: () => {
          const err = new Error('Expected mock error. All is well!')
          err.stack = ''
          return Promise.reject(err)
        },
        throwOnError: true,
      })

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const { getByText, queryByText } = renderWithClient(
      queryClient,
      <ErrorBoundary
        fallbackRender={() => (
          <div>
            <span>error</span>
          </div>
        )}
      >
        <Page />
      </ErrorBoundary>,
    )

    fireEvent.click(getByText('mutate'))

    await waitFor(() => {
      expect(queryByText('error')).not.toBeNull()
    })

    expect(consoleMock).toHaveBeenCalledWith(
      expect.objectContaining(new Error('Expected mock error. All is well!')),
    )

    consoleMock.mockRestore()
  })

  it('should be able to throw an error when throwOnError is a function that returns true', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    let boundary = false
    function Page() {
      const { mutate, error } = useMutation<string, Error>({
        mutationFn: () => {
          const err = new Error('mock error')
          err.stack = ''
          return Promise.reject(err)
        },
        throwOnError: () => {
          boundary = !boundary
          return !boundary
        },
      })

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
          {error && error.message}
        </div>
      )
    }

    const { getByText, queryByText } = renderWithClient(
      queryClient,
      <ErrorBoundary
        fallbackRender={() => (
          <div>
            <span>error boundary</span>
          </div>
        )}
      >
        <Page />
      </ErrorBoundary>,
    )

    // first error goes to component
    fireEvent.click(getByText('mutate'))
    await waitFor(() => {
      expect(queryByText('mock error')).not.toBeNull()
    })

    // second error goes to boundary
    fireEvent.click(getByText('mutate'))
    await waitFor(() => {
      expect(queryByText('error boundary')).not.toBeNull()
    })
    consoleMock.mockRestore()
  })

  it('should pass meta to mutation', async () => {
    const errorMock = vi.fn()
    const successMock = vi.fn()

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
      const { mutate: succeed, isSuccess } = useMutation({
        mutationFn: async () => '',
        meta: { metaSuccessMessage },
      })
      const { mutate: error, isError } = useMutation({
        mutationFn: async () => {
          throw new Error('')
        },
        meta: { metaErrorMessage },
      })

      return (
        <div>
          <button onClick={() => succeed()}>succeed</button>
          <button onClick={() => error()}>error</button>
          {isSuccess && <div>successTest</div>}
          {isError && <div>errorTest</div>}
        </div>
      )
    }

    const { getByText, queryByText } = renderWithClient(
      queryClientMutationMeta,
      <Page />,
    )

    fireEvent.click(getByText('succeed'))
    fireEvent.click(getByText('error'))

    await waitFor(() => {
      expect(queryByText('successTest')).not.toBeNull()
      expect(queryByText('errorTest')).not.toBeNull()
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
      const [show, setShow] = React.useState(true)
      return (
        <div>
          <button onClick={() => setShow(false)}>hide</button>
          {show && <Component />}
        </div>
      )
    }

    function Component() {
      const mutation = useMutation({
        mutationFn: async (_text: string) => {
          count++
          await sleep(10)
          return count
        },
        mutationKey,
        gcTime: 0,
        onSuccess,
        onSettled,
      })

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

    const rendered = renderWithClient(queryClient, <Page />)

    await rendered.findByText('data: null, status: idle, isPaused: false')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /hide/i }))

    await waitFor(() => {
      expect(
        queryClient.getMutationCache().findAll({ mutationKey }),
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
      const mutation = useMutation({
        mutationFn: async (text: string) => {
          count++
          const result = `result-${text}`
          await sleep(10)
          return result
        },
        onSuccess,
        onSettled,
      })

      return (
        <div>
          <button
            onClick={() =>
              mutation.mutate('todo1', {
                onSuccess: onSuccessMutate,
                onSettled: onSettledMutate,
              })
            }
          >
            mutate1
          </button>
          <button
            onClick={() =>
              mutation.mutate('todo2', {
                onSuccess: onSuccessMutate,
                onSettled: onSettledMutate,
              })
            }
          >
            mutate2
          </button>
          <div>
            data: {mutation.data ?? 'null'}, status: {mutation.status}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await rendered.findByText('data: null, status: idle')

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))

    await rendered.findByText('data: result-todo2, status: success')

    expect(count).toBe(2)

    expect(onSuccess).toHaveBeenCalledTimes(2)
    expect(onSuccess).toHaveBeenNthCalledWith(
      1,
      'result-todo1',
      'todo1',
      undefined,
    )
    expect(onSuccess).toHaveBeenNthCalledWith(
      2,
      'result-todo2',
      'todo2',
      undefined,
    )
    expect(onSettled).toHaveBeenCalledTimes(2)
    expect(onSuccessMutate).toHaveBeenCalledTimes(1)
    expect(onSuccessMutate).toHaveBeenCalledWith(
      'result-todo2',
      'todo2',
      undefined,
    )
    expect(onSettledMutate).toHaveBeenCalledTimes(1)
    expect(onSettledMutate).toHaveBeenCalledWith(
      'result-todo2',
      null,
      'todo2',
      undefined,
    )
  })

  it('should go to error state if onSuccess callback errors', async () => {
    const error = new Error('error from onSuccess')
    const onError = vi.fn()

    function Page() {
      const mutation = useMutation({
        mutationFn: async (_text: string) => {
          await sleep(10)
          return 'result'
        },
        onSuccess: () => Promise.reject(error),
        onError,
      })

      return (
        <div>
          <button onClick={() => mutation.mutate('todo')}>mutate</button>
          <div>status: {mutation.status}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await rendered.findByText('status: idle')

    rendered.getByRole('button', { name: /mutate/i }).click()

    await rendered.findByText('status: error')

    expect(onError).toHaveBeenCalledWith(error, 'todo', undefined)
  })

  it('should go to error state if onError callback errors', async () => {
    const error = new Error('error from onError')
    const mutateFnError = new Error('mutateFnError')

    function Page() {
      const mutation = useMutation({
        mutationFn: async (_text: string) => {
          await sleep(10)
          throw mutateFnError
        },
        onError: () => Promise.reject(error),
      })

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

    const rendered = renderWithClient(queryClient, <Page />)

    await rendered.findByText('error: null, status: idle')

    rendered.getByRole('button', { name: /mutate/i }).click()

    await rendered.findByText('error: mutateFnError, status: error')
  })

  it('should go to error state if onSettled callback errors', async () => {
    const error = new Error('error from onSettled')
    const mutateFnError = new Error('mutateFnError')
    const onError = vi.fn()

    function Page() {
      const mutation = useMutation({
        mutationFn: async (_text: string) => {
          await sleep(10)
          throw mutateFnError
        },
        onSettled: () => Promise.reject(error),
        onError,
      })

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

    const rendered = renderWithClient(queryClient, <Page />)

    await rendered.findByText('error: null, status: idle')

    rendered.getByRole('button', { name: /mutate/i }).click()

    await rendered.findByText('error: mutateFnError, status: error')

    expect(onError).toHaveBeenCalledWith(mutateFnError, 'todo', undefined)
  })

  it('should use provided custom queryClient', async () => {
    function Page() {
      const mutation = useMutation(
        {
          mutationFn: async (text: string) => {
            return Promise.resolve(text)
          },
        },
        queryClient,
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

    const rendered = render(<Page></Page>)

    await rendered.findByText('data: null, status: idle')

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await waitFor(() =>
      rendered.findByText('data: custom client, status: success'),
    )
  })
})
