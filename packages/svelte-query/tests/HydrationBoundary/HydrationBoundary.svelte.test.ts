import {
  QueryClient,
  clearQueryClient,
  dehydrate,
  noop,
  query,
} from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import { render } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Base from './Base.svelte'

describe('HydrationBoundary', () => {
  let queryClient: QueryClient
  let stringifiedState: string

  beforeEach(async () => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    const dehydrateClient = new QueryClient()
    void query(dehydrateClient, {
      queryKey: ['string'],
      queryFn: () => sleep(10).then(() => 'stringCached'),
    }).catch(noop)
    await vi.advanceTimersByTimeAsync(10)
    const dehydrated = dehydrate(dehydrateClient)
    stringifiedState = JSON.stringify(dehydrated)
    clearQueryClient(dehydrateClient)
  })

  afterEach(() => {
    clearQueryClient(queryClient)
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
    await vi.advanceTimersByTimeAsync(20)
    expect(rendered.getByText('data: string')).toBeInTheDocument()
  })
})
