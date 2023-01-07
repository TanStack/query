import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import CreateQuery from './CreateQuery.svelte'
import { sleep } from './utils'

describe('createQuery', () => {
  it('Render and wait for success', async () => {
    render(CreateQuery, {
      props: {
        queryKey: ['test'],
        queryFn: async () => {
          await sleep(100)
          return 'Success'
        },
      },
    })

    expect(screen.queryByText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('Error')).not.toBeInTheDocument()
    expect(screen.queryByText('Success')).not.toBeInTheDocument()

    await sleep(200)

    expect(screen.queryByText('Success')).toBeInTheDocument()
    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
    expect(screen.queryByText('Error')).not.toBeInTheDocument()
  })
})
