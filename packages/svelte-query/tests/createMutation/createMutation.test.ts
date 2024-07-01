import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/svelte'
import BaseExample from './BaseExample.svelte'

describe('createMutation', () => {
  it('Call mutate and check function runs', async () => {
    const mutationFn = vi.fn()

    const rendered = render(BaseExample, {
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
