import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/svelte'
import { sleep } from '@tanstack/query-test-utils'
import BaseExample from './BaseExample.svelte'

describe('useMutationState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Run few mutation functions and check from useMutationState', async () => {
    const successMutationFn = vi.fn(() => sleep(10).then(() => 'data'))
    const errorMutationFn = vi
      .fn()
      .mockImplementation(() =>
        sleep(20).then(() => Promise.reject(new Error('error'))),
      )

    const rendered = render(BaseExample, {
      props: {
        successMutationOpts: () => ({
          mutationKey: ['success'],
          mutationFn: successMutationFn,
        }),

        errorMutationOpts: () => ({
          mutationKey: ['error'],
          mutationFn: errorMutationFn,
        }),
      },
    })

    fireEvent.click(rendered.getByText('success'))
    await vi.advanceTimersByTimeAsync(11)
    expect(successMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('["success"]')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('error'))
    await vi.advanceTimersByTimeAsync(21)
    expect(errorMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('["success","error"]')).toBeInTheDocument()
  })

  test('Can select specific type of mutation ( i.e: error only )', async () => {
    const successMutationFn = vi.fn(() => sleep(10).then(() => 'data'))
    const errorMutationFn = vi
      .fn()
      .mockImplementation(() =>
        sleep(20).then(() => Promise.reject(new Error('error'))),
      )

    const rendered = render(BaseExample, {
      props: {
        successMutationOpts: () => ({
          mutationKey: ['success'],
          mutationFn: successMutationFn,
        }),

        errorMutationOpts: () => ({
          mutationKey: ['error'],
          mutationFn: errorMutationFn,
        }),

        mutationStateOpts: {
          filters: { status: 'error' },
        },
      },
    })

    fireEvent.click(rendered.getByText('success'))
    await vi.advanceTimersByTimeAsync(11)
    expect(successMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('[]')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('error'))
    await vi.advanceTimersByTimeAsync(21)
    expect(errorMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('["error"]')).toBeInTheDocument()
  })

  test('Can select specific mutation using mutation key', async () => {
    const successMutationFn = vi.fn(() => sleep(10).then(() => 'data'))
    const errorMutationFn = vi
      .fn()
      .mockImplementation(() =>
        sleep(20).then(() => Promise.reject(new Error('error'))),
      )

    const rendered = render(BaseExample, {
      props: {
        successMutationOpts: () => ({
          mutationKey: ['success'],
          mutationFn: successMutationFn,
        }),

        errorMutationOpts: () => ({
          mutationKey: ['error'],
          mutationFn: errorMutationFn,
        }),

        mutationStateOpts: {
          filters: { mutationKey: ['success'] },
        },
      },
    })

    fireEvent.click(rendered.getByText('success'))
    await vi.advanceTimersByTimeAsync(11)
    expect(successMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('["success"]')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('error'))
    await vi.advanceTimersByTimeAsync(21)
    expect(errorMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('["success"]')).toBeInTheDocument()
  })
})
