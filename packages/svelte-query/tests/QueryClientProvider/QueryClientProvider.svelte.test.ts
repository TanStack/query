import { QueryClient } from '@tanstack/query-core'
import { render } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Base from './Base.svelte'

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

  it('should set a specific cache for all queries to use', async () => {
    const queryCache = queryClient.getQueryCache()

    const rendered = render(Base, {
      props: {
        queryClient,
      },
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Data: test')).toBeInTheDocument()

    expect(queryCache.find({ queryKey: ['hello'] })?.state.data).toBe('test')
  })
})
