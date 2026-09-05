import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { sleep } from '@tanstack/query-test-utils'
import { QueryClient } from '@tanstack/query-core'
import { createMutation } from '../../src/createMutation.svelte.js'
import { promiseWithResolvers, withEffectRoot } from '../utils.svelte.js'
import Success from './Success.svelte'
import Failure from './Failure.svelte'
import Reset from './Reset.svelte'

describe('createMutation', () => {
  test('Success', async () => {
    const queryClient = new QueryClient()
    const onSuccessMock = vi.fn()
    const onSettledMock = vi.fn()

    render(Success, {
      props: {
        queryClient,
        onSuccessMock,
        onSettledMock,
      },
    })

    expect(screen.getByText('Count: 0')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: /Mutate/i }))

    expect(screen.getByText('Count: 1')).toBeInTheDocument()

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1)
      expect(onSuccessMock).toHaveBeenCalledWith(1)
      expect(onSettledMock).toHaveBeenCalledTimes(1)
      expect(onSettledMock).toHaveBeenCalledWith(1)
    })
  })

  test('Failure', async () => {
    const queryClient = new QueryClient()
    const mutationFn = vi.fn().mockImplementation(() =>
      sleep(10).then(() => {
        throw new Error('Mutation failed')
      }),
    )

    render(Failure, {
      props: {
        queryClient,
        mutationFn,
      },
    })

    expect(screen.getByText('Status: idle')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: /Mutate/i }))

    await waitFor(() => {
      expect(screen.getByText('Status: error')).toBeInTheDocument()
      expect(screen.getByText('Failure Count: 1')).toBeInTheDocument()
    })
  })

  test('Reset', async () => {
    const queryClient = new QueryClient()

    render(Reset, {
      props: {
        queryClient,
      },
    })

    expect(screen.getByText('Error: undefined')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: /Mutate/i }))

    await waitFor(() => {
      expect(screen.getByText('Error: Expected mock error')).toBeInTheDocument()
    })

    await fireEvent.click(screen.getByRole('button', { name: /Reset/i }))

    await waitFor(() => {
      expect(screen.getByText('Error: undefined')).toBeInTheDocument()
    })
  })

  test(
    'should synchronize status when background mutation resolves',
    withEffectRoot(async () => {
      const queryClient = new QueryClient()
      const { promise, resolve } = promiseWithResolvers<string>()

      const mutation = createMutation(
        () => ({
          mutationFn: () => promise,
        }),
        () => queryClient,
      )

      mutation.mutate()
      await sleep(1)
      expect(mutation.status).toBe('pending')

      resolve('success-payload')
      await sleep(10)

      expect(mutation.status).toBe('success')
      expect(mutation.data).toBe('success-payload')
    }),
  )
})