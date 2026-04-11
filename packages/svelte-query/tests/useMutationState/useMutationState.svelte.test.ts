import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import BaseExample from './BaseExample.svelte'
import SelectExample from './SelectExample.svelte'
import type { Mutation } from '@tanstack/query-core'

describe('useMutationState', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  test('Run few mutation functions and check from useMutationState', async () => {
    const successKey = queryKey()
    const errorKey = queryKey()
    const successMutationFn = vi.fn(() => sleep(10).then(() => 'data'))
    const errorMutationFn = vi
      .fn()
      .mockImplementation(() =>
        sleep(20).then(() => Promise.reject(new Error('error'))),
      )

    const rendered = render(BaseExample, {
      props: {
        queryClient,
        successMutationOpts: () => ({
          mutationKey: successKey,
          mutationFn: successMutationFn,
        }),
        errorMutationOpts: () => ({
          mutationKey: errorKey,
          mutationFn: errorMutationFn,
        }),
      },
    })

    fireEvent.click(rendered.getByRole('button', { name: /Success/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(successMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('Data: ["success"]')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Error/i }))
    await vi.advanceTimersByTimeAsync(21)
    expect(errorMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('Data: ["success","error"]')).toBeInTheDocument()
  })

  test('Can select specific type of mutation ( i.e: error only )', async () => {
    const successKey = queryKey()
    const errorKey = queryKey()
    const successMutationFn = vi.fn(() => sleep(10).then(() => 'data'))
    const errorMutationFn = vi
      .fn()
      .mockImplementation(() =>
        sleep(20).then(() => Promise.reject(new Error('error'))),
      )

    const rendered = render(BaseExample, {
      props: {
        queryClient,
        successMutationOpts: () => ({
          mutationKey: successKey,
          mutationFn: successMutationFn,
        }),
        errorMutationOpts: () => ({
          mutationKey: errorKey,
          mutationFn: errorMutationFn,
        }),
        mutationStateOpts: {
          filters: { status: 'error' },
        },
      },
    })

    fireEvent.click(rendered.getByRole('button', { name: /Success/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(successMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('Data: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Error/i }))
    await vi.advanceTimersByTimeAsync(21)
    expect(errorMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('Data: ["error"]')).toBeInTheDocument()
  })

  test('should return selected value when using select option', async () => {
    const mutationKey = queryKey()

    const rendered = render(SelectExample, {
      props: {
        queryClient,
        mutationOpts: () => ({
          mutationKey,
          mutationFn: () => sleep(10).then(() => 'data'),
        }),
        mutationStateOpts: {
          filters: { mutationKey },
          select: (mutation: Mutation) => mutation.state.status,
        },
      },
    })

    expect(rendered.getByText('Variables: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Variables: ["pending"]')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Variables: ["success"]')).toBeInTheDocument()
  })

  test('Can select specific mutation using mutation key', async () => {
    const successKey = queryKey()
    const errorKey = queryKey()
    const successMutationFn = vi.fn(() => sleep(10).then(() => 'data'))
    const errorMutationFn = vi
      .fn()
      .mockImplementation(() =>
        sleep(20).then(() => Promise.reject(new Error('error'))),
      )

    const rendered = render(BaseExample, {
      props: {
        queryClient,
        successMutationOpts: () => ({
          mutationKey: successKey,
          mutationFn: successMutationFn,
        }),
        errorMutationOpts: () => ({
          mutationKey: errorKey,
          mutationFn: errorMutationFn,
        }),
        mutationStateOpts: {
          filters: { mutationKey: successKey },
        },
      },
    })

    fireEvent.click(rendered.getByRole('button', { name: /Success/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(successMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('Data: ["success"]')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Error/i }))
    await vi.advanceTimersByTimeAsync(21)
    expect(errorMutationFn).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('Data: ["success"]')).toBeInTheDocument()
  })
})
