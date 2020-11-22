import { fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

import { useMutation, QueryClient, QueryCache, MutationCache } from '../..'
import { UseMutationResult } from '../types'
import {
  mockConsoleError,
  mockNavigatorOnLine,
  queryKey,
  renderWithClient,
  setActTimeout,
  sleep,
} from './utils'

describe('useMutation', () => {
  const queryCache = new QueryCache()
  const mutationCache = new MutationCache()
  const queryClient = new QueryClient({ queryCache, mutationCache })

  it('should be able to reset `data`', async () => {
    function Page() {
      const { mutate, data = '', reset } = useMutation(() =>
        Promise.resolve('mutation')
      )

      return (
        <div>
          <h1 data-testid="title">{data}</h1>
          <button onClick={() => reset()}>reset</button>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const { getByTestId, getByText } = renderWithClient(queryClient, <Page />)

    expect(getByTestId('title').textContent).toBe('')

    fireEvent.click(getByText('mutate'))

    await waitFor(() => getByTestId('title'))

    expect(getByTestId('title').textContent).toBe('mutation')

    fireEvent.click(getByText('reset'))

    await waitFor(() => getByTestId('title'))

    expect(getByTestId('title').textContent).toBe('')
  })

  it('should be able to reset `error`', async () => {
    const consoleMock = mockConsoleError()

    function Page() {
      const { mutate, error, reset } = useMutation<string, Error>(() => {
        const err = new Error('Expected mock error. All is well!')
        err.stack = ''
        return Promise.reject(err)
      })

      return (
        <div>
          {error && <h1 data-testid="error">{error.message}</h1>}
          <button onClick={() => reset()}>reset</button>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const { getByTestId, getByText, queryByTestId } = renderWithClient(
      queryClient,
      <Page />
    )

    expect(queryByTestId('error')).toBeNull()

    fireEvent.click(getByText('mutate'))

    await waitFor(() => getByTestId('error'))

    expect(getByTestId('error').textContent).toBe(
      'Expected mock error. All is well!'
    )

    fireEvent.click(getByText('reset'))

    await waitFor(() => expect(queryByTestId('error')).toBeNull())

    consoleMock.mockRestore()
  })

  it('should be able to call `onSuccess` and `onSettled` after each successful mutate', async () => {
    let count = 0
    const onSuccessMock = jest.fn()
    const onSettledMock = jest.fn()

    function Page() {
      const { mutate } = useMutation(
        async (vars: { count: number }) => Promise.resolve(vars.count),
        {
          onSuccess: data => {
            onSuccessMock(data)
          },
          onSettled: data => {
            onSettledMock(data)
          },
        }
      )

      return (
        <div>
          <h1 data-testid="title">{count}</h1>
          <button onClick={() => mutate({ count: ++count })}>mutate</button>
        </div>
      )
    }

    const { getByTestId, getByText } = renderWithClient(queryClient, <Page />)

    expect(getByTestId('title').textContent).toBe('0')

    fireEvent.click(getByText('mutate'))
    fireEvent.click(getByText('mutate'))
    fireEvent.click(getByText('mutate'))

    await waitFor(() => getByTestId('title'))

    expect(onSuccessMock).toHaveBeenCalledTimes(3)
    expect(onSuccessMock).toHaveBeenCalledWith(1)
    expect(onSuccessMock).toHaveBeenCalledWith(2)
    expect(onSuccessMock).toHaveBeenCalledWith(3)

    expect(onSettledMock).toHaveBeenCalledTimes(3)
    expect(onSettledMock).toHaveBeenCalledWith(1)
    expect(onSettledMock).toHaveBeenCalledWith(2)
    expect(onSettledMock).toHaveBeenCalledWith(3)

    expect(getByTestId('title').textContent).toBe('3')
  })

  it('should be able to call `onError` and `onSettled` after each failed mutate', async () => {
    const consoleMock = mockConsoleError()

    const onErrorMock = jest.fn()
    const onSettledMock = jest.fn()
    let count = 0

    function Page() {
      const { mutate } = useMutation(
        (vars: { count: number }) => {
          const error = new Error(
            `Expected mock error. All is well! ${vars.count}`
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
        }
      )

      return (
        <div>
          <h1 data-testid="title">{count}</h1>
          <button onClick={() => mutate({ count: ++count })}>mutate</button>
        </div>
      )
    }

    const { getByTestId, getByText } = renderWithClient(queryClient, <Page />)

    expect(getByTestId('title').textContent).toBe('0')

    fireEvent.click(getByText('mutate'))
    fireEvent.click(getByText('mutate'))
    fireEvent.click(getByText('mutate'))

    await waitFor(() => getByTestId('title'))

    expect(onErrorMock).toHaveBeenCalledTimes(3)
    expect(onErrorMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 1'
    )
    expect(onErrorMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 2'
    )
    expect(onErrorMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 3'
    )

    expect(onSettledMock).toHaveBeenCalledTimes(3)
    expect(onSettledMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 1'
    )
    expect(onSettledMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 2'
    )
    expect(onSettledMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 3'
    )

    expect(getByTestId('title').textContent).toBe('3')

    consoleMock.mockRestore()
  })

  it('should be able to override the useMutation success callbacks', async () => {
    const callbacks: string[] = []

    function Page() {
      const { mutateAsync } = useMutation(async (text: string) => text, {
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
    const consoleMock = mockConsoleError()

    const callbacks: string[] = []

    function Page() {
      const { mutateAsync } = useMutation(
        async (_text: string) => Promise.reject('oops'),
        {
          onError: async () => {
            callbacks.push('useMutation.onError')
          },
          onSettled: async () => {
            callbacks.push('useMutation.onSettled')
          },
        }
      )

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
            callbacks.push(`mutateAsync.error:${error}`)
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

    consoleMock.mockRestore()
  })

  it('should be able to use mutation defaults', async () => {
    const key = queryKey()

    queryClient.setMutationDefaults(key, {
      mutationFn: async (text: string) => text,
    })

    const states: UseMutationResult<any, any, any, any>[] = []

    function Page() {
      const state = useMutation<string, unknown, string>(key)

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
    expect(states[0]).toMatchObject({ data: undefined, isLoading: false })
    expect(states[1]).toMatchObject({ data: undefined, isLoading: true })
    expect(states[2]).toMatchObject({ data: 'todo', isLoading: false })
  })

  it('should be able to retry a failed mutation', async () => {
    const consoleMock = mockConsoleError()

    let count = 0

    function Page() {
      const { mutate } = useMutation(
        (_text: string) => {
          count++
          return Promise.reject('oops')
        },
        {
          retry: 1,
          retryDelay: 5,
        }
      )

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

    consoleMock.mockRestore()
  })

  it('should be able to retry a mutation when online', async () => {
    const consoleMock = mockConsoleError()
    mockNavigatorOnLine(false)

    let count = 0
    const states: UseMutationResult<any, any, any, any>[] = []

    function Page() {
      const state = useMutation(
        (_text: string) => {
          count++
          return count > 1 ? Promise.resolve('data') : Promise.reject('oops')
        },
        {
          retry: 1,
          retryDelay: 5,
        }
      )

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

    await sleep(50)

    expect(states.length).toBe(4)
    expect(states[0]).toMatchObject({
      isLoading: false,
      isPaused: false,
      failureCount: 0,
    })
    expect(states[1]).toMatchObject({
      isLoading: true,
      isPaused: false,
      failureCount: 0,
    })
    expect(states[2]).toMatchObject({
      isLoading: true,
      isPaused: false,
      failureCount: 1,
    })
    expect(states[3]).toMatchObject({
      isLoading: true,
      isPaused: true,
      failureCount: 1,
    })

    mockNavigatorOnLine(true)
    window.dispatchEvent(new Event('online'))

    await sleep(50)

    expect(states.length).toBe(6)
    expect(states[4]).toMatchObject({
      isLoading: true,
      isPaused: false,
      failureCount: 1,
    })
    expect(states[5]).toMatchObject({
      isLoading: false,
      isPaused: false,
      failureCount: 1,
      data: 'data',
    })

    consoleMock.mockRestore()
  })

  it('should not change state if unmounted', async () => {
    function Mutates() {
      const { mutate } = useMutation(() => sleep(10))
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
})
