import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import { infiniteQueryOptions } from '../infiniteQueryOptions.js'
import { generateElementName } from './utils.js'

describe('infiniteQueryOptions', () => {
  let queryClient: QueryClient
  let container: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(() => {
    container.remove()
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should work when passed to createInfiniteQueryController', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly infinite = createInfiniteQueryController(
        this,
        infiniteQueryOptions({
          queryKey: key,
          initialPageParam: 0,
          queryFn: ({ pageParam }) => sleep(10).then(() => Number(pageParam)),
          getNextPageParam: (lastPage) =>
            lastPage < 1 ? lastPage + 1 : undefined,
        }),
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const infinite = host.infinite

    await vi.advanceTimersByTimeAsync(10)
    expect(infinite().isSuccess).toBe(true)
    expect(infinite().data?.pages).toEqual([0])
  })
})
