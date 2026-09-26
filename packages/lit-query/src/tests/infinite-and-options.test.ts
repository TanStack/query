import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import { createMutationController } from '../createMutationController.js'
import { createQueryController } from '../createQueryController.js'
import { infiniteQueryOptions } from '../infiniteQueryOptions.js'
import { mutationOptions } from '../mutationOptions.js'
import { queryOptions } from '../queryOptions.js'
import { TestControllerHost, TestElementHost } from './testHost.js'

const providerTagName = 'test-query-client-provider-infinite'
if (!customElements.get(providerTagName)) {
  customElements.define(providerTagName, QueryClientProvider)
}

let explicitInfiniteClient: QueryClient | undefined

const contextInfiniteKey = queryKey()

class ContextInfiniteHostElement extends TestElementHost {
  readonly queryKey = contextInfiniteKey

  readonly infinite = createInfiniteQueryController(
    this,
    {
      queryKey: this.queryKey,
      initialPageParam: 0,
      queryFn: ({ pageParam }) => sleep(10).then(() => Number(pageParam)),
      getNextPageParam: (lastPage) => (lastPage < 1 ? lastPage + 1 : undefined),
      getPreviousPageParam: (firstPage) =>
        firstPage > -1 ? firstPage - 1 : undefined,
      retry: false,
    },
    explicitInfiniteClient,
  )
}

const contextInfiniteTagName = 'test-context-infinite-host'
if (!customElements.get(contextInfiniteTagName)) {
  customElements.define(contextInfiniteTagName, ContextInfiniteHostElement)
}

