import { describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import CreateQuery from './CreateQuery.svelte'
import { sleep } from './utils'

describe('createQuery', () => {
  it('Render and wait for success', async () => {
    const rendered = render(CreateQuery, {
      props: {
        options: {
          queryKey: ['test'],
          queryFn: async () => {
            await sleep(10)
            return 'Success'
          },
        },
      },
    })

    await waitFor(() => {
      expect(rendered.getByText('Loading')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(rendered.getByText('Success')).toBeInTheDocument()
    })
  })
})
