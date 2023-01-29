import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/svelte'
import CreateMutation from './CreateMutation.svelte'
import { sleep } from './utils'

describe('createMutation', () => {
  it('Call mutate and check function runs', async () => {
    const mutationFn = vi.fn()

    render(CreateMutation, {
      props: {
        options: {
          mutationFn,
        },
      },
    })

    fireEvent.click(screen.getByRole('button'))

    await sleep(20)

    expect(mutationFn).toHaveBeenCalledTimes(1)
  })
})
