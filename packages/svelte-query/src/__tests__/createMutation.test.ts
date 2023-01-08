import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/svelte'
import CreateMutation from './CreateMutation.svelte'
import { sleep } from './utils'

describe('createMutation', () => {
  it('Call mutate and check function runs', async () => {
    const queryFn = vi.fn()

    render(CreateMutation, {
      props: {
        queryFn,
      },
    })

    fireEvent.click(screen.getByRole('button'))

    await sleep(200)

    expect(queryFn).toHaveBeenCalledTimes(1)
  })
})
