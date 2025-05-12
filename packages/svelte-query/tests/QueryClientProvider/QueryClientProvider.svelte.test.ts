import { describe, expect, test } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import ParentComponent from './ParentComponent.svelte'

describe('QueryClientProvider', () => {
  test('Sets a specific cache for all queries to use', async () => {
    const queryClient = new QueryClient()
    const queryCache = queryClient.getQueryCache()

    const rendered = render(ParentComponent, {
      props: {
        queryClient: queryClient,
      },
    })

    await waitFor(() => rendered.getByText('Data: test'))

    expect(queryCache.find({ queryKey: ['hello'] })).toBeDefined()
  })
})
