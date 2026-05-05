import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import { createMutationController } from '../createMutationController.js'
import { createQueryController } from '../createQueryController.js'
import { infiniteQueryOptions } from '../infiniteQueryOptions.js'
import { mutationOptions } from '../mutationOptions.js'
import { queryOptions } from '../queryOptions.js'
import {
  TestControllerHost,
  TestElementHost,
  waitFor,
  waitForMissingQueryClient,
} from './testHost.js'

const providerTagName = 'test-query-client-provider-infinite'
if (!customElements.get(providerTagName)) {
  customElements.define(providerTagName, QueryClientProvider)
}

let explicitInfiniteClient: QueryClient | undefined

class ContextInfiniteHostElement extends TestElementHost {
  readonly queryKey = ['context-infinite'] as const

  readonly infinite = createInfiniteQueryController(
    this,
    {
      queryKey: this.queryKey,
      initialPageParam: 0,
      queryFn: async ({ pageParam }) => Number(pageParam),
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
  it('LC-INF-01: first provider connection resolves from the pre-connect placeholder state', async () => {
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

    await waitFor(() => consumer.infinite().isSuccess)
    expect(consumer.infinite().data?.pages).toEqual([0])

    consumer.infinite.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('LC-INF-02: explicit client takes precedence over provider context', async () => {
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

    await waitFor(() => consumer.infinite().isSuccess)
    expect(consumer.infinite().data?.pages).toEqual([0])
    expect(
      explicitClient.getQueryCache().find({ queryKey: consumer.queryKey }),
    ).toBeDefined()
    expect(
      providerClient.getQueryCache().find({ queryKey: consumer.queryKey }),
    ).toBeUndefined()

    consumer.infinite.destroy()
    provider.remove()
    explicitInfiniteClient = undefined
    await Promise.resolve()
  })

  it('M14: supports initial page, fetchNextPage, and fetchPreviousPage', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    const infinite = createInfiniteQueryController(
      host,
      {
        queryKey: ['m14', 'infinite'],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => Number(pageParam),
        getNextPageParam: (lastPage) =>
          lastPage < 1 ? lastPage + 1 : undefined,
        getPreviousPageParam: (firstPage) =>
          firstPage > -1 ? firstPage - 1 : undefined,
      },
      client,
    )

    host.connect()
    host.update()

    await waitFor(() => infinite().isSuccess)
    expect(infinite().data?.pages).toEqual([0])

    await infinite.fetchNextPage()
    await waitFor(() => (infinite().data?.pages.length ?? 0) === 2)
    expect(infinite().data?.pages).toEqual([0, 1])

    await infinite.fetchPreviousPage()
    await waitFor(() => (infinite().data?.pages.length ?? 0) === 3)
    expect(infinite().data?.pages).toEqual([-1, 0, 1])
  })

  it('INFEDGE-01: next-page failure preserves prior pages consistently', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    const infinite = createInfiniteQueryController(
      host,
      {
        queryKey: ['infedge-01'],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
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

    await waitFor(() => infinite().isSuccess)
    expect(infinite().data?.pages).toEqual([0])

    const nextPageResult = await infinite.fetchNextPage()
    expect(nextPageResult.isFetchNextPageError).toBe(true)
    expect(nextPageResult.error).toBeInstanceOf(Error)
    await waitFor(() => infinite().isFetchNextPageError)
    expect(infinite().data?.pages).toEqual([0])
  })

  it('LC-INF-03: missing provider fails deterministically and imperative methods align', async () => {
    const consumer = document.createElement(
      contextInfiniteTagName,
    ) as ContextInfiniteHostElement
    const placeholderResult = consumer.infinite()

    expect(placeholderResult.status).toBe('pending')

    document.body.append(consumer)

    expect(() => consumer.infinite()).not.toThrow()
    await waitForMissingQueryClient(() => consumer.infinite())

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

  it('ALREADYCONN-INF-01: infinite query controller on already-connected host with explicit client does not throw', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    client.setQueryData(['already-connected-infinite'], {
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
        queryKey: ['already-connected-infinite'],
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

  it('LC-INF-04: explicit-client infinite accessors defer until host fields are initialized', () => {
    const client = new QueryClient()

    class DeferredExplicitInfiniteHost implements ReactiveControllerHost {
      private readonly controllers = new Set<ReactiveController>()

      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

      readonly infinite = createInfiniteQueryController(
        this,
        () => ({
          queryKey: ['deferred-explicit-infinite', this.id] as const,
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
  it('OPT-01: queryOptions integrates with createQueryController', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const host = new TestControllerHost()

    const query = createQueryController(
      host,
      queryOptions({
        queryKey: ['opt-01', 'query'] as const,
        queryFn: async () => 'query-ok',
      }),
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => query().isSuccess)
    expect(query().data).toBe('query-ok')
  })

  it('OPT-01: mutationOptions integrates with createMutationController', async () => {
    const client = new QueryClient()
    const host = new TestControllerHost()

    const mutation = createMutationController(
      host,
      mutationOptions({
        mutationFn: async (value: number) => value + 10,
      }),
      client,
    )

    host.connect()
    host.update()
    await expect(mutation.mutateAsync(5)).resolves.toBe(15)
    expect(mutation().isSuccess).toBe(true)
  })

  it('OPT-01: infiniteQueryOptions integrates with createInfiniteQueryController', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const host = new TestControllerHost()

    const infinite = createInfiniteQueryController(
      host,
      infiniteQueryOptions({
        queryKey: ['opt-01', 'infinite'],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => Number(pageParam),
        getNextPageParam: (lastPage) =>
          lastPage < 1 ? lastPage + 1 : undefined,
      }),
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => infinite().isSuccess)
    expect(infinite().data?.pages).toEqual([0])
  })
})
