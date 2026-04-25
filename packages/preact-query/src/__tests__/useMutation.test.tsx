import { queryKey, sleep } from '@tanstack/query-test-utils'
import { fireEvent, render } from '@testing-library/preact'
import { useEffect, useState } from 'preact/hooks'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MutationCache, QueryCache, QueryClient, useMutation } from '..'
import type { UseMutationResult } from '../types'
import { ErrorBoundary } from './ErrorBoundary'
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
    queryCache = new QueryCache()
    mutationCache = new MutationCache()
    queryClient = new QueryClient({
      queryCache,
      mutationCache,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    queryClient.clear()
  })

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

    await vi.advanceTimersByTimeAsync(0)
    expect(getByRole('heading').textContent).toBe('mutation')

    fireEvent.click(getByRole('button', { name: /reset/i }))

    await vi.advanceTimersByTimeAsync(0)
    expect(getByRole('heading').textContent).toBe('empty')
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

    expect(queryByRole('heading')).toBeNull()

    fireEvent.click(getByRole('button', { name: /mutate/i }))

    await vi.advanceTimersByTimeAsync(0)
    expect(getByRole('heading').textContent).toBe(
      'Expected mock error. All is well!',
    )

    fireEvent.click(getByRole('button', { name: /reset/i }))

    await vi.advanceTimersByTimeAsync(0)
    expect(queryByRole('heading')).toBeNull()
  })

  it('should call mutate callbacks when useMutation has no callbacks', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutate } = useMutation({
        mutationFn: (text: string) => sleep(10).then(() => text),
      })

      return (
        <button
          onClick={() =>
            mutate('todo', {
              onSuccess: () => {
                callbacks.push('mutate.onSuccess')
              },
              onSettled: () => {
                callbacks.push('mutate.onSettled')
              },
            })
          }
        >
          mutate
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['mutate.onSuccess', 'mutate.onSettled'])
  })

  it('should call mutateAsync callbacks when useMutation has no callbacks', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutateAsync } = useMutation({
        mutationFn: (text: string) => sleep(10).then(() => text),
      })

      useEffect(() => {
        setActTimeout(async () => {
          await mutateAsync('todo', {
            onSuccess: () => {
              callbacks.push('mutateAsync.onSuccess')
            },
            onSettled: () => {
              callbacks.push('mutateAsync.onSettled')
            },
          })
        }, 0)
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual([
      'mutateAsync.onSuccess',
      'mutateAsync.onSettled',
    ])
  })

  it('should call mutate error callbacks when useMutation has no callbacks', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutate } = useMutation({
        mutationFn: (_text: string) =>
          sleep(10).then(() => {
            throw new Error('oops')
          }),
      })

      return (
        <button
          onClick={() =>
            mutate('todo', {
              onError: () => {
                callbacks.push('mutate.onError')
              },
              onSettled: () => {
                callbacks.push('mutate.onSettled')
              },
            })
          }
        >
          mutate
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['mutate.onError', 'mutate.onSettled'])
  })

  it('should call mutateAsync error callbacks when useMutation has no callbacks', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutateAsync } = useMutation({
        mutationFn: async (_text: string) =>
          sleep(10).then(() => {
            throw new Error('oops')
          }),
      })

      useEffect(() => {
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
          } catch {}
        }, 0)
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['mutateAsync.onError', 'mutateAsync.onSettled'])
  })

  it('should call only mutate onSuccess when useMutation has no callbacks', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutate } = useMutation({
        mutationFn: (text: string) => sleep(10).then(() => text),
      })

      return (
        <button
          onClick={() =>
            mutate('todo', {
              onSuccess: () => {
                callbacks.push('mutate.onSuccess')
              },
            })
          }
        >
          mutate
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['mutate.onSuccess'])
  })

  it('should call only mutate onError when useMutation has no callbacks', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutate } = useMutation({
        mutationFn: (_text: string) =>
          sleep(10).then(() => {
            throw new Error('oops')
          }),
      })

      return (
        <button
          onClick={() =>
            mutate('todo', {
              onError: () => {
                callbacks.push('mutate.onError')
              },
            })
          }
        >
          mutate
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['mutate.onError'])
  })

  it('should call only mutate onSettled when useMutation has no callbacks', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutate } = useMutation({
        mutationFn: (text: string) => sleep(10).then(() => text),
      })

      return (
        <button
          onClick={() =>
            mutate('todo', {
              onSettled: () => {
                callbacks.push('mutate.onSettled')
              },
            })
          }
        >
          mutate
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['mutate.onSettled'])
  })

  it('should call only mutateAsync onSuccess when useMutation has no callbacks', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutateAsync } = useMutation({
        mutationFn: (text: string) => sleep(10).then(() => text),
      })

      useEffect(() => {
        setActTimeout(async () => {
          await mutateAsync('todo', {
            onSuccess: () => {
              callbacks.push('mutateAsync.onSuccess')
            },
          })
        }, 0)
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['mutateAsync.onSuccess'])
  })

  it('should call only mutateAsync onError when useMutation has no callbacks', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutateAsync } = useMutation({
        mutationFn: async (_text: string) =>
          sleep(10).then(() => {
            throw new Error('oops')
          }),
      })

      useEffect(() => {
        setActTimeout(async () => {
          try {
            await mutateAsync('todo', {
              onError: () => {
                callbacks.push('mutateAsync.onError')
              },
            })
          } catch {}
        }, 0)
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['mutateAsync.onError'])
  })

  it('should call only mutateAsync onSettled when useMutation has no callbacks', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutateAsync } = useMutation({
        mutationFn: (text: string) => sleep(10).then(() => text),
      })

      useEffect(() => {
        setActTimeout(async () => {
          await mutateAsync('todo', {
            onSettled: () => {
              callbacks.push('mutateAsync.onSettled')
            },
          })
        }, 0)
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['mutateAsync.onSettled'])
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

    await vi.advanceTimersByTimeAsync(0)
    expect(getByRole('heading').textContent).toBe('3')
    expect(onSuccessMock).toHaveBeenCalledTimes(3)

    expect(onSuccessMock).toHaveBeenCalledWith(1)
    expect(onSuccessMock).toHaveBeenCalledWith(2)
    expect(onSuccessMock).toHaveBeenCalledWith(3)

    expect(onSettledMock).toHaveBeenCalledTimes(3)

    expect(onSettledMock).toHaveBeenCalledWith(1)
    expect(onSettledMock).toHaveBeenCalledWith(2)
    expect(onSettledMock).toHaveBeenCalledWith(3)
  })

  it('should set correct values for `failureReason` and `failureCount` on multiple mutate calls', async () => {
    let count = 0
    type Value = { count: number }

    const mutateFn = vi.fn<(value: Value) => Promise<Value>>()

    mutateFn.mockImplementationOnce(() => {
      return Promise.reject(new Error('Error test Jonas'))
    })

    mutateFn.mockImplementation((value) =>
      sleep(10).then(() => Promise.resolve(value)),
    )

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

    expect(rendered.getByText('Data')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Status error')).toBeInTheDocument()
    expect(rendered.getByText('Failed 1 times')).toBeInTheDocument()
    expect(
      rendered.getByText('Failed because Error test Jonas'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Status pending')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Status success')).toBeInTheDocument()
    expect(rendered.getByText('Data 2')).toBeInTheDocument()
    expect(rendered.getByText('Failed 0 times')).toBeInTheDocument()
    expect(rendered.getByText('Failed because null')).toBeInTheDocument()
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

    await vi.advanceTimersByTimeAsync(0)
    expect(getByRole('heading').textContent).toBe('3')
    expect(onErrorMock).toHaveBeenCalledTimes(3)
    expect(onErrorMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 1',
    )
    expect(onErrorMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 2',
    )
    expect(onErrorMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 3',
    )

    expect(onSettledMock).toHaveBeenCalledTimes(3)
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

  it('should be able to call `onSuccess` callback after successful mutate', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutate } = useMutation({
        mutationFn: (text: string) => sleep(10).then(() => text),
        onSuccess: () => {
          callbacks.push('useMutation.onSuccess')
        },
      })

      return (
        <button
          onClick={() =>
            mutate('todo', {
              onSuccess: () => {
                callbacks.push('mutate.onSuccess')
              },
            })
          }
        >
          mutate
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['useMutation.onSuccess', 'mutate.onSuccess'])
  })

  it('should be able to call `onError` callback after failed mutate', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutate } = useMutation({
        mutationFn: (_text: string) =>
          sleep(10).then(() => {
            throw new Error('oops')
          }),
        onError: () => {
          callbacks.push('useMutation.onError')
        },
      })

      return (
        <button
          onClick={() =>
            mutate('todo', {
              onError: () => {
                callbacks.push('mutate.onError')
              },
            })
          }
        >
          mutate
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['useMutation.onError', 'mutate.onError'])
  })

  it('should be able to call `onSettled` callback after mutate', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutate } = useMutation({
        mutationFn: (text: string) => sleep(10).then(() => text),
        onSettled: () => {
          callbacks.push('useMutation.onSettled')
        },
      })

      return (
        <button
          onClick={() =>
            mutate('todo', {
              onSettled: () => {
                callbacks.push('mutate.onSettled')
              },
            })
          }
        >
          mutate
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['useMutation.onSettled', 'mutate.onSettled'])
  })

  it('should be able to call `onSuccess` callback after successful mutateAsync', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutateAsync } = useMutation({
        mutationFn: (text: string) => sleep(10).then(() => text),
        onSuccess: () => {
          callbacks.push('useMutation.onSuccess')
        },
      })

      useEffect(() => {
        setActTimeout(async () => {
          await mutateAsync('todo', {
            onSuccess: () => {
              callbacks.push('mutateAsync.onSuccess')
            },
          })
        }, 0)
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual([
      'useMutation.onSuccess',
      'mutateAsync.onSuccess',
    ])
  })

  it('should be able to call `onError` callback after failed mutateAsync', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutateAsync } = useMutation({
        mutationFn: async (_text: string) =>
          sleep(10).then(() => {
            throw new Error('oops')
          }),
        onError: () => {
          callbacks.push('useMutation.onError')
        },
      })

      useEffect(() => {
        setActTimeout(async () => {
          try {
            await mutateAsync('todo', {
              onError: () => {
                callbacks.push('mutateAsync.onError')
              },
            })
          } catch {}
        }, 0)
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual(['useMutation.onError', 'mutateAsync.onError'])
  })

  it('should be able to call `onSettled` callback after mutateAsync', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutateAsync } = useMutation({
        mutationFn: (text: string) => sleep(10).then(() => text),
        onSettled: () => {
          callbacks.push('useMutation.onSettled')
        },
      })

      useEffect(() => {
        setActTimeout(async () => {
          await mutateAsync('todo', {
            onSettled: () => {
              callbacks.push('mutateAsync.onSettled')
            },
          })
        }, 0)
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual([
      'useMutation.onSettled',
      'mutateAsync.onSettled',
    ])
  })

  it('should be able to override the useMutation success callbacks', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutateAsync } = useMutation({
        mutationFn: (text: string) => Promise.resolve(text),
        onSuccess: () => {
          callbacks.push('useMutation.onSuccess')
          return Promise.resolve()
        },
        onSettled: () => {
          callbacks.push('useMutation.onSettled')
          return Promise.resolve()
        },
      })

      useEffect(() => {
        setActTimeout(async () => {
          try {
            const result = await mutateAsync('todo', {
              onSuccess: () => {
                callbacks.push('mutateAsync.onSuccess')
                return Promise.resolve()
              },
              onSettled: () => {
                callbacks.push('mutateAsync.onSettled')
                return Promise.resolve()
              },
            })
            callbacks.push(`mutateAsync.result:${result}`)
          } catch {}
        }, 10)
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

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
      const { mutateAsync } = useMutation({
        mutationFn: async (_text: string) => Promise.reject(new Error('oops')),
        onError: () => {
          callbacks.push('useMutation.onError')
          return Promise.resolve()
        },
        onSettled: () => {
          callbacks.push('useMutation.onSettled')
          return Promise.resolve()
        },
      })

      useEffect(() => {
        setActTimeout(async () => {
          try {
            await mutateAsync('todo', {
              onError: () => {
                callbacks.push('mutateAsync.onError')
                return Promise.resolve()
              },
              onSettled: () => {
                callbacks.push('mutateAsync.onSettled')
                return Promise.resolve()
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

    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual([
      'useMutation.onError',
      'useMutation.onSettled',
      'mutateAsync.onError',
      'mutateAsync.onSettled',
      'mutateAsync.error:oops',
    ])
  })

  it('should be able to override the error callbacks when using mutate', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutate } = useMutation({
        mutationFn: async (_text: string) =>
          sleep(10).then(() => Promise.reject(new Error('oops'))),
        onError: () => {
          callbacks.push('useMutation.onError')
        },
        onSettled: () => {
          callbacks.push('useMutation.onSettled')
        },
      })

      return (
        <button
          onClick={() =>
            mutate('todo', {
              onError: () => {
                callbacks.push('mutate.onError')
              },
              onSettled: () => {
                callbacks.push('mutate.onSettled')
              },
            })
          }
        >
          mutate
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual([
      'useMutation.onError',
      'useMutation.onSettled',
      'mutate.onError',
      'mutate.onSettled',
    ])
  })

  it('should be able to override the settled callbacks when using mutate', async () => {
    const callbacks: Array<string> = []

    function Page() {
      const { mutate } = useMutation({
        mutationFn: (text: string) => sleep(10).then(() => text),
        onSuccess: () => {
          callbacks.push('useMutation.onSuccess')
        },
        onSettled: () => {
          callbacks.push('useMutation.onSettled')
        },
      })

      return (
        <button
          onClick={() =>
            mutate('todo', {
              onSuccess: () => {
                callbacks.push('mutate.onSuccess')
              },
              onSettled: () => {
                callbacks.push('mutate.onSettled')
              },
            })
          }
        >
          mutate
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks).toEqual([
      'useMutation.onSuccess',
      'useMutation.onSettled',
      'mutate.onSuccess',
      'mutate.onSettled',
    ])
  })

  it('should be able to use mutation defaults', async () => {
    const key = queryKey()

    queryClient.setMutationDefaults(key, {
      mutationFn: (text: string) => sleep(10).then(() => text),
    })

    const states: Array<UseMutationResult<any, any, any, any>> = []

    function Page() {
      const state = useMutation<string, unknown, string>({ mutationKey: key })

      states.push(state)

      const { mutate } = state

      useEffect(() => {
        setActTimeout(() => {
          mutate('todo')
        }, 10)
      }, [mutate])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(21)

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

      useEffect(() => {
        setActTimeout(() => {
          mutate('todo')
        }, 10)
      }, [mutate])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(15)

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

    expect(
      rendered.getByText('error: null, status: idle, isPaused: false'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText('error: null, status: pending, isPaused: true'),
    ).toBeInTheDocument()

    expect(count).toBe(0)

    onlineMock.mockReturnValue(true)
    queryClient.getMutationCache().resumePausedMutations()

    await vi.advanceTimersByTimeAsync(6)
    expect(
      rendered.getByText('error: oops, status: error, isPaused: false'),
    ).toBeInTheDocument()

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

    expect(
      rendered.getByText('data: null, status: idle, isPaused: false'),
    ).toBeInTheDocument()

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

    onlineMock.mockReturnValue(true)
    queryClient.getMutationCache().resumePausedMutations()
    await vi.advanceTimersByTimeAsync(11)
    expect(
      rendered.getByText('data: 1, status: success, isPaused: false'),
    ).toBeInTheDocument()

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

    expect(
      rendered.getByText('data: null, status: idle, isPaused: false'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText('data: null, status: pending, isPaused: true'),
    ).toBeInTheDocument()

    // no intermediate 'pending, false' state is expected because we don't start mutating!
    expect(states[0]).toBe('idle, false')
    expect(states[1]).toBe('pending, true')

    onlineMock.mockReturnValue(true)
    queryClient.getMutationCache().resumePausedMutations()

    await vi.advanceTimersByTimeAsync(11)
    expect(
      rendered.getByText('data: 1, status: success, isPaused: false'),
    ).toBeInTheDocument()

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

    expect(rendered.getByText('status: idle')).toBeInTheDocument()
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(16)
    expect(rendered.getByText('isPaused: true')).toBeInTheDocument()

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

    await vi.advanceTimersByTimeAsync(11)
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

    onlineMock.mockRestore()
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should not change state if unmounted', () => {
    function Mutates() {
      const { mutate } = useMutation({ mutationFn: () => sleep(10) })
      return <button onClick={() => mutate()}>mutate</button>
    }
    function Page() {
      const [mounted, setMounted] = useState(true)
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
    const err = new Error('Expected mock error. All is well!')
    err.stack = ''

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    function Page() {
      const { mutate } = useMutation<string, Error>({
        mutationFn: () => {
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

    await vi.advanceTimersByTimeAsync(0)
    expect(queryByText('error')).not.toBeNull()

    expect(consoleMock.mock.calls[0]?.[1]).toBe(err)

    consoleMock.mockRestore()
  })

  it('should be able to throw an error when throwOnError is a function that returns true', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    let boundary = false
    function Page() {
      const { mutate, error } = useMutation<string>({
        mutationFn: () => {
          const err = new Error('mock error')
          err.stack = ''
          return Promise.reject(err)
        },
        throwOnError: () => {
          return boundary
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
    await vi.advanceTimersByTimeAsync(0)
    expect(queryByText('mock error')).not.toBeNull()

    // second error goes to boundary
    boundary = true
    fireEvent.click(getByText('mutate'))
    await vi.advanceTimersByTimeAsync(0)
    expect(queryByText('error boundary')).not.toBeNull()
    consoleMock.mockRestore()
  })

  it('should not throw an error when throwOnError is set to false', async () => {
    function Page() {
      const { mutate, error } = useMutation<string, Error>({
        mutationFn: () =>
          sleep(10).then(() => {
            throw new Error('Expected mock error')
          }),
        throwOnError: false,
      })

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
          <div>error: {error?.message ?? 'null'}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByText('error: Expected mock error')).toBeInTheDocument()
  })

  it('should not throw an error when throwOnError is a function that returns false', async () => {
    function Page() {
      const { mutate, error } = useMutation<string, Error>({
        mutationFn: () =>
          sleep(10).then(() => {
            throw new Error('Expected mock error')
          }),
        throwOnError: () => false,
      })

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
          <div>error: {error?.message ?? 'null'}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByText('error: Expected mock error')).toBeInTheDocument()
  })

  it('should not throw an error when throwOnError is not set', async () => {
    function Page() {
      const { mutate, error } = useMutation<string, Error>({
        mutationFn: () =>
          sleep(10).then(() => {
            throw new Error('Expected mock error')
          }),
      })

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
          <div>error: {error?.message ?? 'null'}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByText('error: Expected mock error')).toBeInTheDocument()
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
      const { mutate: succeed, isSuccess } = useMutation({
        mutationFn: () => Promise.resolve(''),
        meta: { metaSuccessMessage },
      })
      const { mutate: error, isError } = useMutation({
        mutationFn: () => {
          return Promise.reject(new Error(''))
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

    await vi.advanceTimersByTimeAsync(0)
    expect(queryByText('successTest')).not.toBeNull()
    expect(queryByText('errorTest')).not.toBeNull()

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
      const [show, setShow] = useState(true)
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

    expect(
      rendered.getByText('data: null, status: idle, isPaused: false'),
    ).toBeInTheDocument()
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /hide/i }))

    await vi.advanceTimersByTimeAsync(10)
    expect(
      queryClient.getMutationCache().findAll({ mutationKey }),
    ).toHaveLength(0)

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

    expect(rendered.getByText('data: null, status: idle')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))

    await vi.advanceTimersByTimeAsync(11)
    expect(
      rendered.getByText('data: result-todo2, status: success'),
    ).toBeInTheDocument()

    expect(count).toBe(2)

    expect(onSuccess).toHaveBeenCalledTimes(2)
    expect(onSuccess).toHaveBeenNthCalledWith(
      1,
      'result-todo1',
      'todo1',
      undefined,
      {
        client: queryClient,
        meta: undefined,
        mutationKey: undefined,
      },
    )
    expect(onSuccess).toHaveBeenNthCalledWith(
      2,
      'result-todo2',
      'todo2',
      undefined,
      {
        client: queryClient,
        meta: undefined,
        mutationKey: undefined,
      },
    )
    expect(onSettled).toHaveBeenCalledTimes(2)
    expect(onSuccessMutate).toHaveBeenCalledTimes(1)
    expect(onSuccessMutate).toHaveBeenCalledWith(
      'result-todo2',
      'todo2',
      undefined,
      {
        client: queryClient,
        meta: undefined,
        mutationKey: undefined,
      },
    )
    expect(onSettledMutate).toHaveBeenCalledTimes(1)
    expect(onSettledMutate).toHaveBeenCalledWith(
      'result-todo2',
      null,
      'todo2',
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
      const mutation = useMutation({
        mutationFn: (_text: string) => sleep(10).then(() => 'result'),
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

    expect(rendered.getByText('status: idle')).toBeInTheDocument()

    rendered.getByRole('button', { name: /mutate/i }).click()

    await vi.advanceTimersByTimeAsync(11)
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
    const unhandledRejectionFn = vi.fn()
    process.on('unhandledRejection', (error) => unhandledRejectionFn(error))
    onTestFinished(() => {
      process.off('unhandledRejection', unhandledRejectionFn)
    })

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

    expect(rendered.getByText('error: null, status: idle')).toBeInTheDocument()

    rendered.getByRole('button', { name: /mutate/i }).click()

    await vi.advanceTimersByTimeAsync(11)
    expect(
      rendered.getByText('error: mutateFnError, status: error'),
    ).toBeInTheDocument()
  })

  it('should go to error state if onSettled callback errors', async ({
    onTestFinished,
  }) => {
    const unhandledRejectionFn = vi.fn()
    process.on('unhandledRejection', (error) => unhandledRejectionFn(error))
    onTestFinished(() => {
      process.off('unhandledRejection', unhandledRejectionFn)
    })

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

    expect(rendered.getByText('error: null, status: idle')).toBeInTheDocument()

    rendered.getByRole('button', { name: /mutate/i }).click()

    await vi.advanceTimersByTimeAsync(11)
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

    const rendered = render(<Page />)

    expect(rendered.getByText('data: null, status: idle')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText('data: custom client, status: success'),
    ).toBeInTheDocument()
  })

  it('should be able to chain mutateAsync calls sequentially', async () => {
    function Page() {
      const [result, setResult] = useState<string>('idle')

      const { mutateAsync: createUserAsync } = useMutation({
        mutationFn: (name: string) => sleep(10).then(() => ({ id: '1', name })),
      })

      const { mutateAsync: updateProfileAsync } = useMutation({
        mutationFn: (userId: string) =>
          sleep(10).then(() => `profile updated for ${userId}`),
      })

      return (
        <div>
          <button
            onClick={async () => {
              const user = await createUserAsync('John')
              const profile = await updateProfileAsync(user.id)
              setResult(profile)
            }}
          >
            chain
          </button>
          <div>result: {result}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /chain/i }))
    await vi.advanceTimersByTimeAsync(10)
    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText('result: profile updated for 1'),
    ).toBeInTheDocument()
  })

  it('should handle error in chained mutateAsync calls', async () => {
    function Page() {
      const [result, setResult] = useState<string>('idle')

      const { mutateAsync: createUserAsync } = useMutation({
        mutationFn: (_name: string) =>
          sleep(10).then<{ id: string }>(() => {
            throw new Error('create failed')
          }),
      })

      const { mutateAsync: updateProfileAsync } = useMutation({
        mutationFn: (userId: string) =>
          sleep(10).then(() => `profile updated for ${userId}`),
      })

      return (
        <div>
          <button
            onClick={async () => {
              try {
                const user = await createUserAsync('John')
                const profile = await updateProfileAsync(user.id)
                setResult(profile)
              } catch (error) {
                setResult(`error: ${(error as Error).message}`)
              }
            }}
          >
            chain
          </button>
          <div>result: {result}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /chain/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText('result: error: create failed'),
    ).toBeInTheDocument()
  })

  it('should handle conditional logic based on mutate success or failure', async () => {
    function Page() {
      const [message, setMessage] = useState<string>('idle')

      const { mutate } = useMutation({
        mutationFn: async (shouldFail: boolean) => {
          await sleep(10)
          if (shouldFail) {
            throw new Error('submission failed')
          }
          return 'submitted successfully'
        },
        retry: false,
      })

      return (
        <div>
          <button
            onClick={() =>
              mutate(false, {
                onSuccess: (result) => setMessage(`success: ${result}`),
                onError: (error) => setMessage(`error: ${error.message}`),
              })
            }
          >
            submit
          </button>
          <button
            onClick={() =>
              mutate(true, {
                onSuccess: (result) => setMessage(`success: ${result}`),
                onError: (error) => setMessage(`error: ${error.message}`),
              })
            }
          >
            submit fail
          </button>
          <div>message: {message}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /^submit$/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText('message: success: submitted successfully'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /submit fail/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText('message: error: submission failed'),
    ).toBeInTheDocument()
  })

  it('should handle conditional error with retry using mutate', async () => {
    let attempt = 0

    function Page() {
      const [message, setMessage] = useState<string>('idle')

      const { mutate } = useMutation({
        mutationFn: async () => {
          await sleep(10)
          attempt++
          if (attempt < 2) {
            throw new Error('temporary failure')
          }
          return 'success'
        },
        retry: false,
      })

      return (
        <div>
          <button
            onClick={() =>
              mutate(undefined, {
                onSuccess: (result) => setMessage(`result: ${result}`),
                onError: () => setMessage('failed, retrying...'),
              })
            }
          >
            submit
          </button>
          <div>message: {message}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /submit/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText('message: failed, retrying...'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /submit/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByText('message: result: success')).toBeInTheDocument()
  })

  it('should support optimistic update on success', async () => {
    function Page() {
      const [items, setItems] = useState<Array<string>>([
        'item1',
        'item2',
        'item3',
      ])

      const [successMessage, setSuccessMessage] = useState<string>('')

      const { mutate } = useMutation({
        mutationFn: (item: string) => sleep(10).then(() => item),
        onMutate: (item) => {
          const previousItems = [...items]
          setItems((prev) => prev.filter((i) => i !== item))
          return { previousItems }
        },
        onSuccess: (deletedItem) => {
          setSuccessMessage(`deleted: ${deletedItem}`)
        },
        onError: (_error, _item, context) => {
          if (context?.previousItems) {
            setItems(context.previousItems)
          }
        },
      })

      return (
        <div>
          {items.map((item) => (
            <button key={item} onClick={() => mutate(item)}>
              delete {item}
            </button>
          ))}
          <div>items: {items.join(', ')}</div>
          <div>success: {successMessage || 'none'}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    expect(rendered.getByText('items: item1, item2, item3')).toBeInTheDocument()
    expect(rendered.getByText('success: none')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /delete item2/i }))

    // optimistic update: item2 removed immediately
    expect(rendered.getByText('items: item1, item3')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)

    // success: item2 stays removed and onSuccess called
    expect(rendered.getByText('items: item1, item3')).toBeInTheDocument()
    expect(rendered.getByText('success: deleted: item2')).toBeInTheDocument()
  })

  it('should support optimistic update and rollback on error', async () => {
    function Page() {
      const [items, setItems] = useState<Array<string>>([
        'item1',
        'item2',
        'item3',
      ])

      const [message, setMessage] = useState<string>('')

      const { mutate } = useMutation({
        mutationFn: (item: string) =>
          sleep(10).then(() => {
            throw new Error(`Failed to delete ${item}`)
          }),
        onMutate: (item) => {
          const previousItems = [...items]
          setItems((prev) => prev.filter((i) => i !== item))
          return { previousItems }
        },
        onSuccess: (deletedItem) => {
          setMessage(`deleted: ${deletedItem}`)
        },
        onError: (_error, _item, context) => {
          setMessage('rollback')
          if (context?.previousItems) {
            setItems(context.previousItems)
          }
        },
        retry: false,
      })

      return (
        <div>
          {items.map((item) => (
            <button key={item} onClick={() => mutate(item)}>
              delete {item}
            </button>
          ))}
          <div>items: {items.join(', ')}</div>
          <div>message: {message || 'none'}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    expect(rendered.getByText('items: item1, item2, item3')).toBeInTheDocument()
    expect(rendered.getByText('message: none')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /delete item2/i }))

    // optimistic update: item2 removed immediately
    expect(rendered.getByText('items: item1, item3')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)

    // rollback: item2 restored after error, onSuccess not called
    expect(rendered.getByText('items: item1, item2, item3')).toBeInTheDocument()
    expect(rendered.getByText('message: rollback')).toBeInTheDocument()
  })

  it('should be able to run multiple mutateAsync calls in parallel with Promise.all', async () => {
    function Page() {
      const [result, setResult] = useState<string>('idle')

      const { mutateAsync } = useMutation({
        mutationFn: (file: string) => sleep(10).then(() => `uploaded: ${file}`),
      })

      return (
        <div>
          <button
            onClick={async () => {
              const results = await Promise.all([
                mutateAsync('file1'),
                mutateAsync('file2'),
                mutateAsync('file3'),
              ])
              setResult(results.join(', '))
            }}
          >
            upload all
          </button>
          <div>result: {result}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /upload all/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText(
        'result: uploaded: file1, uploaded: file2, uploaded: file3',
      ),
    ).toBeInTheDocument()
  })

  it('should handle Promise.all rejection when one parallel mutateAsync call fails', async () => {
    function Page() {
      const [result, setResult] = useState<string>('idle')

      const { mutateAsync } = useMutation({
        mutationFn: async (file: string) => {
          await sleep(10)
          if (file === 'file2') {
            throw new Error('upload failed')
          }
          return `uploaded: ${file}`
        },
        retry: false,
      })

      return (
        <div>
          <button
            onClick={async () => {
              try {
                const results = await Promise.all([
                  mutateAsync('file1'),
                  mutateAsync('file2'),
                  mutateAsync('file3'),
                ])
                setResult(results.join(', '))
              } catch (error) {
                setResult(`error: ${(error as Error).message}`)
              }
            }}
          >
            upload all
          </button>
          <div>result: {result}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /upload all/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText('result: error: upload failed'),
    ).toBeInTheDocument()
  })

  it('should handle partial failure in parallel mutateAsync calls with Promise.allSettled', async () => {
    function Page() {
      const [result, setResult] = useState<string>('idle')

      const { mutateAsync } = useMutation({
        mutationFn: async (file: string) => {
          await sleep(10)
          if (file === 'file2') {
            throw new Error('upload failed')
          }
          return `uploaded: ${file}`
        },
        retry: false,
      })

      return (
        <div>
          <button
            onClick={async () => {
              const results = await Promise.allSettled([
                mutateAsync('file1'),
                mutateAsync('file2'),
                mutateAsync('file3'),
              ])
              const summary = results
                .map((r) =>
                  r.status === 'fulfilled'
                    ? r.value
                    : `error: ${r.reason.message}`,
                )
                .join(', ')
              setResult(summary)
            }}
          >
            upload all
          </button>
          <div>result: {result}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /upload all/i }))
    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText(
        'result: uploaded: file1, error: upload failed, uploaded: file3',
      ),
    ).toBeInTheDocument()
  })
})
