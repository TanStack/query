import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { QueryClient, dehydrate } from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import BaseExample from './BaseExample.svelte'

describe('HydrationBoundary', () => {
  let stringifiedState: string

  beforeEach(async () => {
    vi.useFakeTimers()
    const queryClient = new QueryClient()
    queryClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => sleep(10).then(() => 'stringCached'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydrated = dehydrate(queryClient)
    stringifiedState = JSON.stringify(dehydrated)
    queryClient.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should hydrate queries to the cache on context', async () => {
    const dehydratedState = JSON.parse(stringifiedState)

    const rendered = render(BaseExample, {
      props: {
        dehydratedState,
        queryFn: () => sleep(20).then(() => 'string'),
      },
    })

    expect(rendered.getByText('data: stringCached')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(21)
    expect(rendered.getByText('data: string')).toBeInTheDocument()
  })
})
