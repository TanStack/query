import { describe, expect, it, vi } from 'vitest'
import { sleep } from '@tanstack/query-test-utils'
import { createMutation } from '../src/index.js'
import { withEffectRoot } from './utils.svelte.js'

describe('createMutation', () => {
  it('should be able to reset `data`', () => {
    withEffectRoot(async () => {
      const {
        mutate,
        data = 'empty',
        reset,
      } = createMutation(() => ({
        mutationFn: () => Promise.resolve('mutation'),
      }))

      expect(data).toBe('empty')

      mutate()

      await vi.waitFor(() => {
        expect(data).toBe('mutation')
      })

      reset()

      await vi.waitFor(() => {
        expect(data).toBe('empty')
      })
    })
  })

  it('should be able to reset `error`', () => {
    withEffectRoot(async () => {
      const { mutate, error, reset } = createMutation<string, Error>(() => ({
        mutationFn: () => {
          const err = new Error('Expected mock error. All is well!')
          err.stack = ''
          return Promise.reject(err)
        },
      }))

      expect(error?.message).toBeNull()

      mutate()

      await vi.waitFor(() => {
        expect(error?.message).toBe('Expected mock error. All is well!')
      })

      reset()

      await vi.waitFor(() => {
        expect(error?.message).toBeNull()
      })
    })
  })

  it('should be able to call `onSuccess` and `onSettled` after each successful mutate', () => {
    let count = 0
    const onSuccessMock = vi.fn()
    const onSettledMock = vi.fn()

    withEffectRoot(async () => {
      const { mutate } = createMutation(() => ({
        mutationFn: (vars: { count: number }) => Promise.resolve(vars.count),

        onSuccess: (data) => {
          onSuccessMock(data)
        },
        onSettled: (data) => {
          onSettledMock(data)
        },
      }))

      expect(count).toBe(0)

      mutate({ count: ++count })
      mutate({ count: ++count })
      mutate({ count: ++count })

      await vi.waitFor(() => {
        expect(count).toBe(3)
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
  })

  it('should set correct values for `failureReason` and `failureCount` on multiple mutate calls', () => {
    let count = 0
    type Value = { count: number }

    const mutateFn = vi.fn<(value: Value) => Promise<Value>>()

    mutateFn.mockImplementationOnce(() => {
      return Promise.reject(new Error('Error test Jonas'))
    })

    mutateFn.mockImplementation(async (value) => {
      await sleep(10)
      return Promise.resolve(value)
    })

    withEffectRoot(async () => {
      const { mutate, failureCount, failureReason, data, status } =
        createMutation(() => ({ mutationFn: mutateFn }))

      expect(data?.count).toBe(0)

      mutate({ count: ++count })

      await vi.waitFor(() => {
        expect(status).toBe('error')
        expect(failureCount).toBe(1)
        expect(failureReason?.message).toBe('Error test Jonas')
      })

      mutate({ count: ++count })

      await vi.waitFor(() => {
        expect(status).toBe('pending')
      })

      await vi.waitFor(() => {
        expect(status).toBe('success')
        expect(data?.count).toBe(2)
        expect(failureCount).toBe(0)
        expect(failureReason).toBeNull()
      })
    })
  })

  it('should be able to call `onError` and `onSettled` after each failed mutate', () => {
    const onErrorMock = vi.fn()
    const onSettledMock = vi.fn()
    let count = 0

    withEffectRoot(async () => {
      const { mutate } = createMutation(() => ({
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

      expect(count).toBe(0)

      mutate({ count: ++count })
      mutate({ count: ++count })
      mutate({ count: ++count })

      await vi.waitFor(() => {
        expect(count).toBe(3)
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
  })
})