describe('createInfiniteQueryController', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should resolve from the pre-connect placeholder state on the first provider connection', async () => {
    const consumer = document.createElement(
      contextInfiniteTagName,
    ) as ContextInfiniteHostElement

    expect(consumer.infinite().status).toBe('pending')
    await expect(consumer.infinite.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )
    await expect(consumer.infinite.fetchNextPage()).rejects.toThrow(
      /No QueryClient available/,
    )

    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = client
    provider.append(consumer)

    document.body.append(provider)
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
    const explicitClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const providerClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    explicitInfiniteClient = explicitClient

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = providerClient

    const consumer = document.createElement(
      contextInfiniteTagName,
    ) as ContextInfiniteHostElement
    provider.append(consumer)

    document.body.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.infinite().isSuccess).toBe(true)
    expect(consumer.infinite().data?.pages).toEqual([0])
    expect(
      explicitClient.getQueryCache().find({ queryKey: consumer.queryKey })
        ?.state.data,
    ).toEqual({ pages: [0], pageParams: [0] })
    expect(
      providerClient.getQueryCache().find({ queryKey: consumer.queryKey }),
    ).toBeUndefined()

    consumer.infinite.destroy()
    provider.remove()
    explicitInfiniteClient = undefined
    await Promise.resolve()
  })

  it('should support initial page, fetchNextPage, and fetchPreviousPage', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key = queryKey()
    const host = new TestControllerHost()
    const infinite = createInfiniteQueryController(
      host,
      {
        queryKey: key,
        initialPageParam: 0,
        queryFn: ({ pageParam }) => sleep(10).then(() => Number(pageParam)),
        getNextPageParam: (lastPage) =>
          lastPage < 1 ? lastPage + 1 : undefined,
        getPreviousPageParam: (firstPage) =>
          firstPage > -1 ? firstPage - 1 : undefined,
      },
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(infinite().isSuccess).toBe(true)
    expect(infinite().data?.pages).toEqual([0])

    const fetchNextPagePromise = infinite.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    await fetchNextPagePromise
    expect(infinite().data?.pages).toEqual([0, 1])

    const fetchPreviousPagePromise = infinite.fetchPreviousPage()
    await vi.advanceTimersByTimeAsync(10)
    await fetchPreviousPagePromise
    expect(infinite().data?.pages).toEqual([-1, 0, 1])
  })

  it('should not request another update when stable function options refresh during host update', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key = queryKey()
    const host = new TestControllerHost()
    let callCount = 0

    const infinite = createInfiniteQueryController(
      host,
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
      client,
    )

    try {
      host.connect()
      host.update()

      await vi.advanceTimersByTimeAsync(10)
      expect(infinite().isSuccess).toBe(true)

      host.updatesRequested = 0

      for (let i = 0; i < 5; i += 1) {
        host.update()
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
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key = queryKey()
    const host = new TestControllerHost()
    let resolveRefetch: (() => void) | undefined

    const infinite = createInfiniteQueryController(
      host,
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
      client,
    )

    try {
      host.connect()
      host.update()

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
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key = queryKey()
    const host = new TestControllerHost()

    const infinite = createInfiniteQueryController(
      host,
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
      client,
    )

    try {
      host.connect()
      host.update()

      expect(infinite().status).toBe('success')
      await Promise.resolve()
      await Promise.resolve()

      host.updatesRequested = 0

      client.setQueryData(key, {
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
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key = queryKey()
    const host = new TestControllerHost()
    const infinite = createInfiniteQueryController(
      host,
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
      },
      client,
    )

    host.connect()
    host.update()

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
    const consumer = document.createElement(
      contextInfiniteTagName,
    ) as ContextInfiniteHostElement
    const placeholderResult = consumer.infinite()

    expect(placeholderResult.status).toBe('pending')

    document.body.append(consumer)

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
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const key = queryKey()
    client.setQueryData(key, {
      pages: [0],
      pageParams: [0],
    })

    class AlreadyConnectedHost implements ReactiveControllerHost {
      private readonly controllers = new Set<ReactiveController>()
      private isConnected = true
      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

      addController(controller: ReactiveController): void {
        this.controllers.add(controller)
        if (this.isConnected) {
          controller.hostConnected?.()
        }
      }

      removeController(controller: ReactiveController): void {
        this.controllers.delete(controller)
      }

      requestUpdate(): void {
        this.updatesRequested += 1
      }
    }

    const host = new AlreadyConnectedHost()
    const infinite = createInfiniteQueryController(
      host,
      {
        queryKey: key,
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => Number(pageParam),
        getNextPageParam: (lastPage) =>
          lastPage < 1 ? lastPage + 1 : undefined,
        staleTime: 30_000,
      },
      client,
    )

    await Promise.resolve()
    await Promise.resolve()
    expect(infinite().isSuccess).toBe(true)
    expect(infinite().data?.pages).toEqual([0])

    infinite.destroy()
  })

  it('should defer explicit-client infinite accessors until host fields are initialized', () => {
    const client = new QueryClient()
    const key = queryKey()

    class DeferredExplicitInfiniteHost implements ReactiveControllerHost {
      private readonly controllers = new Set<ReactiveController>()

      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

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
        client,
      )

      readonly firstRead = this.infinite()
      readonly id = 'alpha'

      addController(controller: ReactiveController): void {
        this.controllers.add(controller)
      }

      removeController(controller: ReactiveController): void {
        this.controllers.delete(controller)
      }

      requestUpdate(): void {
        this.updatesRequested += 1
      }
    }

    expect(() => new DeferredExplicitInfiniteHost()).not.toThrow()

    const host = new DeferredExplicitInfiniteHost()
    expect(host.infinite().status).toBe('pending')

    host.infinite.destroy()
  })
})

describe('options helpers integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should integrate queryOptions with createQueryController', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const key = queryKey()
    const host = new TestControllerHost()

    const query = createQueryController(
      host,
      queryOptions({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'query-ok'),
      }),
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('query-ok')
  })

  it('should integrate mutationOptions with createMutationController', async () => {
    const client = new QueryClient()
    const host = new TestControllerHost()

    const mutation = createMutationController(
      host,
      mutationOptions({
        mutationFn: (value: number) => sleep(10).then(() => value + 10),
      }),
      client,
    )

    host.connect()
    host.update()

    const mutatePromise = mutation.mutateAsync(5)
    await vi.advanceTimersByTimeAsync(10)
    await expect(mutatePromise).resolves.toBe(15)
    expect(mutation().isSuccess).toBe(true)
  })

  it('should integrate infiniteQueryOptions with createInfiniteQueryController', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const key = queryKey()
    const host = new TestControllerHost()

    const infinite = createInfiniteQueryController(
      host,
      infiniteQueryOptions({
        queryKey: key,
        initialPageParam: 0,
        queryFn: ({ pageParam }) => sleep(10).then(() => Number(pageParam)),
        getNextPageParam: (lastPage) =>
          lastPage < 1 ? lastPage + 1 : undefined,
      }),
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(infinite().isSuccess).toBe(true)
    expect(infinite().data?.pages).toEqual([0])
  })
})
