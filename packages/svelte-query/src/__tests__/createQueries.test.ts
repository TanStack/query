import { describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import CreateQueries from './CreateQueries.svelte'
import { sleep } from './utils'
import type { QueriesResults } from '../createQueries'

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
        queryClient: new QueryClient(),
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

  it('should combine queries', async () => {
    const ids = [1, 2, 3]

    const rendered = render(CreateQueries, {
      props: {
        options: {
          queries: ids.map((id) => ({
            queryKey: [id],
            queryFn: async () => {
              await sleep(10)
              return id
            },
          })),
          combine: (results: QueriesResults<Array<number>>) => {
            return {
              data: results.map((res) => res.data).join(','),
            }
          },
        },
        queryClient: new QueryClient(),
      },
    })

    await waitFor(() => expect(rendered.getByText('1,2,3')).toBeInTheDocument())
  })
})
