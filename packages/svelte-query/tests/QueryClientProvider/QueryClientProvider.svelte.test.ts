import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import BaseExample from './BaseExample.svelte'

describe('QueryClientProvider', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  test('Sets a specific cache for all queries to use', async () => {
    const queryCache = queryClient.getQueryCache()

    const rendered = render(BaseExample, {
      props: {
        queryClient,
      },
    })

    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Data: test')).toBeInTheDocument()

    expect(queryCache.find({ queryKey: ['hello'] })).toBeDefined()
  })
})
