import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, skipToken } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement, html } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import { generateElementName } from './utils.js'
import type { InfiniteQueryResultAccessor } from '../createInfiniteQueryController.js'
import type { InfiniteData, QueryFunctionContext } from '@tanstack/query-core'
import type { Mock } from 'vitest'

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

      override render() {
        return html`pages: ${this.infinite().data?.pages.join(', ') ?? 'none'}`
      }
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
    await expect(consumer.infinite.fetchPreviousPage()).rejects.toThrow(
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
    expect(consumer.shadowRoot).toHaveTextContent('pages: 0')

    consumer.infinite.destroy()
    provider.remove()
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

      override render() {
        return html`pages: ${this.infinite().data?.pages.join(', ') ?? 'none'}`
      }
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
    expect(consumer.shadowRoot).toHaveTextContent('pages: 0')
    expect(
      queryClient.getQueryCache().find({ queryKey: consumer.queryKey })?.state
        .data,
    ).toEqual({ pages: [0], pageParams: [0] })
    expect(
      providerClient.getQueryCache().find({ queryKey: consumer.queryKey }),
    ).toBeUndefined()

    consumer.infinite.destroy()
    provider.remove()
  })

  it('should fetch the initial page', async () => {
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
    expect(host.shadowRoot).toHaveTextContent('pages: none')
    await vi.advanceTimersByTimeAsync(10)
    expect(infinite().isSuccess).toBe(true)
    expect(infinite().data?.pages).toEqual([0])
    expect(host.shadowRoot).toHaveTextContent('pages: 0')
  })

  it('should append the next page with fetchNextPage', async () => {
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
    await vi.advanceTimersByTimeAsync(10)

    const fetchNextPagePromise = infinite.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    await fetchNextPagePromise
    expect(infinite().data?.pages).toEqual([0, 1])
    expect(host.shadowRoot).toHaveTextContent('pages: 0, 1')
  })

  it('should prepend the previous page with fetchPreviousPage', async () => {
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
    await vi.advanceTimersByTimeAsync(10)

    const fetchPreviousPagePromise = infinite.fetchPreviousPage()
    await vi.advanceTimersByTimeAsync(10)
    await fetchPreviousPagePromise
    expect(infinite().data?.pages).toEqual([-1, 0])
    expect(host.shadowRoot).toHaveTextContent('pages: -1, 0')
  })

  it('should not cancel an ongoing fetchNextPage request when another fetchNextPage is invoked if `cancelRefetch: false` is used', async () => {
    const key = queryKey()
    const start = 10
    const onAborts: Array<Mock<(...args: Array<any>) => any>> = []
    const abortListeners: Array<Mock<(...args: Array<any>) => any>> = []
    const fetchPage = vi.fn<
      (context: QueryFunctionContext<typeof key, number>) => Promise<number>
    >(async ({ pageParam, signal }) => {
      const onAbort = vi.fn()
      const abortListener = vi.fn()
      onAborts.push(onAbort)
      abortListeners.push(abortListener)
      signal.onabort = onAbort
      signal.addEventListener('abort', abortListener)
      await sleep(50)
      return pageParam
    })

    class Host extends LitElement {
      readonly infinite = createInfiniteQueryController(
        this,
        {
          queryKey: key,
          queryFn: fetchPage,
          initialPageParam: start,
          getNextPageParam: (lastPage) => lastPage + 1,
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
    await vi.advanceTimersByTimeAsync(50)

    host.infinite.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    host.infinite.fetchNextPage({ cancelRefetch: false })
    await vi.advanceTimersByTimeAsync(40)
    expect(host.shadowRoot).toHaveTextContent('pages: 10, 11')

    const expectedCallCount = 2
    expect(fetchPage).toHaveBeenCalledTimes(expectedCallCount)
    expect(onAborts).toHaveLength(expectedCallCount)
    expect(abortListeners).toHaveLength(expectedCallCount)

    let callIndex = 0
    const firstCtx = fetchPage.mock.calls[callIndex]![0]
    expect(firstCtx.pageParam).toEqual(start)
    expect(firstCtx.queryKey).toEqual(key)
    expect(firstCtx.signal).toBeInstanceOf(AbortSignal)
    expect(firstCtx.signal.aborted).toBe(false)
    expect(onAborts[callIndex]).not.toHaveBeenCalled()
    expect(abortListeners[callIndex]).not.toHaveBeenCalled()

    callIndex = 1
    const secondCtx = fetchPage.mock.calls[callIndex]![0]
    expect(secondCtx.pageParam).toBe(11)
    expect(secondCtx.queryKey).toEqual(key)
    expect(secondCtx.signal).toBeInstanceOf(AbortSignal)
    expect(secondCtx.signal.aborted).toBe(false)
    expect(onAborts[callIndex]).not.toHaveBeenCalled()
    expect(abortListeners[callIndex]).not.toHaveBeenCalled()
  })

  it('should not request another update when stable function options refresh during host update', async () => {
    const key = queryKey()
    let callCount = 0

    class Host extends LitElement {
      static override properties = { count: { type: Number } }

      declare count: number

      updatesRequested = 0

      readonly infinite = createInfiniteQueryController(
        this,
        () => ({
          queryKey: key,
          initialPageParam: 0,
          queryFn: ({ pageParam }) =>
            sleep(10).then(() => {
              callCount += 1
              return Number(pageParam)
            }),
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
        host.count = i
        await host.updateComplete
      }
      expect(host.updatesRequested).toBe(5)
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
      await vi.advanceTimersByTimeAsync(0)

      host.updatesRequested = 0

      const refetch = infinite.refetch()
      expect(resolveRefetch).toBeDefined()
      await vi.advanceTimersByTimeAsync(0)
      expect(host.updatesRequested).toBe(0)

      resolveRefetch!()
      await refetch
      await vi.advanceTimersByTimeAsync(0)
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
          queryFn: () => sleep(10).then(() => 'unused'),
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
      await vi.advanceTimersByTimeAsync(0)

      host.updatesRequested = 0

      queryClient.setQueryData(key, {
        pages: ['updated-page'],
        pageParams: [0],
      })
      await vi.advanceTimersByTimeAsync(0)
      expect(infinite().data?.pages).toEqual(['updated-page'])
      expect(host.updatesRequested).toBe(0)
    } finally {
      infinite.destroy()
    }
  })

  it('should return the same result between reads when nothing changed', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly infinite = createInfiniteQueryController(
        this,
        {
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
          initialPageParam: 0,
          getNextPageParam: () => undefined,
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    const infinite = host.infinite
    await vi.advanceTimersByTimeAsync(10)
    const result = infinite()
    expect(infinite()).toBe(result)
  })

  it('should preserve prior pages consistently when fetching the next page fails', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly infinite = createInfiniteQueryController(
        this,
        {
          queryKey: key,
          initialPageParam: 0,
          queryFn: ({ pageParam }) =>
            sleep(10).then(() => {
              const page = Number(pageParam)
              if (page === 1) {
                throw new Error('next-page-failed')
              }
              return page
            }),
          getNextPageParam: (lastPage) =>
            lastPage < 1 ? lastPage + 1 : undefined,
          retry: false,
        },
        queryClient,
      )

      override render() {
        const infinite = this.infinite()
        const pages = infinite.data?.pages.join(', ') ?? 'none'
        return html`pages: ${pages}, error: ${infinite.error?.message ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    const infinite = host.infinite
    await vi.advanceTimersByTimeAsync(10)
    expect(infinite().isSuccess).toBe(true)
    expect(infinite().data?.pages).toEqual([0])
    expect(host.shadowRoot).toHaveTextContent('pages: 0, error: none')

    const nextPagePromise = infinite.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    const nextPageResult = await nextPagePromise
    expect(nextPageResult.isFetchNextPageError).toBe(true)
    expect(nextPageResult.error).toEqual(new Error('next-page-failed'))
    expect(infinite().isFetchNextPageError).toBe(true)
    expect(infinite().data?.pages).toEqual([0])
    expect(host.shadowRoot).toHaveTextContent(
      'pages: 0, error: next-page-failed',
    )
  })

  it('should cancel the query function when there are no more subscriptions', async () => {
    const key = queryKey()
    let cancelFn: Mock = vi.fn()

    const queryFn = ({ signal }: { signal?: AbortSignal }) => {
      const promise = new Promise<string>((resolve, reject) => {
        cancelFn = vi.fn(() => reject('Cancelled'))
        signal?.addEventListener('abort', cancelFn)
        sleep(1000).then(() => resolve('OK'))
      })

      return promise
    }

    class Host extends LitElement {
      readonly infinite = createInfiniteQueryController(
        this,
        {
          queryKey: key,
          queryFn,
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        },
        queryClient,
      )

      override render() {
        return html`status: ${this.infinite().status}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    await host.updateComplete
    expect(host.shadowRoot).toHaveTextContent('status: pending')

    host.remove()
    expect(cancelFn).toHaveBeenCalled()
  })

  it('should not fetch when queryFn is skipToken, and fetch once it is replaced', async () => {
    const key = queryKey()
    const queryFn = vi.fn(({ pageParam }: { pageParam: number }) =>
      sleep(10).then(() => `comments for 1 page ${pageParam}`),
    )

    class Host extends LitElement {
      static override properties = { postId: { type: String } }

      declare postId: string | undefined

      readonly infinite = createInfiniteQueryController(
        this,
        () => ({
          queryKey: key,
          queryFn: this.postId != null ? queryFn : skipToken,
          initialPageParam: 0,
          getNextPageParam: () => 12,
        }),
        queryClient,
      )

      override render() {
        const infinite = this.infinite()
        const pages = infinite.data?.pages.join(', ') ?? 'none'
        return html`isFetching: ${String(infinite.isFetching)}, pages: ${pages}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    await host.updateComplete
    expect(host.shadowRoot).toHaveTextContent('isFetching: false')
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).not.toHaveBeenCalled()
    expect(host.shadowRoot).toHaveTextContent('isFetching: false, pages: none')

    host.postId = '1'
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(host.shadowRoot).toHaveTextContent('pages: comments for 1 page 0')
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
    await expect(consumer.infinite.fetchPreviousPage()).rejects.toThrow(
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
  })

  it('should reuse hydrated data on an already-connected host without an eager refetch', async () => {
    const key = queryKey()
    let queryFnCalls = 0

    queryClient.setQueryData(key, { pages: [0], pageParams: [0] })

    class Host extends LitElement {
      infinite?: InfiniteQueryResultAccessor<InfiniteData<number>, Error>

      override render() {
        return html`pages: ${this.infinite?.().data?.pages.join(', ') ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    await host.updateComplete

    host.infinite = createInfiniteQueryController(
      host,
      {
        queryKey: key,
        queryFn: ({ pageParam }) => {
          queryFnCalls += 1
          return sleep(10).then(() => pageParam)
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage + 1,
        staleTime: 30000,
      },
      queryClient,
    )
    const infinite = host.infinite
    await vi.advanceTimersByTimeAsync(0)
    expect(infinite().data?.pages).toEqual([0])
    expect(queryFnCalls).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('pages: 0')

    infinite.destroy()
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
        queryFn: ({ pageParam }) => sleep(10).then(() => Number(pageParam) + 1),
        getNextPageParam: (lastPage) =>
          lastPage < 1 ? lastPage + 1 : undefined,
        staleTime: 30000,
      },
      queryClient,
    )
    const infinite = host.infinite
    expect(infinite().isSuccess).toBe(true)
    expect(infinite().data?.pages).toEqual([0])
    await vi.advanceTimersByTimeAsync(10)
    expect(infinite().data?.pages).toEqual([0])

    infinite.destroy()
  })

  it('should defer explicit-client infinite accessors until host fields are initialized', async () => {
    const key = queryKey()

    class DeferredExplicitInfiniteHost extends LitElement {
      readonly infinite = createInfiniteQueryController(
        this,
        () => ({
          queryKey: [...key, this.id],
          initialPageParam: 0,
          queryFn: ({ pageParam }) => sleep(10).then(() => Number(pageParam)),
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

    container.append(host)
    await vi.advanceTimersByTimeAsync(10)
    expect(host.infinite().data?.pages).toEqual([0])
    expect(
      queryClient
        .getQueryCache()
        .findAll({ queryKey: key })
        .map((query) => query.queryKey),
    ).toEqual([[...key, 'alpha']])

    host.infinite.destroy()
  })

  it('should switch infinite query controller to new provider client while connected', async () => {
    const key = queryKey()
    const clientA = new QueryClient()
    const clientB = new QueryClient()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = clientA
    container.append(provider)
    await provider.updateComplete

    class Consumer extends LitElement {
      pageCalls = 0
      readonly queryKey = key

      readonly infinite = createInfiniteQueryController(this, () => ({
        queryKey: this.queryKey,
        initialPageParam: 0,
        queryFn: ({ pageParam }) => {
          this.pageCalls += 1
          return sleep(10).then(() => Number(pageParam))
        },
        getNextPageParam: (lastPage: number) =>
          lastPage < 1 ? lastPage + 1 : undefined,
        retry: false,
      }))

      override render() {
        return html`pages: ${this.infinite().data?.pages.join(', ') ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    provider.append(consumer)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.infinite().isSuccess).toBe(true)
    expect(consumer.infinite().data?.pages).toEqual([0])
    expect(consumer.shadowRoot).toHaveTextContent('pages: 0')

    const cacheAEntryBeforeSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(cacheAEntryBeforeSwitch?.getObserversCount()).toBe(1)

    provider.client = clientB
    await provider.updateComplete
    await vi.advanceTimersByTimeAsync(0)
    expect(consumer.shadowRoot).toHaveTextContent('pages: none')
    await vi.advanceTimersByTimeAsync(10)
    expect(
      clientB
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount(),
    ).toBe(1)
    expect(consumer.infinite().isSuccess).toBe(true)
    expect(consumer.infinite().data?.pages).toEqual([0])
    expect(consumer.infinite().hasNextPage).toBe(true)
    expect(consumer.shadowRoot).toHaveTextContent('pages: 0')

    const cacheAEntryAfterSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(cacheAEntryAfterSwitch?.getObserversCount() ?? 0).toBe(0)

    void consumer.infinite.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.infinite().data?.pages).toEqual([0, 1])
    expect(consumer.shadowRoot).toHaveTextContent('pages: 0, 1')

    consumer.infinite.destroy()
    provider.remove()
  })

  it('should reparent infinite query controller under a different provider and bind the new nearest client', async () => {
    const key = queryKey()
    const clientA = new QueryClient()
    const clientB = new QueryClient()

    const providerA = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    providerA.client = clientA
    const providerB = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    providerB.client = clientB

    class Consumer extends LitElement {
      pageCalls = 0
      readonly queryKey = key

      readonly infinite = createInfiniteQueryController(this, () => ({
        queryKey: this.queryKey,
        initialPageParam: 0,
        queryFn: ({ pageParam }) => {
          this.pageCalls += 1
          return sleep(10).then(() => Number(pageParam))
        },
        getNextPageParam: (lastPage: number) =>
          lastPage < 1 ? lastPage + 1 : undefined,
        retry: false,
      }))

      override render() {
        return html`pages: ${this.infinite().data?.pages.join(', ') ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    providerA.append(consumer)

    container.append(providerA)
    await providerA.updateComplete
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.infinite().isSuccess).toBe(true)
    expect(consumer.shadowRoot).toHaveTextContent('pages: 0')

    consumer.remove()
    expect(
      clientA
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount() ?? 0,
    ).toBe(0)

    providerA.remove()

    providerB.append(consumer)
    container.append(providerB)
    await providerB.updateComplete
    expect(consumer.shadowRoot).toHaveTextContent('pages: none')
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.infinite().isSuccess).toBe(true)
    expect(consumer.infinite().data?.pages).toEqual([0])
    expect(consumer.shadowRoot).toHaveTextContent('pages: 0')
    expect(consumer.pageCalls).toBe(2)
    expect(
      clientA
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount() ?? 0,
    ).toBe(0)
    expect(
      clientB
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount(),
    ).toBe(1)

    consumer.infinite.destroy()
    providerA.remove()
    providerB.remove()
  })
})
