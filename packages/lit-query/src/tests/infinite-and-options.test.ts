import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import type { InfiniteData } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement, html } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import type { InfiniteQueryResultAccessor } from '../createInfiniteQueryController.js'
import { createMutationController } from '../createMutationController.js'
import { createQueryController } from '../createQueryController.js'
import { infiniteQueryOptions } from '../infiniteQueryOptions.js'
import { mutationOptions } from '../mutationOptions.js'
import { queryOptions } from '../queryOptions.js'
import { generateElementName } from './test-utils.js'

const providerTagName = generateElementName()
customElements.define(providerTagName, QueryClientProvider)

describe('createInfiniteQueryController', () => {
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

  it('should resolve from the pre-connect placeholder state on the first provider connection', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly queryKey = key

      readonly infinite = createInfiniteQueryController(this, {
        queryKey: this.queryKey,
        initialPageParam: 0,
        queryFn: ({ pageParam }) => sleep(10).then(() => Number(pageParam)),
        getNextPageParam: (lastPage) =>
          lastPage < 1 ? lastPage + 1 : undefined,
        getPreviousPageParam: (firstPage) =>
          firstPage > -1 ? firstPage - 1 : undefined,
        retry: false,
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.infinite().status).toBe('pending')
    await expect(consumer.infinite.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )
    await expect(consumer.infinite.fetchNextPage()).rejects.toThrow(
      /No QueryClient available/,
    )

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)

    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.infinite().isSuccess).toBe(true)
    expect(consumer.infinite().data?.pages).toEqual([0])

    consumer.infinite.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should prefer an explicit client over the provider context', async () => {
    const key = queryKey()
    const providerClient = new QueryClient()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = providerClient

    class Consumer extends LitElement {
      readonly queryKey = key

      readonly infinite = createInfiniteQueryController(
        this,
        {
          queryKey: this.queryKey,
          initialPageParam: 0,
          queryFn: ({ pageParam }) => sleep(10).then(() => Number(pageParam)),
          getNextPageParam: (lastPage) =>
            lastPage < 1 ? lastPage + 1 : undefined,
          getPreviousPageParam: (firstPage) =>
            firstPage > -1 ? firstPage - 1 : undefined,
          retry: false,
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    provider.append(consumer)

    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.infinite().isSuccess).toBe(true)
    expect(consumer.infinite().data?.pages).toEqual([0])
    expect(
      queryClient.getQueryCache().find({ queryKey: consumer.queryKey })?.state
        .data,
    ).toEqual({ pages: [0], pageParams: [0] })
    expect(
      providerClient.getQueryCache().find({ queryKey: consumer.queryKey }),
    ).toBeUndefined()

    consumer.infinite.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should support initial page, fetchNextPage, and fetchPreviousPage', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly infinite = createInfiniteQueryController(
        this,
        {
          queryKey: key,
          initialPageParam: 0,
          queryFn: ({ pageParam }) => sleep(10).then(() => Number(pageParam)),
          getNextPageParam: (lastPage) =>
            lastPage < 1 ? lastPage + 1 : undefined,
          getPreviousPageParam: (firstPage) =>
            firstPage > -1 ? firstPage - 1 : undefined,
        },
        queryClient,
      )

      override render() {
        return html`pages: ${this.infinite().data?.pages.join(', ') ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const infinite = host.infinite
    await host.updateComplete

    expect(host.shadowRoot?.textContent).toContain('pages: none')
    await vi.advanceTimersByTimeAsync(10)
    expect(infinite().isSuccess).toBe(true)
    expect(infinite().data?.pages).toEqual([0])
    expect(host.shadowRoot?.textContent).toContain('pages: 0')

    const fetchNextPagePromise = infinite.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    await fetchNextPagePromise
    expect(infinite().data?.pages).toEqual([0, 1])
    expect(host.shadowRoot?.textContent).toContain('pages: 0, 1')

    const fetchPreviousPagePromise = infinite.fetchPreviousPage()
    await vi.advanceTimersByTimeAsync(10)
    await fetchPreviousPagePromise
    expect(infinite().data?.pages).toEqual([-1, 0, 1])
    expect(host.shadowRoot?.textContent).toContain('pages: -1, 0, 1')
  })

  it('should not request another update when stable function options refresh during host update', async () => {
    const key = queryKey()
    let callCount = 0

    class Host extends LitElement {
      updatesRequested = 0

      readonly infinite = createInfiniteQueryController(
        this,
        () => ({
          queryKey: key,
          initialPageParam: 0,
          queryFn: async ({ pageParam }) => {
            await sleep(10)
            callCount += 1
            return Number(pageParam)
          },
          getNextPageParam: () => undefined,
          staleTime: Infinity,
        }),
        queryClient,
      )

      override requestUpdate(
        ...args: Parameters<LitElement['requestUpdate']>
      ): void {
        this.updatesRequested += 1
        super.requestUpdate(...args)
      }

      forceUpdate(): void {
        super.requestUpdate()
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const infinite = host.infinite

    try {
      container.append(host)

      await vi.advanceTimersByTimeAsync(10)
      expect(infinite().isSuccess).toBe(true)

      host.updatesRequested = 0

      for (let i = 0; i < 5; i += 1) {
        host.forceUpdate()
        await host.updateComplete
        await Promise.resolve()
      }

      expect(host.updatesRequested).toBe(0)
      expect(infinite().data?.pages).toEqual([0])
      expect(callCount).toBe(1)
    } finally {
      infinite.destroy()
    }
  })

  it('should not request an update for refetch-only state changes when only data was read', async () => {
    const key = queryKey()
    let resolveRefetch: (() => void) | undefined

    class Host extends LitElement {
      updatesRequested = 0

      readonly infinite = createInfiniteQueryController(
        this,
        {
          queryKey: key,
          initialPageParam: 0,
          initialData: {
            pages: ['stable-page'],
            pageParams: [0],
          },
          staleTime: Infinity,
          queryFn: () =>
            new Promise<string>((resolve) => {
              resolveRefetch = () => resolve('stable-page')
            }),
          getNextPageParam: () => undefined,
        },
        queryClient,
      )

      override requestUpdate(
        ...args: Parameters<LitElement['requestUpdate']>
      ): void {
        this.updatesRequested += 1
        super.requestUpdate(...args)
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const infinite = host.infinite

    try {
      container.append(host)
      await host.updateComplete

      expect(infinite().data?.pages).toEqual(['stable-page'])
      await Promise.resolve()
      await Promise.resolve()

      host.updatesRequested = 0

      const refetch = infinite.refetch()
      expect(resolveRefetch).toBeDefined()
      await Promise.resolve()
      expect(host.updatesRequested).toBe(0)

      resolveRefetch!()
      await refetch
      await Promise.resolve()
      expect(host.updatesRequested).toBe(0)
    } finally {
      infinite.destroy()
    }
  })

  it('should refresh a suppressed result on the next accessor read when a newly read property changed', async () => {
    const key = queryKey()

    class Host extends LitElement {
      updatesRequested = 0

      readonly infinite = createInfiniteQueryController(
        this,
        {
          queryKey: key,
          initialPageParam: 0,
          initialData: {
            pages: ['initial-page'],
            pageParams: [0],
          },
          staleTime: Infinity,
          queryFn: async () => 'unused',
          getNextPageParam: () => undefined,
        },
        queryClient,
      )

      override requestUpdate(
        ...args: Parameters<LitElement['requestUpdate']>
      ): void {
        this.updatesRequested += 1
        super.requestUpdate(...args)
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const infinite = host.infinite

    try {
      container.append(host)
      await host.updateComplete

      expect(infinite().status).toBe('success')
      await Promise.resolve()
      await Promise.resolve()

      host.updatesRequested = 0

      queryClient.setQueryData(key, {
        pages: ['updated-page'],
        pageParams: [0],
      })

      await Promise.resolve()
      expect(infinite().data?.pages).toEqual(['updated-page'])
      expect(host.updatesRequested).toBe(0)
    } finally {
      infinite.destroy()
    }
  })

  it('should preserve prior pages consistently when fetching the next page fails', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly infinite = createInfiniteQueryController(
        this,
        {
          queryKey: key,
          initialPageParam: 0,
          queryFn: async ({ pageParam }) => {
            await sleep(10)
            const page = Number(pageParam)
            if (page === 1) {
              throw new Error('next-page-failed')
            }
            return page
          },
          getNextPageParam: (lastPage) =>
            lastPage < 1 ? lastPage + 1 : undefined,
          retry: false,
        },
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

    const nextPagePromise = infinite.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    const nextPageResult = await nextPagePromise
    expect(nextPageResult.isFetchNextPageError).toBe(true)
    expect(nextPageResult.error).toEqual(new Error('next-page-failed'))
    expect(infinite().isFetchNextPageError).toBe(true)
    expect(infinite().data?.pages).toEqual([0])
  })

  it('should fail deterministically and align imperative methods when the provider is missing', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly queryKey = key

      readonly infinite = createInfiniteQueryController(this, {
        queryKey: this.queryKey,
        initialPageParam: 0,
        queryFn: ({ pageParam }) => sleep(10).then(() => Number(pageParam)),
        getNextPageParam: (lastPage) =>
          lastPage < 1 ? lastPage + 1 : undefined,
        getPreviousPageParam: (firstPage) =>
          firstPage > -1 ? firstPage - 1 : undefined,
        retry: false,
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    const placeholderResult = consumer.infinite()

    expect(placeholderResult.status).toBe('pending')

    container.append(consumer)

    expect(() => consumer.infinite()).not.toThrow()
    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.infinite()).toThrow(/No QueryClient available/)
    await expect(consumer.infinite.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )
    await expect(consumer.infinite.fetchNextPage()).rejects.toThrow(
      /No QueryClient available/,
    )
    await expect(placeholderResult.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )
    await expect(placeholderResult.fetchNextPage()).rejects.toThrow(
      /No QueryClient available/,
    )
    await expect(placeholderResult.fetchPreviousPage()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.infinite.destroy()
    consumer.remove()
    await Promise.resolve()
  })

  it('should not throw for an infinite query controller on an already-connected host with an explicit client', async () => {
    const key = queryKey()
    queryClient.setQueryData(key, {
      pages: [0],
      pageParams: [0],
    })

    class Host extends LitElement {
      infinite?: InfiniteQueryResultAccessor<InfiniteData<number>, Error>
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    await host.updateComplete

    host.infinite = createInfiniteQueryController(
      host,
      {
        queryKey: key,
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => Number(pageParam),
        getNextPageParam: (lastPage) =>
          lastPage < 1 ? lastPage + 1 : undefined,
        staleTime: 30_000,
      },
      queryClient,
    )
    const infinite = host.infinite

    await Promise.resolve()
    await Promise.resolve()
    expect(infinite().isSuccess).toBe(true)
    expect(infinite().data?.pages).toEqual([0])

    infinite.destroy()
  })

  it('should defer explicit-client infinite accessors until host fields are initialized', () => {
    const key = queryKey()

    class DeferredExplicitInfiniteHost extends LitElement {
      readonly infinite = createInfiniteQueryController(
        this,
        () => ({
          queryKey: [...key, this.id],
          initialPageParam: 0,
          queryFn: async ({ pageParam }) => Number(pageParam),
          getNextPageParam: (lastPage) =>
            lastPage < 1 ? lastPage + 1 : undefined,
          retry: false,
        }),
        queryClient,
      )

      readonly firstRead = this.infinite()
      readonly id = 'alpha'
    }
    customElements.define(generateElementName(), DeferredExplicitInfiniteHost)

    expect(() => new DeferredExplicitInfiniteHost()).not.toThrow()

    const host = new DeferredExplicitInfiniteHost()
    expect(host.infinite().status).toBe('pending')

    host.infinite.destroy()
  })
})

describe('options helpers integration', () => {
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

  it('should integrate queryOptions with createQueryController', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        queryOptions({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'query-ok'),
        }),
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const query = host.query

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('query-ok')
  })

  it('should integrate mutationOptions with createMutationController', async () => {
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        mutationOptions({
          mutationFn: (value: number) => sleep(10).then(() => value + 10),
        }),
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation

    const mutatePromise = mutation.mutateAsync(5)
    await vi.advanceTimersByTimeAsync(10)
    await expect(mutatePromise).resolves.toBe(15)
    expect(mutation().isSuccess).toBe(true)
  })

  it('should integrate infiniteQueryOptions with createInfiniteQueryController', async () => {
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
