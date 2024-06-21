import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/svelte'
import CreateMutation from './CreateMutation.svelte'

describe('createMutation', () => {
  it('Call mutate and check function runs', async () => {
    const mutationFn = vi.fn()

    const rendered = render(CreateMutation, {
      props: {
        options: {
          mutationFn,
        },
      },
    })

    fireEvent.click(rendered.getByRole('button'))

    await waitFor(() => {
      expect(mutationFn).toHaveBeenCalledTimes(1)
    })
  })
})
