import { describe, expect, test } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from '../utils.svelte.js'
import BaseExample from './BaseExample.svelte'
import CombineExample from './CombineExample.svelte'

describe('createQueries', () => {
  test('Render and wait for success', async () => {
    const rendered = render(BaseExample, {
      props: {
        options: {
          queries: () => [
            {
              queryKey: ['key-1'],
              queryFn: async () => {
                await sleep(5)
                return 'Success 1'
              },
            },
            {
              queryKey: ['key-2'],
              queryFn: async () => {
                await sleep(5)
                return 'Success 2'
              },
            },
          ],
        },
        queryClient: new QueryClient(),
      },
    })

    await waitFor(() => {
      expect(rendered.getByText('Status 1: pending')).toBeInTheDocument()
      expect(rendered.getByText('Status 2: pending')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(rendered.getByText('Status 1: success')).toBeInTheDocument()
      expect(rendered.getByText('Status 2: success')).toBeInTheDocument()
    })
  })

  test('Combine queries', async () => {
    const rendered = render(CombineExample, {
      props: {
        queryClient: new QueryClient(),
      },
    })

    await waitFor(() => {
      expect(rendered.getByText('isPending: true')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(rendered.getByText('Data: 1,2,3')).toBeInTheDocument()
    })
  })
})
