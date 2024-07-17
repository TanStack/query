import { describe, expect, test } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import { QueryCache } from '@tanstack/query-core'
import ParentComponent from './ParentComponent.svelte'

describe('QueryClientProvider', () => {
  test('Sets a specific cache for all queries to use', async () => {
    const queryCache = new QueryCache()

    const rendered = render(ParentComponent, {
      props: {
        queryCache: queryCache,
      },
    })

    await waitFor(() => rendered.getByText('Data: test'))

    expect(queryCache.find({ queryKey: ['hello'] })).toBeDefined()
  })
})
