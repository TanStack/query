import { describe, expect, test } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from '../utils'
import BaseExample from './BaseExample.svelte'

describe('createQueries', () => {
  test('Render and wait for success', async () => {
    const rendered = render(BaseExample, {
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

  test('Combine queries', async () => {
    const ids = [1, 2, 3]

    const rendered = render(BaseExample, {
      props: {
        options: {
          queries: ids.map((id) => ({
            queryKey: [id],
            queryFn: async () => {
              await sleep(10)
              return id
            },
          })),
          combine: (results) => {
            return {
              isPending: results.some((result) => result.isPending),
              isSuccess: results.every((result) => result.isSuccess),
              data: results.map((res) => res.data).join(','),
            }
          },
        },
        queryClient: new QueryClient(),
      },
    })

    await waitFor(() => {
      expect(rendered.getByText('Loading')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(rendered.getByText('1,2,3')).toBeInTheDocument()
    })
  })
})
