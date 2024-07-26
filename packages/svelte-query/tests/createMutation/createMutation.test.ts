import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/svelte'
import { sleep } from '../utils.svelte.js'
import ResetExample from './ResetExample.svelte'
import OnSuccessExample from './OnSuccessExample.svelte'
import FailureExample from './FailureExample.svelte'

describe('createMutation', () => {
  test('Able to reset `error`', async () => {
    const rendered = render(ResetExample)

    await waitFor(() => {
      expect(rendered.queryByText('Error: undefined')).toBeInTheDocument()
    })

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))

    await waitFor(() => {
      expect(
        rendered.queryByText('Error: Expected mock error'),
      ).toBeInTheDocument()
    })

    fireEvent.click(rendered.getByRole('button', { name: /Reset/i }))

    await waitFor(() => {
      expect(rendered.queryByText('Error: undefined')).toBeInTheDocument()
    })
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

    await waitFor(() => {
      expect(rendered.queryByText('Count: 0')).toBeInTheDocument()
    })

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))

    await waitFor(() => {
      expect(rendered.queryByText('Count: 3')).toBeInTheDocument()
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

  test('Set correct values for `failureReason` and `failureCount` on multiple mutate calls', async () => {
    type Value = { count: number }

    const mutationFn = vi.fn<(value: Value) => Promise<Value>>()

    mutationFn.mockImplementationOnce(() => {
      return Promise.reject(`Expected mock error`)
    })

    mutationFn.mockImplementation(async (value) => {
      await sleep(5)
      return Promise.resolve(value)
    })

    const rendered = render(FailureExample, {
      props: {
        mutationFn,
      },
    })

    await waitFor(() => rendered.queryByText('Data: undefined'))

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await waitFor(() => rendered.getByText('Data: undefined'))
    await waitFor(() => rendered.getByText('Status: error'))
    await waitFor(() => rendered.getByText('Failure Count: 1'))
    await waitFor(() =>
      rendered.getByText('Failure Reason: Expected mock error'),
    )

    fireEvent.click(rendered.getByRole('button', { name: /Mutate/i }))
    await waitFor(() => rendered.getByText('Status: pending'))
    await waitFor(() => rendered.getByText('Status: success'))
    await waitFor(() => rendered.getByText('Data: 2'))
    await waitFor(() => rendered.getByText('Failure Count: 0'))
    await waitFor(() => rendered.getByText('Failure Reason: undefined'))
  })
})
