import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, keepPreviousData } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement, html } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createQueryController } from '../createQueryController.js'
import { generateElementName } from './utils.js'
import type { QueryResultAccessor } from '../createQueryController.js'

const providerTagName = generateElementName()
customElements.define(providerTagName, QueryClientProvider)

describe('createQueryController', () => {
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

  it('should not request update after destroy when microtask flushes', async () => {
    const key = queryKey()

    class Host extends LitElement {
      updatesRequested = 0

      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'done'),
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
    const query = host.query

    container.append(host)
    query.destroy()
    await vi.advanceTimersByTimeAsync(0)
    expect(host.updatesRequested).toBe(0)
  })

  it('should return observer count to baseline after 100 lifecycle cycles', async () => {
    const key = queryKey()

    for (let cycle = 0; cycle < 100; cycle += 1) {
      class Host extends LitElement {
        readonly query = createQueryController(
          this,
          {
            queryKey: key,
            queryFn: () => sleep(10).then(() => cycle),
          },
          queryClient,
        )
      }
      customElements.define(generateElementName(), Host)
      const host = new Host()
      const query = host.query

      container.append(host)
      await vi.advanceTimersByTimeAsync(10)
      expect(query().isSuccess).toBe(true)

      const cacheQuery = queryClient.getQueryCache().find({ queryKey: key })
      expect(cacheQuery?.getObserversCount()).toBe(1)

      host.remove()
      query.destroy()
      expect(cacheQuery?.getObserversCount() ?? 0).toBe(0)
    }
  })

  it('should fetch and update query state', async () => {
    const key = queryKey()

    let callCount = 0

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () => {
            callCount += 1
            return sleep(10).then(() => ({ id: 1, name: 'Ada' }))
          },
        },
        queryClient,
      )

      override render() {
        return html`name: ${this.query().data?.name ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)
    await host.updateComplete

    expect(host.shadowRoot).toHaveTextContent('name: none')

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toEqual({ id: 1, name: 'Ada' })
    expect(callCount).toBe(1)
    expect(host.shadowRoot).toHaveTextContent('name: Ada')
  })

  it('should not request another update when stable function options refresh during host update', async () => {
    const key = queryKey()

    let callCount = 0

    class Host extends LitElement {
      static override properties = { count: { type: Number } }

      declare count: number

      updatesRequested = 0

      readonly query = createQueryController(
        this,
        () => ({
          queryKey: key,
          queryFn: () => {
            callCount += 1
            return sleep(10).then(() => 'stable-result')
          },
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
    const query = host.query

    try {
      container.append(host)
      await vi.advanceTimersByTimeAsync(10)
      expect(query().isSuccess).toBe(true)

      host.updatesRequested = 0

      for (let i = 0; i < 5; i += 1) {
        host.count = i
        await host.updateComplete
      }

      expect(host.updatesRequested).toBe(5)
      expect(query().data).toBe('stable-result')
      expect(callCount).toBe(1)
    } finally {
      query.destroy()
    }
  })

  it('should not request an update for refetch-only state changes when only data was read', async () => {
    const key = queryKey()
    let resolveRefetch: (() => void) | undefined

    class Host extends LitElement {
      updatesRequested = 0

      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          initialData: 'stable-data',
          staleTime: Infinity,
          queryFn: () =>
            new Promise<string>((resolve) => {
              resolveRefetch = () => resolve('stable-data')
            }),
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
    const query = host.query

    try {
      container.append(host)
      await host.updateComplete

      expect(query().data).toBe('stable-data')
      await host.updateComplete

      host.updatesRequested = 0

      const refetch = query.refetch()
      expect(resolveRefetch).toBeDefined()
      await host.updateComplete
      expect(host.updatesRequested).toBe(0)

      resolveRefetch!()
      await refetch
      await host.updateComplete
      expect(host.updatesRequested).toBe(0)
    } finally {
      query.destroy()
    }
  })

  it('should refresh a suppressed result on the next accessor read when a newly read property changed', async () => {
    const key = queryKey()

    class Host extends LitElement {
      updatesRequested = 0

      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          initialData: 'initial-data',
          staleTime: Infinity,
          queryFn: () => sleep(10).then(() => 'unused'),
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
    const query = host.query

    try {
      container.append(host)
      await host.updateComplete

      expect(query().status).toBe('success')
      await host.updateComplete

      host.updatesRequested = 0

      queryClient.setQueryData(key, 'updated-data')

      await host.updateComplete
      expect(host.updatesRequested).toBe(0)

      expect(query().data).toBe('updated-data')
      expect(host.updatesRequested).toBe(0)
    } finally {
      query.destroy()
    }
  })

  it('should return the same result between reads when nothing changed', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const query = host.query

    await vi.advanceTimersByTimeAsync(10)
    const result = query()
    expect(query()).toBe(result)
  })

  it('should transition from pending to success with expected contract', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'ok'),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    expect(query().status).toBe('pending')
    expect(query().isSuccess).toBe(false)

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().status).toBe('success')
    expect(query().data).toBe('ok')
  })

  it('should not fetch when enabled=false and fetch after enabling', async () => {
    const key = queryKey()

    let callCount = 0
    let enabled = false

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        () => ({
          queryKey: key,
          enabled,
          queryFn: () => {
            callCount += 1
            return sleep(10).then(() => 'enabled-result')
          },
        }),
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(callCount).toBe(0)
    expect(query().isSuccess).toBe(false)

    enabled = true
    host.requestUpdate()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(callCount).toBe(1)
    expect(query().data).toBe('enabled-result')
  })

  it('should not leak observers and should refetch on remount with gcTime=0', async () => {
    const key = queryKey()
    let callCount = 0

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          gcTime: 0,
          queryFn: () => {
            callCount += 1
            return sleep(10).then(() => `value-${callCount}`)
          },
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)

    const firstHost = new Host()
    const firstQuery = firstHost.query

    container.append(firstHost)

    await vi.advanceTimersByTimeAsync(10)
    expect(firstQuery().isSuccess).toBe(true)

    const firstCacheEntry = queryClient.getQueryCache().find({ queryKey: key })
    expect(firstCacheEntry?.getObserversCount()).toBe(1)
    expect(callCount).toBe(1)

    firstHost.remove()
    firstQuery.destroy()
    // With gcTime:0, cache entry may be immediately removed after last observer unmounts.
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: key })
        ?.getObserversCount() ?? 0,
    ).toBe(0)

    const secondHost = new Host()
    const secondQuery = secondHost.query

    container.append(secondHost)

    await vi.advanceTimersByTimeAsync(10)
    expect(secondQuery().isSuccess).toBe(true)
    expect(secondQuery().data).toBe('value-2')

    const secondCacheEntry = queryClient.getQueryCache().find({ queryKey: key })
    expect(secondCacheEntry?.getObserversCount()).toBe(1)
    expect(callCount).toBe(2)
    expect(secondQuery().data).toBe('value-2')
  })

  it('should apply latest accessor key/options on updates and refetch', async () => {
    const key = queryKey()

    let keyId = 1
    const seenKeys: Array<number> = []

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        () => ({
          queryKey: [...key, keyId],
          queryFn: ({ queryKey }) => {
            const id = queryKey[1] as number
            seenKeys.push(id)
            return sleep(10).then(() => `user-${id}`)
          },
        }),
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('user-1')

    keyId = 2
    host.requestUpdate()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('user-2')

    const refetchPromise = query.refetch()
    await vi.advanceTimersByTimeAsync(10)
    await expect(refetchPromise).resolves.toMatchObject({ data: 'user-2' })
    expect(query().data).toBe('user-2')
    expect(seenKeys.includes(1)).toBe(true)
    expect(seenKeys.includes(2)).toBe(true)
  })

  it('should not request a host update when function options resolve to an unchanged result', async () => {
    const key = queryKey()

    let callCount = 0

    class Host extends LitElement {
      static override properties = { count: { type: Number } }

      declare count: number

      updatesRequested = 0

      readonly query = createQueryController(
        this,
        () => ({
          queryKey: key,
          staleTime: Infinity,
          queryFn: () => {
            callCount += 1
            return sleep(10).then(() => 'stable')
          },
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
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    await host.updateComplete
    const updatesAfterSuccess = host.updatesRequested

    host.count = 1
    await host.updateComplete
    expect(query().data).toBe('stable')
    expect(callCount).toBe(1)
    expect(host.updatesRequested).toBe(updatesAfterSuccess + 1)
  })

  it('should refetch on mount when the data is stale', async () => {
    const key = queryKey()
    let callCount = 0

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          staleTime: 0,
          refetchOnMount: true,
          queryFn: () => {
            callCount += 1
            return sleep(10).then(() => `value-${callCount}`)
          },
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)

    const firstHost = new Host()
    const firstQuery = firstHost.query

    container.append(firstHost)

    await vi.advanceTimersByTimeAsync(10)
    expect(firstQuery().isSuccess).toBe(true)
    expect(callCount).toBe(1)

    firstHost.remove()
    firstQuery.destroy()

    const secondHost = new Host()
    const secondQuery = secondHost.query

    container.append(secondHost)

    await vi.advanceTimersByTimeAsync(0)
    expect(callCount).toBe(2)
    expect(secondQuery().isSuccess).toBe(true)
  })

  it('should not refetch on mount when the data is fresh', async () => {
    const key = queryKey()
    let callCount = 0

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          staleTime: Number.POSITIVE_INFINITY,
          refetchOnMount: true,
          queryFn: () => {
            callCount += 1
            return sleep(10).then(() => `value-${callCount}`)
          },
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)

    const firstHost = new Host()
    const firstQuery = firstHost.query

    container.append(firstHost)

    await vi.advanceTimersByTimeAsync(10)
    expect(firstQuery().isSuccess).toBe(true)
    expect(callCount).toBe(1)

    firstHost.remove()
    firstQuery.destroy()

    const secondHost = new Host()
    const secondQuery = secondHost.query

    container.append(secondHost)

    expect(secondQuery().isSuccess).toBe(true)
    await vi.advanceTimersByTimeAsync(10)
    expect(callCount).toBe(1)
    expect(secondQuery().data).toBe('value-1')
  })

  it('should transform data with select', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () => sleep(10).then(() => ({ value: 2 })),
          select: (payload: { value: number }) => payload.value * 10,
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe(20)
  })

  it('should surface a throwing select as an error', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () => sleep(10).then(() => ({ value: 2 })),
          select: (_payload: { value: number }): number => {
            throw new Error('select-failed')
          },
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isError).toBe(true)
    expect(query().error).toEqual(new Error('select-failed'))
  })

  it('should preserve prior data during key transitions with keepPreviousData', async () => {
    const key = queryKey()

    let keyId = 1
    let resolveSecond: ((value: string) => void) | undefined

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        () => ({
          queryKey: [...key, keyId],
          queryFn: async ({ queryKey }) => {
            const id = queryKey[1] as number
            if (id === 1) {
              return sleep(10).then(() => 'value-1')
            }

            return new Promise<string>((resolve) => {
              resolveSecond = resolve
            })
          },
          placeholderData: keepPreviousData,
        }),
        queryClient,
      )

      override render() {
        const result = this.query()
        return html`
          <p>data: ${result.data ?? 'none'}</p>
          <p>placeholder: ${result.isPlaceholderData}</p>
        `
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('value-1')
    expect(host.shadowRoot).toHaveTextContent('data: value-1')
    expect(host.shadowRoot).toHaveTextContent('placeholder: false')

    keyId = 2
    host.requestUpdate()
    await host.updateComplete

    expect(query().isFetching).toBe(true)
    expect(query().isPlaceholderData).toBe(true)
    expect(query().data).toBe('value-1')
    expect(host.shadowRoot).toHaveTextContent('data: value-1')
    expect(host.shadowRoot).toHaveTextContent('placeholder: true')

    resolveSecond?.('value-2')
    await vi.advanceTimersByTimeAsync(0)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('value-2')
    expect(query().isPlaceholderData).toBe(false)
    expect(host.shadowRoot).toHaveTextContent('data: value-2')
    expect(host.shadowRoot).toHaveTextContent('placeholder: false')
  })

  it('should refetch and update result state on invalidation', async () => {
    const key = queryKey()
    let callCount = 0

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () => {
            callCount += 1
            return sleep(10).then(() => `v${callCount}`)
          },
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('v1')
    expect(callCount).toBe(1)

    void queryClient.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(10)
    expect(callCount).toBe(2)
    expect(query().data).toBe('v2')
    expect(query().isSuccess).toBe(true)
  })

  it('should not overwrite a newer key result with a stale older response', async () => {
    const key = queryKey()

    let keyId = 'old'
    let resolveOld: ((value: string) => void) | undefined
    let resolveNew: ((value: string) => void) | undefined

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        () => ({
          queryKey: [...key, keyId],
          queryFn: async ({ queryKey }) => {
            const id = queryKey[1] as string
            return new Promise<string>((resolve) => {
              if (id === 'old') {
                resolveOld = resolve
              } else {
                resolveNew = resolve
              }
            })
          },
        }),
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(0)
    expect(resolveOld).toBeTypeOf('function')

    keyId = 'new'
    host.requestUpdate()
    await host.updateComplete

    expect(resolveNew).toBeTypeOf('function')

    resolveNew?.('new-value')
    await vi.advanceTimersByTimeAsync(0)
    expect(query().data).toBe('new-value')

    resolveOld?.('old-value')
    await vi.advanceTimersByTimeAsync(0)
    expect(query().data).toBe('new-value')
    expect(query().isSuccess).toBe(true)
  })

  it('should pass an AbortSignal to queryFn and abort the prior request on key switch', async () => {
    const key = queryKey()

    let keyId: 'old' | 'new' = 'old'
    let oldSignal: AbortSignal | undefined
    let resolveOld: ((value: string) => void) | undefined

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        () => ({
          queryKey: [...key, keyId],
          queryFn: async ({ signal, queryKey }) => {
            const id = queryKey[1] as 'old' | 'new'
            if (id === 'old') {
              oldSignal = signal
              return new Promise<string>((resolve) => {
                resolveOld = resolve
                signal.addEventListener('abort', () => resolve('old-aborted'), {
                  once: true,
                })
              })
            }

            return sleep(10).then(() => 'new-success')
          },
        }),
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(0)
    expect(oldSignal).toBeInstanceOf(AbortSignal)
    expect(oldSignal?.aborted).toBe(false)

    keyId = 'new'
    host.requestUpdate()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().data).toBe('new-success')
    expect(oldSignal?.aborted).toBe(true)

    resolveOld?.('old-late')
    await vi.advanceTimersByTimeAsync(0)
    expect(query().data).toBe('new-success')
  })

  it('should maintain a stable final state without duplicate observers under rapid key churn', async () => {
    const key = queryKey()

    let keyId = 0

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        () => ({
          queryKey: [...key, keyId],
          queryFn: ({ queryKey }) => {
            const id = queryKey[1] as number
            return sleep(Math.max(1, 20 - id)).then(() => `result-${id}`)
          },
        }),
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)
    await host.updateComplete

    for (let i = 1; i <= 20; i += 1) {
      keyId = i
      host.requestUpdate()
      await host.updateComplete
    }

    await vi.advanceTimersByTimeAsync(1)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('result-20')

    const latestCacheEntry = queryClient
      .getQueryCache()
      .find({ queryKey: [...key, 20] })
    expect(latestCacheEntry?.getObserversCount()).toBe(1)
  })

  it('should not process detached updates when disconnected while in-flight', async () => {
    const key = queryKey()

    let resolveFetch: ((value: string) => void) | undefined

    class Host extends LitElement {
      updatesRequested = 0

      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () =>
            new Promise<string>((resolve) => {
              resolveFetch = resolve
            }),
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
    const query = host.query

    container.append(host)
    await host.updateComplete

    expect(query().isFetching).toBe(true)

    host.remove()
    await host.updateComplete
    const updatesAfterDisconnect = host.updatesRequested

    resolveFetch?.('late-value')
    await vi.advanceTimersByTimeAsync(0)
    expect(host.updatesRequested).toBe(updatesAfterDisconnect)
  })

  it('should yield a correct snapshot when reconnecting after an in-flight request settles', async () => {
    const key = queryKey()

    let resolveFetch: ((value: string) => void) | undefined

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () =>
            new Promise<string>((resolve) => {
              resolveFetch = resolve
            }),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(0)
    expect(query().isFetching).toBe(true)

    host.remove()
    resolveFetch?.('reconnected-value')
    await vi.advanceTimersByTimeAsync(0)

    container.append(host)

    await vi.advanceTimersByTimeAsync(0)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('reconnected-value')
  })

  it('should use the latest select closure after host updates', async () => {
    const key = queryKey()

    let multiplier = 1

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        () => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 2),
          select: (value: number) => value * multiplier,
        }),
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe(2)

    multiplier = 3
    host.requestUpdate()
    await host.updateComplete

    expect(query().data).toBe(6)

    multiplier = 4
    host.requestUpdate()
    await host.updateComplete
    const refetchPromise = query.refetch()
    await vi.advanceTimersByTimeAsync(10)
    await expect(refetchPromise).resolves.toMatchObject({ data: 8 })
    expect(query().data).toBe(8)
  })

  it('should switch provider client while connected with a single active observer', async () => {
    const key = queryKey()
    const clientA = new QueryClient()

    const clientB = new QueryClient()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = clientA

    class Consumer extends LitElement {
      readonly queryKey = key
      queryCalls = 0

      readonly query = createQueryController(this, () => ({
        queryKey: this.queryKey,
        queryFn: () => {
          this.queryCalls += 1
          return sleep(10).then(() => `value-${this.queryCalls}`)
        },
        retry: false,
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    provider.append(consumer)
    container.append(provider)

    await provider.updateComplete
    await consumer.updateComplete
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.queryCalls).toBe(1)

    const oldCacheQueryBeforeSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(oldCacheQueryBeforeSwitch?.getObserversCount()).toBe(1)

    provider.client = clientB
    await provider.updateComplete
    await vi.advanceTimersByTimeAsync(10)

    const oldCacheQueryAfterSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    const newCacheQueryAfterSwitch = clientB
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })

    expect(oldCacheQueryAfterSwitch?.getObserversCount() ?? 0).toBe(0)
    expect(newCacheQueryAfterSwitch?.getObserversCount()).toBe(1)

    void clientB.invalidateQueries({ queryKey: consumer.queryKey })
    expect(consumer.queryCalls).toBe(3)

    consumer.query.destroy()
    provider.remove()
  })

  it('should track retry failure metadata before eventual success', async () => {
    const key = queryKey()

    let attempts = 0

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          retry: 2,
          retryDelay: 30,
          queryFn: async () => {
            attempts += 1
            await sleep(10)
            if (attempts < 3) {
              throw new Error(`attempt-${attempts}`)
            }
            return 'success'
          },
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(query().failureCount).toBe(1)
    expect(query().failureReason).toBeInstanceOf(Error)
    expect(query().isPending || query().isError).toBe(true)
    await vi.advanceTimersByTimeAsync(80)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('success')
    expect(attempts).toBe(3)
  })

  it('should be reconnect-idempotent without duplicate subscriptions', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () => sleep(10).then(() => ['a', 'b']),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const query = host.query

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)

    const cacheQuery = queryClient.getQueryCache().find({ queryKey: key })
    expect(cacheQuery?.state.data).toEqual(['a', 'b'])
    expect(cacheQuery?.getObserversCount()).toBe(1)

    host.remove()
    expect(cacheQuery?.getObserversCount()).toBe(0)

    container.append(host)

    await vi.advanceTimersByTimeAsync(0)
    expect(cacheQuery?.getObserversCount()).toBe(1)

    host.connectedCallback()
    host.requestUpdate()
    await host.updateComplete

    expect(cacheQuery?.getObserversCount()).toBe(1)
  })

  it('should be safe before provider resolution in the no-explicit-client constructor path', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly queryKey = key
      queryCalls = 0

      readonly query = createQueryController(this, () => ({
        queryKey: this.queryKey,
        queryFn: () => {
          this.queryCalls += 1
          return sleep(10).then(() => `value-${this.queryCalls}`)
        },
        retry: false,
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.query().status).toBe('pending')

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)

    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.queryCalls).toBe(1)
    expect(consumer.query().data).toBe('value-1')

    consumer.query.destroy()
    provider.remove()
  })

  it('should not spuriously throw during the handshake on the first provider-backed connection', async () => {
    const key = queryKey()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient

    class Consumer extends LitElement {
      readonly queryKey = key
      queryCalls = 0

      readonly query = createQueryController(this, () => ({
        queryKey: this.queryKey,
        queryFn: () => {
          this.queryCalls += 1
          return sleep(10).then(() => `value-${this.queryCalls}`)
        },
        retry: false,
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    provider.append(consumer)

    expect(() => consumer.query()).not.toThrow()

    container.append(provider)

    expect(() => consumer.query()).not.toThrow()
    await provider.updateComplete
    await consumer.updateComplete
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.query().data).toBe('value-1')

    consumer.query.destroy()
    provider.remove()
  })

  it('should throw after the initial placeholder phase when no provider is available', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly queryKey = key
      queryCalls = 0

      readonly query = createQueryController(this, () => ({
        queryKey: this.queryKey,
        queryFn: () => {
          this.queryCalls += 1
          return sleep(10).then(() => `value-${this.queryCalls}`)
        },
        retry: false,
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.query().status).toBe('pending')

    container.append(consumer)

    expect(() => consumer.query()).not.toThrow()
    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.query()).toThrow(/No QueryClient available/)
    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )
    await expect(consumer.query.suspense()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.query.destroy()
    consumer.remove()
  })

  it('should share the missing-client contract between wrapper and result-object imperative methods', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly queryKey = key
      queryCalls = 0

      readonly query = createQueryController(this, () => ({
        queryKey: this.queryKey,
        queryFn: () => {
          this.queryCalls += 1
          return sleep(10).then(() => `value-${this.queryCalls}`)
        },
        retry: false,
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    const placeholderResult = consumer.query()

    container.append(consumer)

    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.query()).toThrow(/No QueryClient available/)
    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )
    await expect(placeholderResult.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.query.destroy()
    consumer.remove()
  })

  it('should clear stale provider-derived client state when reconnecting outside any provider', async () => {
    const key = queryKey()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient

    class Consumer extends LitElement {
      readonly queryKey = key
      queryCalls = 0

      readonly query = createQueryController(this, () => ({
        queryKey: this.queryKey,
        queryFn: () => {
          this.queryCalls += 1
          return sleep(10).then(() => `value-${this.queryCalls}`)
        },
        retry: false,
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    provider.append(consumer)
    container.append(provider)

    await provider.updateComplete
    await consumer.updateComplete
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount(),
    ).toBe(1)

    provider.removeChild(consumer)
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount() ?? 0,
    ).toBe(0)

    container.append(consumer)

    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.query.destroy()
    consumer.remove()
    provider.remove()
  })

  it('should rebind cleanly with later recovery when reconnecting under a different provider', async () => {
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
      readonly queryKey = key
      queryCalls = 0

      readonly query = createQueryController(this, () => ({
        queryKey: this.queryKey,
        queryFn: () => {
          this.queryCalls += 1
          return sleep(10).then(() => `value-${this.queryCalls}`)
        },
        retry: false,
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    providerA.append(consumer)

    container.append(providerA)

    await providerA.updateComplete
    await consumer.updateComplete
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)

    providerA.removeChild(consumer)
    expect(
      clientA
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount() ?? 0,
    ).toBe(0)

    container.append(consumer)
    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.remove()
    providerB.append(consumer)
    container.append(providerB)
    await providerB.updateComplete

    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.queryCalls).toBe(3)
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
    expect(consumer.query().data).toBe(`value-${consumer.queryCalls}`)

    consumer.query.destroy()
    providerA.remove()
    providerB.remove()
  })

  it('should reuse hydrated data on an already-connected host without an eager refetch', async () => {
    const key = queryKey()
    let queryFnCalls = 0

    queryClient.setQueryData(key, 'hydrated-value')

    class Host extends LitElement {
      query?: QueryResultAccessor<string, Error>
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    await host.updateComplete

    // Lit calls hostConnected immediately when a controller is added to an
    // already-connected host
    host.query = createQueryController(
      host,
      {
        queryKey: key,
        queryFn: () => {
          queryFnCalls += 1
          return sleep(10).then(() => 'fetched-value')
        },
        staleTime: 30_000,
      },
      queryClient,
    )
    const query = host.query

    await vi.advanceTimersByTimeAsync(0)
    expect(query().data).toBe('hydrated-value')
    expect(query().isSuccess).toBe(true)
    expect(queryFnCalls).toBe(0)

    const refetchPromise = query.refetch()
    await vi.advanceTimersByTimeAsync(10)
    await expect(refetchPromise).resolves.toMatchObject({
      data: 'fetched-value',
    })
    expect(query().data).toBe('fetched-value')
    expect(queryFnCalls).toBe(1)

    query.destroy()
  })

  it('should defer explicit-client query accessors until host fields are initialized', async () => {
    const key = queryKey()

    class DeferredExplicitQueryHost extends LitElement {
      readonly query = createQueryController(
        this,
        () => ({
          queryKey: [...key, this.id],
          queryFn: () => sleep(10).then(() => this.id),
          retry: false,
        }),
        queryClient,
      )

      readonly firstRead = this.query()
      readonly id = 'alpha'
    }
    customElements.define(generateElementName(), DeferredExplicitQueryHost)

    expect(() => new DeferredExplicitQueryHost()).not.toThrow()

    const host = new DeferredExplicitQueryHost()
    expect(host.query().status).toBe('pending')

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(host.query().data).toBe('alpha')
    expect(
      queryClient
        .getQueryCache()
        .findAll({ queryKey: key })
        .map((query) => query.queryKey),
    ).toEqual([[...key, 'alpha']])

    host.query.destroy()
  })

  it('should fetch and resolve with the fetched result from suspense when the data is stale', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        { queryKey: key, queryFn },
        queryClient,
      )

      override render() {
        const query = this.query()
        return html`status: ${query.status}, data: ${query.data ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    await host.updateComplete

    expect(host.shadowRoot).toHaveTextContent('status: pending, data: none')

    const suspensePromise = host.query.suspense()
    await vi.advanceTimersByTimeAsync(10)
    await expect(suspensePromise).resolves.toMatchObject({
      status: 'success',
      data: 'data',
    })
    expect(host.shadowRoot).toHaveTextContent('status: success, data: data')
    expect(queryFn).toHaveBeenCalledTimes(1)

    host.query.destroy()
  })

  it('should resolve immediately without refetching from suspense when the data is fresh', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn,
          initialData: 'initial',
          staleTime: Infinity,
        },
        queryClient,
      )

      override render() {
        const query = this.query()
        return html`status: ${query.status}, data: ${query.data ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    await host.updateComplete

    expect(host.shadowRoot).toHaveTextContent('status: success, data: initial')

    await expect(host.query.suspense()).resolves.toMatchObject({
      status: 'success',
      data: 'initial',
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(host.shadowRoot).toHaveTextContent('status: success, data: initial')
    expect(queryFn).not.toHaveBeenCalled()

    host.query.destroy()
  })

  it('should resolve with the current result without fetching from suspense when disabled', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        { queryKey: key, queryFn, enabled: false },
        queryClient,
      )

      override render() {
        const query = this.query()
        return html`status: ${query.status}, data: ${query.data ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    await host.updateComplete

    expect(host.shadowRoot).toHaveTextContent('status: pending, data: none')

    await expect(host.query.suspense()).resolves.toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(host.shadowRoot).toHaveTextContent('status: pending, data: none')
    expect(queryFn).not.toHaveBeenCalled()

    host.query.destroy()
  })

  it('should apply the latest options to the controller before resolving from suspense', async () => {
    const key = queryKey()

    class Host extends LitElement {
      userId = 1

      readonly query = createQueryController(
        this,
        () => {
          const userId = this.userId
          return {
            queryKey: [...key, userId],
            queryFn: () => sleep(10).then(() => `data-${userId}`),
          }
        },
        queryClient,
      )

      override render() {
        const query = this.query()
        return html`status: ${query.status}, data: ${query.data ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)

    await vi.advanceTimersByTimeAsync(10)
    expect(host.shadowRoot).toHaveTextContent('status: success, data: data-1')

    host.userId = 2
    const suspensePromise = host.query.suspense()
    await vi.advanceTimersByTimeAsync(10)
    await expect(suspensePromise).resolves.toMatchObject({
      status: 'success',
      data: 'data-2',
    })
    expect(host.query().data).toBe('data-2')
    expect(host.shadowRoot).toHaveTextContent('status: success, data: data-2')

    host.query.destroy()
  })
})
