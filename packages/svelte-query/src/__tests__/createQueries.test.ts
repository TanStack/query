import { describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import CreateQueries from './CreateQueries.svelte'
import { sleep } from './utils'

describe('createQueries', () => {
  it('Render and wait for success', async () => {
    const rendered = render(CreateQueries, {
      props: {
        options: {
          queries: [
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
      },
    })

    await waitFor(() => {
      expect(rendered.getByText('Loading 1')).toBeInTheDocument()
      expect(rendered.getByText('Loading 2')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(rendered.getByText('Success 1')).toBeInTheDocument()
      expect(rendered.getByText('Success 2')).toBeInTheDocument()
    })
  })
})
