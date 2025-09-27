import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/svelte'
import { sleep } from '@tanstack/query-test-utils'
import ResetExample from './ResetExample.svelte'
import OnSuccessExample from './OnSuccessExample.svelte'
import FailureExample from './FailureExample.svelte'

describe('createMutation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Able to reset `error`', async () => {
    const rendered = render(ResetExample)

    expect(rendered.queryByText('Error: undefined')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Error: Expected mock error')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Reset/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Error: undefined')).toBeInTheDocument()
  })

  test('Able to call `onSuccess` and `onSettled` after each successful mutate', async () => {
    const onSuccessMock = vi.fn()
    const onSettledMock = vi.fn()

    const rendered = render(OnSuccessExample, {
      props: {
        onSuccessMock,
        onSettledMock,
      },
    })

    expect(rendered.queryByText('Count: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.queryByText('Count: 3')).toBeInTheDocument()

    expect(onSuccessMock).toHaveBeenCalledTimes(3)
    expect(onSuccessMock).toHaveBeenNthCalledWith(1, 1)
    expect(onSuccessMock).toHaveBeenNthCalledWith(2, 2)
    expect(onSuccessMock).toHaveBeenNthCalledWith(3, 3)

    expect(onSettledMock).toHaveBeenCalledTimes(3)
    expect(onSettledMock).toHaveBeenNthCalledWith(1, 1)
    expect(onSettledMock).toHaveBeenNthCalledWith(2, 2)
    expect(onSettledMock).toHaveBeenNthCalledWith(3, 3)
  })

  test('Set correct values for `failureReason` and `failureCount` on multiple mutate calls', async () => {
    type Value = { count: number }

    const mutationFn = vi.fn<(value: Value) => Promise<Value>>()

    mutationFn.mockImplementationOnce(() =>
      sleep(20).then(() => Promise.reject(`Expected mock error`)),
    )

    mutationFn.mockImplementation((value) => sleep(10).then(() => value))

    const rendered = render(FailureExample, {
      props: {
        mutationFn,
      },
    })

    expect(rendered.queryByText('Data: undefined')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    expect(rendered.getByText('Data: undefined')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(21)
    expect(rendered.getByText('Status: error')).toBeInTheDocument()
    expect(rendered.getByText('Failure Count: 1')).toBeInTheDocument()
    expect(
      rendered.getByText('Failure Reason: Expected mock error'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Status: pending')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Status: success')).toBeInTheDocument()
    expect(rendered.getByText('Data: 2')).toBeInTheDocument()
    expect(rendered.getByText('Failure Count: 0')).toBeInTheDocument()
    expect(rendered.getByText('Failure Reason: undefined')).toBeInTheDocument()
  })
})
