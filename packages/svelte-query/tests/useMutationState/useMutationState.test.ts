import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/svelte'
import BaseExample from './BaseExample.svelte'

describe('useMutationState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Run few mutation functions and check from useMutationState', async () => {
    const successMutationFn = vi.fn()
    const errorMutationFn = vi.fn().mockImplementation(() => {
      throw 'error'
    })

    const rendered = render(BaseExample, {
      props: {
        successMutationOpts: {
          mutationKey: ['success'],
          mutationFn: successMutationFn,
        },

        errorMutationOpts: {
          mutationKey: ['error'],
          mutationFn: errorMutationFn,
        },
      },
    })

    fireEvent.click(rendered.getByTestId('success'))
    await vi.advanceTimersByTimeAsync(0)
    expect(successMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByTestId('result').innerHTML).toEqual('["success"]')

    fireEvent.click(rendered.getByTestId('error'))
    await vi.advanceTimersByTimeAsync(0)
    expect(errorMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByTestId('result').innerHTML).toEqual(
      '["success","error"]',
    )
  })

  test('Can select specific type of mutation ( i.e: error only )', async () => {
    const successMutationFn = vi.fn()
    const errorMutationFn = vi.fn().mockImplementation(() => {
      throw 'error'
    })

    const rendered = render(BaseExample, {
      props: {
        successMutationOpts: {
          mutationKey: ['success'],
          mutationFn: successMutationFn,
        },

        errorMutationOpts: {
          mutationKey: ['error'],
          mutationFn: errorMutationFn,
        },

        mutationStateOpts: {
          filters: { status: 'error' },
        },
      },
    })

    fireEvent.click(rendered.getByTestId('success'))
    await vi.advanceTimersByTimeAsync(0)
    expect(successMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByTestId('result').innerHTML).toEqual('[]')

    fireEvent.click(rendered.getByTestId('error'))
    await vi.advanceTimersByTimeAsync(0)
    expect(errorMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByTestId('result').innerHTML).toEqual('["error"]')
  })

  test('Can select specific mutation using mutation key', async () => {
    const successMutationFn = vi.fn()
    const errorMutationFn = vi.fn().mockImplementation(() => {
      throw 'error'
    })

    const rendered = render(BaseExample, {
      props: {
        successMutationOpts: {
          mutationKey: ['success'],
          mutationFn: successMutationFn,
        },

        errorMutationOpts: {
          mutationKey: ['error'],
          mutationFn: errorMutationFn,
        },

        mutationStateOpts: {
          filters: { mutationKey: ['success'] },
        },
      },
    })

    fireEvent.click(rendered.getByTestId('success'))
    await vi.advanceTimersByTimeAsync(0)
    expect(successMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByTestId('result').innerHTML).toEqual('["success"]')

    fireEvent.click(rendered.getByTestId('error'))
    await vi.advanceTimersByTimeAsync(0)
    expect(errorMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByTestId('result').innerHTML).toEqual('["success"]')
  })
})
