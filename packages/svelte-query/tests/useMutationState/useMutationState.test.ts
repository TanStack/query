import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/svelte'
import UseMutationState from './BaseExample.svelte'

describe('useMutationState', () => {
  it('run few mutation functions and check from useMutationState ', async () => {
    const successMutationFn = vi.fn()

    const errorMutationFn = vi.fn().mockImplementation(() => {
      throw 'error'
    })

    const rendered = render(UseMutationState, {
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

    await waitFor(() => {
      expect(successMutationFn).toHaveBeenCalledTimes(1)
      expect(rendered.getByTestId('result').innerHTML).toEqual('["success"]')
    })

    fireEvent.click(rendered.getByTestId('error'))

    await waitFor(() => {
      expect(errorMutationFn).toHaveBeenCalledTimes(1)
      expect(rendered.getByTestId('result').innerHTML).toEqual(
        '["success","error"]',
      )
    })
  })

  it('can select specific type of mutation ( i.e: error only )', async () => {
    const successMutationFn = vi.fn()
    const errorMutationFn = vi.fn().mockImplementation(() => {
      throw 'error'
    })

    const rendered = render(UseMutationState, {
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

    await waitFor(() => {
      expect(successMutationFn).toHaveBeenCalledTimes(1)
      expect(rendered.getByTestId('result').innerHTML).toEqual('[]')
    })

    fireEvent.click(rendered.getByTestId('error'))

    await waitFor(() => {
      expect(errorMutationFn).toHaveBeenCalledTimes(1)
      expect(rendered.getByTestId('result').innerHTML).toEqual('["error"]')
    })
  })

  it('can select specific mutation using mutation key', async () => {
    const successMutationFn = vi.fn()
    const errorMutationFn = vi.fn().mockImplementation(() => {
      throw 'error'
    })

    const rendered = render(UseMutationState, {
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

    await waitFor(() => {
      expect(successMutationFn).toHaveBeenCalledTimes(1)
      expect(rendered.getByTestId('result').innerHTML).toEqual('["success"]')
    })

    fireEvent.click(rendered.getByTestId('error'))

    await waitFor(() => {
      expect(errorMutationFn).toHaveBeenCalledTimes(1)
      expect(rendered.getByTestId('result').innerHTML).toEqual('["success"]')
    })
  })
})
