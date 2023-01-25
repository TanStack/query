import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import CreateQueries from './CreateQueries.svelte'
import { sleep } from './utils'

describe('createQueries', () => {
  it('Render and wait for success', async () => {
    render(CreateQueries, {
      props: {
        options: [
          {
            queryKey: ['key-1'],
            queryFn: async () => {
              await sleep(10)
              return 'Success 1'
            },
          },
          {
            queryKey: ['key-2'],
            queryFn: async () => {
              await sleep(10)
              return 'Success 2'
            },
          },
        ],
      },
    })

    expect(screen.queryByText('Success 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Success 2')).not.toBeInTheDocument()

    await sleep(20)

    expect(screen.queryByText('Success 1')).toBeInTheDocument()
    expect(screen.queryByText('Success 2')).toBeInTheDocument()
  })
})
