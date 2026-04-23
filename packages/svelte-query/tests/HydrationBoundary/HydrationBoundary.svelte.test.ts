import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { QueryClient, dehydrate } from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import Base from './Base.svelte'

describe('HydrationBoundary', () => {
  let queryClient: QueryClient
  let stringifiedState: string

  beforeEach(async () => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    const dehydrateClient = new QueryClient()
    dehydrateClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => sleep(10).then(() => 'stringCached'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydrated = dehydrate(dehydrateClient)
    stringifiedState = JSON.stringify(dehydrated)
    dehydrateClient.clear()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should hydrate queries to the cache on context', async () => {
    const dehydratedState = JSON.parse(stringifiedState)

    const rendered = render(Base, {
      props: {
        queryClient,
        dehydratedState,
        queryFn: () => sleep(20).then(() => 'string'),
      },
    })

    expect(rendered.getByText('data: stringCached')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(21)
    expect(rendered.getByText('data: string')).toBeInTheDocument()
  })
})
