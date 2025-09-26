import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import ParentComponent from './ParentComponent.svelte'

describe('QueryClientProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Sets a specific cache for all queries to use', async () => {
    const queryClient = new QueryClient()
    const queryCache = queryClient.getQueryCache()

    const rendered = render(ParentComponent, {
      props: {
        queryClient: queryClient,
      },
    })

    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Data: test')).toBeInTheDocument()

    expect(queryCache.find({ queryKey: ['hello'] })).toBeDefined()
  })
})
