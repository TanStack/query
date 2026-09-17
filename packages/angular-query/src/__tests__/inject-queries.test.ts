import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/angular'
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  computed,
  effect,
  input,
  inputBinding,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { provideIsRestoring } from '../internal'
import { QueryClient, onlineManager, provideTanStackQuery, skipToken } from '..'
import { injectQueries } from '../inject-queries'
import {
  provideAngularQueryChangeDetection,
  setupTanStackQueryTestBed,
} from './test-utils'

// cspell:ignore ZONEFUL

let queryClient: QueryClient

beforeEach(() => {
  vi.useFakeTimers()
  queryClient = new QueryClient()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  setupTanStackQueryTestBed(queryClient)
})

afterEach(() => {
  onlineManager.setOnline(true)
  vi.useRealTimers()
})

describe('injectQueries', () => {
  it.each([false, true])(
    'uses current options and slot identity for multi-query refetch (combine=%s)',
    async (combine) => {
      vi.useRealTimers()
      const keys = signal(['a', 'b'])
      const version = signal('old')
      const queries = TestBed.runInInjectionContext(() =>
        injectQueries(() => {
          const current = version()
          return {
            queries: keys().map((key) => ({
              queryKey: [key],
              enabled: false,
              queryFn: async () => `${key}:${current}`,
            })),
            combine: combine ? (results) => results : undefined,
          }
        }),
      )
      const refetch = queries()[0]!.refetch
      version.set('new')
      expect((await refetch()).data).toBe('a:new')
      keys.set(['b', 'a'])
      expect((await refetch()).data).toBe('b:new')
      keys.set([])
      expect(queries()).toHaveLength(0)
      await expect(refetch()).rejects.toThrow('removed query at index 0')
      keys.set(['a'])
      const restoredRefetch = queries()[0]!.refetch
      expect(restoredRefetch).not.toBe(refetch)
      expect((await restoredRefetch()).data).toBe('a:new')
    },
  )

  it('should keep failed refetch state and cached data readable without global reporting', async () => {
    vi.useRealTimers()
    queryClient.setDefaultOptions({
      queries: { retry: false, throwOnError: true },
    })
    const report = vi.spyOn(TestBed.inject(ErrorHandler), 'handleError')
    const error = new Error('query failed')
    const options = {
      queryKey: ['error'],
      initialData: 'cached',
      enabled: false,
      queryFn: async (): Promise<string> => {
        throw error
      },
    }
    const query = TestBed.runInInjectionContext(
      () => injectQueries(() => ({ queries: [options] }))()[0],
    )
    await TestBed.inject(ApplicationRef).whenStable()
    await expect(query.refetch()).resolves.toMatchObject({
      status: 'error',
      error,
    })
    expect(query.error()).toBe(error)
    expect(query.data()).toBe('cached')
    expect(query.isError()).toBe(true)
    await expect(query.refetch({ throwOnError: true })).rejects.toBe(error)
    expect(report).not.toHaveBeenCalled()
  })

  it('throws NG0203 with descriptive error outside injection context', () => {
    expect(() => {
      injectQueries(() => ({
        queries: [
          {
            queryKey: ['injectionContextError'],
            queryFn: () => Promise.resolve(1),
          },
        ],
      }))
    }).toThrowError(/NG0203(.*?)injectQueries/)
  })

  it('allows cache listeners to read a result while options update', () => {
    const staleTime = signal(0)
    const queries = TestBed.runInInjectionContext(() =>
      injectQueries(() => ({
        queries: [
          {
            queryKey: ['reentrant-options'],
            queryFn: () => 'data',
            enabled: false,
            staleTime: staleTime(),
          },
        ],
      })),
    )

    TestBed.tick()
    const query = queries()[0]
    const readResult = vi.fn(() => query.status())
    const subscriptionEvents: Array<string> = []
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // setQueries emits synchronously; this read must not re-enter the signal
      // computation that caused the options update.
      if (event.type === 'observerOptionsUpdated') readResult()
      if (event.type === 'observerAdded' || event.type === 'observerRemoved') {
        subscriptionEvents.push(event.type)
      }
    })

    staleTime.set(1)

    expect(() => TestBed.tick()).not.toThrow()
    expect(readResult).toHaveBeenCalled()
    expect(subscriptionEvents).toEqual([])

    unsubscribe()
  })

  it('allows deferred cache-listener reads during restoration detach and reattach', async () => {
    const isRestoring = signal(false)
    setupTanStackQueryTestBed(queryClient, {
      providers: [provideIsRestoring(() => isRestoring.asReadonly())],
    })
    const queries = TestBed.runInInjectionContext(() =>
      injectQueries(() => ({
        queries: [
          {
            queryKey: ['reentrant-restoration-subscription'],
            queryFn: () => 'data',
            enabled: false,
          },
        ],
      })),
    )
    expect(queries()[0].status()).toBe('pending')
    TestBed.tick()

    const nestedStatuses: Array<string> = []
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'observerAdded' || event.type === 'observerRemoved') {
        void Promise.resolve().then(() =>
          nestedStatuses.push(queries()[0].status()),
        )
      }
    })

    isRestoring.set(true)
    expect(() => TestBed.tick()).not.toThrow()
    isRestoring.set(false)
    expect(() => TestBed.tick()).not.toThrow()

    await Promise.resolve()
    expect(nestedStatuses).toEqual(['pending', 'pending'])
    unsubscribe()
  })

  it('allows deferred cache-listener reads while a list change creates a query', async () => {
    const key = signal('old')
    const queries = TestBed.runInInjectionContext(() =>
      injectQueries(() => ({
        queries: [
          {
            queryKey: ['reentrant-query-added', key()],
            queryFn: () => 'data',
            enabled: false,
          },
        ],
      })),
    )

    expect(queries()[0].status()).toBe('pending')
    TestBed.tick()
    const nestedStatuses: Array<string> = []
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'added')
        void Promise.resolve().then(() =>
          nestedStatuses.push(queries()[0].status()),
        )
    })

    key.set('new')

    expect(() => queries()[0].status()).not.toThrow()
    expect(nestedStatuses).toEqual([])
    expect(() => TestBed.tick()).not.toThrow()
    await Promise.resolve()
    expect(nestedStatuses).toEqual(['pending'])
    unsubscribe()
  })

  it('should return the correct states', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: Array<Array<Record<string, any>>> = []

    @Component({
      template: `
        <div>
          <div>
            data1: {{ queries()[0].data() ?? 'null' }}, data2:
            {{ queries()[1].data() ?? 'null' }}
          </div>
        </div>
      `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      toString(val: any) {
        return String(val)
      }
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 1),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(100).then(() => 2),
          },
        ],
      }))

      _pushResults = effect(() => {
        const snapshot = this.queries().map((q) => ({ data: q.data() }))
        results.push(snapshot)
      })
    }

    const rendered = await render(Page, {
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => queryClient),
      ],
    })

    await vi.advanceTimersByTimeAsync(10)
    rendered.fixture.detectChanges()

    expect(results.some((snapshot) => snapshot[0]?.data === 1)).toBe(true)

    await vi.advanceTimersByTimeAsync(91)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('data1: 1, data2: 2')).toBeInTheDocument()

    expect(
      results.some(
        (snapshot) =>
          snapshot.length === 2 &&
          snapshot[0]?.data === undefined &&
          snapshot[1]?.data === undefined,
      ),
    ).toBe(true)
    expect(
      results.some(
        (snapshot) =>
          snapshot.length === 2 &&
          snapshot[0]?.data === 1 &&
          snapshot[1]?.data === undefined,
      ),
    ).toBe(true)
    expect(
      results.some(
        (snapshot) =>
          snapshot.length === 2 &&
          snapshot[0]?.data === 1 &&
          snapshot[1]?.data === 2,
      ),
    ).toBe(true)
  })

  it('should update a result field first read after an earlier update', async () => {
    let count = 0

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['late-field-tracking'],
            queryFn: async () => {
              await sleep(10)
              return ++count
            },
          },
        ],
      }))
    }

    const rendered = await render(Page)
    rendered.fixture.autoDetectChanges()
    const query = rendered.fixture.componentInstance.queries()[0]

    // Only status is read before the first observer update.
    expect(query.status()).toBe('pending')

    await vi.advanceTimersByTimeAsync(11)
    expect(query.status()).toBe('success')

    // Data starts being observed after the result signal already contains a
    // subscription update. It must still participate in future notifications.
    expect(query.data()).toBe(1)

    const refetch = query.refetch()
    await vi.advanceTimersByTimeAsync(11)
    await refetch

    expect(query.data()).toBe(2)
  })

  it('should support combining results', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    let count = 0

    const results: Array<{ data: string; refetch: () => void }> = []

    @Component({
      template: ` <div>data: {{ queries().data }}</div> `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              await new Promise((r) => setTimeout(r, 10))
              count++
              return count
            },
          },
          {
            queryKey: key2,
            queryFn: async () => {
              await new Promise((r) => setTimeout(r, 100))
              count++
              return count
            },
          },
        ],
        combine: (queryResults) => {
          return {
            refetch: () => queryResults.forEach((r) => r.refetch()),
            data: queryResults.map((r) => r.data).join(','),
          }
        },
      }))

      _pushResults = effect(() => {
        results.push(this.queries())
      })
    }

    const rendered = await render(Page)
    const instance = rendered.fixture.componentInstance
    await rendered.findByText('data: 1,2')
    expect(instance.queries().data).toBe('1,2')

    instance.queries().refetch()

    await rendered.findByText('data: 3,4')
    expect(instance.queries().data).toBe('3,4')

    const dataChanges = results.filter(
      (result, index) => result.data !== results[index - 1]?.data,
    )
    expect(dataChanges.map((result) => result.data)).toEqual([
      ',',
      '1,',
      '1,2',
      '3,2',
      '3,4',
    ])
    expect(
      results.every((result) => typeof result.refetch === 'function'),
    ).toBe(true)
  })

  it('updates the result shape when combine configuration changes', () => {
    const shouldCombine = signal(false)
    const queries = TestBed.runInInjectionContext(() =>
      injectQueries<any, any>(() => ({
        queries: [
          {
            queryKey: ['committed-combine'],
            enabled: false,
          },
        ],
        combine: shouldCombine()
          ? (results: Array<unknown>) => ({ count: results.length })
          : undefined,
      })),
    )

    expect(Array.isArray(queries())).toBe(true)
    TestBed.tick()

    shouldCombine.set(true)
    expect(queries()).toEqual({ count: 1 })
  })

  it('removes a combined result when combine configuration changes', () => {
    const shouldCombine = signal(true)
    const queries = TestBed.runInInjectionContext(() =>
      injectQueries<any, any>(() => ({
        queries: [
          {
            queryKey: ['committed-combine-removal'],
            enabled: false,
          },
        ],
        combine: shouldCombine()
          ? (results: Array<unknown>) => ({ count: results.length })
          : undefined,
      })),
    )

    expect(queries()).toEqual({ count: 1 })
    TestBed.tick()

    shouldCombine.set(false)
    expect(Array.isArray(queries())).toBe(true)
    expect(queries()).toHaveLength(1)
  })

  it('combines fresh raw results when a signal changes what combine selects', () => {
    const showData = signal(false)
    const key = ['reactive-combine-selection']
    queryClient.setQueryData(key, 1)
    const queries = TestBed.runInInjectionContext(() =>
      injectQueries(() => ({
        queries: [{ queryKey: key, enabled: false }],
        combine: (results) => ({ value: showData() ? results[0].data : 0 }),
      })),
    )

    expect(queries()).toEqual({ value: 0 })
    TestBed.tick()
    queryClient.setQueryData(key, 2)
    const previous = queries()
    queryClient.setQueryData(key, 3)
    expect(queries()).toEqual(previous)
    expect(queries()).not.toBe(previous)
    showData.set(true)
    expect(queries()).toEqual({ value: 3 })
  })

  it('should handle mixed success and error query states', async () => {
    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['mixed-error'],
            retry: false,
            queryFn: async () => {
              await new Promise((resolve) => setTimeout(resolve, 10))
              throw new Error('mixed-error')
            },
          },
          {
            queryKey: ['mixed-success'],
            queryFn: async () => {
              await new Promise((resolve) => setTimeout(resolve, 20))
              return 'mixed-success'
            },
          },
        ],
      }))
    }

    const rendered = await render(Page)
    await vi.advanceTimersByTimeAsync(25)
    await Promise.resolve()

    const [errorQuery, successQuery] =
      rendered.fixture.componentInstance.queries()
    expect(errorQuery.status()).toBe('error')
    expect(errorQuery.error()?.message).toBe('mixed-error')
    expect(successQuery.status()).toBe('success')
    expect(successQuery.data()).toBe('mixed-success')
  })

  it('should cleanup pending tasks when component with active queries is destroyed', async () => {
    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['destroy-query-1'],
            queryFn: async () => {
              await sleep(100)
              return 'one'
            },
          },
          {
            queryKey: ['destroy-query-2'],
            queryFn: async () => {
              await sleep(100)
              return 'two'
            },
          },
        ],
      }))
    }

    // Use a fixture here on purpose: we need component teardown + whenStable() semantics.
    const fixture = TestBed.createComponent(Page)
    fixture.detectChanges()
    expect(fixture.isStable()).toBe(false)

    fixture.destroy()

    const stablePromise = fixture.whenStable()
    await vi.advanceTimersByTimeAsync(150)
    await stablePromise

    expect(fixture.isStable()).toBe(true)
  })

  it('should react to enabled signal changes', async () => {
    const enabled = signal(false)
    const fetchSpy = vi.fn(() => sleep(10).then(() => 'enabled-data'))

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      enabled = enabled
      fetchSpy = fetchSpy

      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['enabled', this.enabled()],
            queryFn: this.fetchSpy,
            enabled: this.enabled(),
          },
        ],
      }))
    }

    const rendered = await render(Page)
    const query = rendered.fixture.componentInstance.queries()[0]

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(query.status()).toBe('pending')

    enabled.set(true)
    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(11)
    await Promise.resolve()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(query.status()).toBe('success')
    expect(query.data()).toBe('enabled-data')
  })

  it('should not resubscribe or refetch unchanged stale queries when options change', async () => {
    const multiplier = signal(1)
    const fetchSpy = vi.fn(() => sleep(10).then(() => 2))

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => {
        const currentMultiplier = multiplier()

        return {
          queries: [
            {
              queryKey: ['reactive-select'],
              queryFn: fetchSpy,
              select: (data: number) => data * currentMultiplier,
              staleTime: 0,
            },
          ],
        }
      })
    }

    const rendered = await render(Page)
    await vi.advanceTimersByTimeAsync(11)

    const query = rendered.fixture.componentInstance.queries()[0]
    const cachedQuery = queryClient
      .getQueryCache()
      .find({ queryKey: ['reactive-select'] })!

    expect(query.data()).toBe(2)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(cachedQuery.getObserversCount()).toBe(1)

    multiplier.set(2)
    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(0)

    expect(query.data()).toBe(4)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(cachedQuery.getObserversCount()).toBe(1)

    rendered.fixture.destroy()
    expect(cachedQuery.getObserversCount()).toBe(0)
  })

  it('should refetch only changed keys when queries length stays the same', async () => {
    const ids = signal<[string, string]>(['a', 'b'])
    const firstSpy = vi.fn((context: any) =>
      sleep(10).then(() => `first-${context.queryKey[1]}`),
    )
    const secondSpy = vi.fn((context: any) =>
      sleep(10).then(() => `second-${context.queryKey[1]}`),
    )

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      ids = ids
      firstSpy = firstSpy
      secondSpy = secondSpy

      queries = injectQueries(() => ({
        queries: [
          {
            staleTime: Number.POSITIVE_INFINITY,
            queryKey: ['first', this.ids()[0]],
            queryFn: this.firstSpy,
          },
          {
            staleTime: Number.POSITIVE_INFINITY,
            queryKey: ['second', this.ids()[1]],
            queryFn: this.secondSpy,
          },
        ],
      }))
    }

    const rendered = await render(Page)
    await vi.advanceTimersByTimeAsync(11)
    await Promise.resolve()

    let [firstQuery, secondQuery] = rendered.fixture.componentInstance.queries()
    expect(firstQuery.data()).toBe('first-a')
    expect(secondQuery.data()).toBe('second-b')
    expect(firstSpy).toHaveBeenCalledTimes(1)
    expect(secondSpy).toHaveBeenCalledTimes(1)

    ids.set(['c', 'b'])
    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(11)
    await Promise.resolve()
    ;[firstQuery, secondQuery] = rendered.fixture.componentInstance.queries()
    expect(firstQuery.data()).toBe('first-c')
    expect(secondQuery.data()).toBe('second-b')
    expect(firstSpy).toHaveBeenCalledTimes(2)
    expect(secondSpy).toHaveBeenCalledTimes(1)
  })

  it('should retain result proxy and field signal identities across updates', async () => {
    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['proxy-cache-update'],
            queryFn: () => Promise.resolve('initial'),
          },
        ],
      }))
    }

    const rendered = await render(Page)
    await vi.advanceTimersByTimeAsync(0)

    const initialQuery = rendered.fixture.componentInstance.queries()[0]
    const initialDataSignal = initialQuery.data

    queryClient.setQueryData(['proxy-cache-update'], 'updated')
    await vi.advanceTimersByTimeAsync(0)

    const updatedQuery = rendered.fixture.componentInstance.queries()[0]
    expect(updatedQuery).toBe(initialQuery)
    expect(updatedQuery.data).toBe(initialDataSignal)
    expect(updatedQuery.data()).toBe('updated')
  })

  it('should cache result proxies by index as the queries array changes', async () => {
    const queryIds = signal(['a', 'b'])

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      ids = queryIds

      queries = injectQueries(() => ({
        queries: this.ids().map((id) => ({
          queryKey: ['proxy-cache-list', id],
          queryFn: () => Promise.resolve(id),
          staleTime: Number.POSITIVE_INFINITY,
        })),
      }))
    }

    const rendered = await render(Page)
    await vi.advanceTimersByTimeAsync(0)

    const instance = rendered.fixture.componentInstance
    const initialQueries = instance.queries()
    const firstQuery = initialQueries[0]
    const secondQuery = initialQueries[1]

    queryIds.set(['a', 'b', 'c'])
    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(0)

    const appendedQueries = instance.queries()
    expect(appendedQueries).toHaveLength(3)
    expect(appendedQueries[0]).toBe(firstQuery)
    expect(appendedQueries[1]).toBe(secondQuery)
    expect(appendedQueries[2]).not.toBe(firstQuery)

    queryIds.set(['a'])
    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(0)

    const removedQueries = instance.queries()
    expect(removedQueries).toHaveLength(1)
    expect(removedQueries[0]).toBe(firstQuery)

    queryIds.set(['a', 'd'])
    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(0)

    const queriesAfterAddingAgain = instance.queries()
    expect(queriesAfterAddingAgain[0]).toBe(firstQuery)
    expect(queriesAfterAddingAgain[1]).not.toBe(secondQuery)

    queryIds.set(['d', 'a'])
    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(0)

    const reorderedQueries = instance.queries()
    expect(reorderedQueries[0]).toBe(firstQuery)
    expect(reorderedQueries[1]).not.toBe(secondQuery)
    expect(reorderedQueries[0]!.data()).toBe('d')
    expect(reorderedQueries[1]!.data()).toBe('a')
  })

  it('should support changes on the queries array', async () => {
    const results: Array<Array<Record<string, any>>> = []

    @Component({
      template: ` <div>data: {{ mapped() }}</div> `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: queries().map((q) => ({
          queryKey: ['query', q],
          queryFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 20 * q))
            return q
          },
        })),
      }))

      mapped = computed(() => {
        const queryData = this.queries().map((q) => q.data())
        if (queryData.length === 0) return 'empty'
        return queryData.join(',')
      })

      _pushResults = effect(() => {
        const snapshot = this.queries().map((q) => ({ data: q.data() }))
        results.push(snapshot)
      })
    }

    const queries = signal([1, 2, 4])

    const rendered = await render(Page)
    rendered.fixture.autoDetectChanges()
    const instance = rendered.fixture.componentInstance

    await vi.advanceTimersByTimeAsync(20)
    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(20)
    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(40)
    rendered.fixture.detectChanges()
    await rendered.findByText('data: 1,2,4')
    expect(instance.mapped()).toBe('1,2,4')

    const hasSnapshot = (expected: Array<number | undefined>): boolean =>
      results.some(
        (snapshot) =>
          snapshot.length === expected.length &&
          expected.every((data, index) => snapshot[index]?.data === data),
      )
    expect(hasSnapshot([undefined, undefined, undefined])).toBe(true)
    expect(hasSnapshot([1, undefined, undefined])).toBe(true)
    expect(hasSnapshot([1, 2, undefined])).toBe(true)
    expect(hasSnapshot([1, 2, 4])).toBe(true)

    queries.set([3, 4])
    rendered.fixture.detectChanges()
    expect(instance.queries()[0]!.data()).toBeUndefined()
    expect(instance.queries()[1]!.data()).toBe(4)
    expect(instance.mapped()).toBe(',4')
    await rendered.findByText('data: 3,4')
    expect(instance.mapped()).toBe('3,4')

    expect(results[results.length - 1]).toMatchObject([
      { data: 3 },
      { data: 4 },
    ])

    queries.set([])
    await rendered.findByText('data: empty')
    expect(instance.mapped()).toBe('empty')

    expect(results[results.length - 1]).toMatchObject([])
  })

  it('should change the rendered component when the queries array changes', async () => {
    const userIds = signal([1, 2])

    @Component({
      template: `
        <ul>
          @for (query of queries(); track $index) {
            @if (query.data(); as data) {
              <li>{{ data.value }}</li>
            }
          }
        </ul>
      `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      userIds = userIds

      queries = injectQueries(() => ({
        queries: this.userIds().map((id) => ({
          queryKey: ['user', id],
          queryFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 20))
            return { value: String(id) }
          },
        })),
      }))
    }

    const rendered = await render(Page)

    await rendered.findByText('1')
    await rendered.findByText('2')

    userIds.set([3])
    rendered.fixture.detectChanges()

    await rendered.findByText('3')
    expect(rendered.queryByText('1')).toBeNull()
    expect(rendered.queryByText('2')).toBeNull()
  })

  it('should support required signal inputs', async () => {
    @Component({
      selector: 'app-fake',
      template: `{{ queries()[0].data() }}`,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class FakeComponent {
      name = input.required<string>()

      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['fake', this.name()],
            queryFn: () => this.name(),
          },
        ],
      }))
    }

    const name = signal('signal-input-required-test')
    const rendered = await render(FakeComponent, {
      bindings: [inputBinding('name', name.asReadonly())],
      detectChangesOnRender: false,
    })
    rendered.fixture.autoDetectChanges()
    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(0)

    const result = rendered.fixture.nativeElement.textContent
    expect(result).toEqual('signal-input-required-test')
  })

  it('should allow reading query state in ngOnInit with required signal inputs', async () => {
    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      name = input.required<string>()
      initialStatus!: string

      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['queries-ng-on-init', this.name()],
            queryFn: () => this.name(),
          },
        ],
      }))

      ngOnInit() {
        this.initialStatus = this.queries()[0].status()
      }
    }

    const name = signal('queries-ng-on-init')
    const rendered = await render(Page, {
      bindings: [inputBinding('name', name.asReadonly())],
      detectChangesOnRender: false,
    })

    rendered.fixture.detectChanges()

    expect(rendered.fixture.componentInstance.initialStatus).toBe('pending')

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.fixture.componentInstance.queries()[0].data()).toBe(
      'queries-ng-on-init',
    )
  })

  describe('pending tasks', () => {
    it('should handle synchronous success and error before whenStable resolves', async () => {
      const app = TestBed.inject(ApplicationRef)

      @Component({
        template: '',
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class Page {
        queries = injectQueries(() => ({
          queries: [
            {
              queryKey: ['queries-sync-success'],
              queryFn: () => 'instant-data',
            },
            {
              queryKey: ['queries-sync-error'],
              queryFn: () => {
                throw new Error('instant-error')
              },
              retry: false,
            },
          ],
        }))
      }

      const fixture = TestBed.createComponent(Page)
      fixture.detectChanges()
      const [successQuery, errorQuery] = fixture.componentInstance.queries()

      expect(successQuery.status()).toBe('pending')
      expect(errorQuery.status()).toBe('pending')

      const stablePromise = app.whenStable()
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10)
      await stablePromise

      expect(successQuery.status()).toBe('success')
      expect(successQuery.data()).toBe('instant-data')
      expect(errorQuery.status()).toBe('error')
      expect(errorQuery.error()).toEqual(new Error('instant-error'))
    })

    it('tracks invalidation even when combine returns an unchanged value', async () => {
      vi.useRealTimers()
      const key = ['combined-pending-invalidation']
      let complete!: (value: number) => void
      let calls = 0
      const queries = TestBed.runInInjectionContext(() =>
        injectQueries(() => ({
          queries: [
            {
              queryKey: key,
              queryFn: () =>
                ++calls === 1
                  ? 1
                  : new Promise<number>((resolve) => {
                      complete = resolve
                    }),
            },
          ],
          combine: () => 'unchanged',
        })),
      )
      const app = TestBed.inject(ApplicationRef)
      await app.whenStable()
      expect(queries()).toBe('unchanged')
      let isStable = false
      const subscription = app.isStable.subscribe((value) => {
        isStable = value
      })
      expect(isStable).toBe(true)

      const invalidation = queryClient.invalidateQueries({ queryKey: key })
      expect(isStable).toBe(false)
      complete(2)
      await invalidation
      await app.whenStable()
      expect(isStable).toBe(true)
      expect(queries()).toBe('unchanged')
      subscription.unsubscribe()
    })

    it('should not register pending tasks for disabled queries', async () => {
      const queryFn = vi.fn(() => Promise.resolve('disabled-data'))

      @Component({
        template: '',
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class Page {
        queries = injectQueries(() => ({
          queries: [
            {
              queryKey: ['queries-disabled-enabled'],
              queryFn,
              enabled: false,
            },
            {
              queryKey: ['queries-disabled-skip-token'],
              queryFn: skipToken,
            },
          ],
        }))
      }

      const fixture = TestBed.createComponent(Page)
      fixture.detectChanges()
      await Promise.resolve()

      const [disabledQuery, skippedQuery] = fixture.componentInstance.queries()
      expect(disabledQuery.fetchStatus()).toBe('idle')
      expect(skippedQuery.fetchStatus()).toBe('idle')
      expect(queryFn).not.toHaveBeenCalled()
      expect(fixture.isStable()).toBe(true)
    })

    it('should stay pending while queries are paused offline', async () => {
      const app = TestBed.inject(ApplicationRef)
      onlineManager.setOnline(false)

      @Component({
        template: '',
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class Page {
        queries = injectQueries(() => ({
          queries: [
            {
              queryKey: ['queries-start-offline'],
              queryFn: () => sleep(10).then(() => 'online-data'),
            },
          ],
        }))
      }

      const fixture = TestBed.createComponent(Page)
      fixture.detectChanges()
      await Promise.resolve()

      const query = fixture.componentInstance.queries()[0]
      expect(query.fetchStatus()).toBe('paused')

      let stableResolved = false
      const stablePromise = app.whenStable().then(() => {
        stableResolved = true
      })
      await Promise.resolve()
      expect(stableResolved).toBe(false)

      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(20)
      await stablePromise

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('online-data')
    })

    it('should handle rapid refetches without leaking a pending task', async () => {
      const app = TestBed.inject(ApplicationRef)
      let count = 0

      @Component({
        template: '',
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class Page {
        queries = injectQueries(() => ({
          queries: [
            {
              queryKey: ['queries-rapid-refetch'],
              queryFn: async () => {
                await sleep(10)
                return ++count
              },
            },
          ],
        }))
      }

      const fixture = TestBed.createComponent(Page)
      fixture.detectChanges()
      const query = fixture.componentInstance.queries()[0]

      query.refetch()
      query.refetch()
      query.refetch()

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(20)
      await stablePromise

      expect(query.status()).toBe('success')
      expect(query.data()).toBeGreaterThan(0)
      expect(fixture.isStable()).toBe(true)
    })

    it('should release the pending task when a query is cancelled', async () => {
      const app = TestBed.inject(ApplicationRef)

      @Component({
        template: '',
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class Page {
        queries = injectQueries(() => ({
          queries: [
            {
              queryKey: ['queries-cancel'],
              queryFn: () => sleep(100).then(() => 'data'),
            },
          ],
        }))
      }

      const fixture = TestBed.createComponent(Page)
      fixture.detectChanges()
      const query = fixture.componentInstance.queries()[0]

      await vi.advanceTimersByTimeAsync(20)
      await queryClient.cancelQueries({ queryKey: ['queries-cancel'] })
      await app.whenStable()

      expect(query.status()).toBe('pending')
      expect(query.fetchStatus()).toBe('idle')
      expect(fixture.isStable()).toBe(true)
    })

    it('should keep the pending task through retries', async () => {
      const app = TestBed.inject(ApplicationRef)
      let attemptCount = 0

      @Component({
        template: '',
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class Page {
        queries = injectQueries(() => ({
          queries: [
            {
              queryKey: ['queries-retry'],
              retry: 2,
              retryDelay: 10,
              queryFn: () => {
                attemptCount++
                if (attemptCount <= 2) {
                  throw new Error(`Attempt ${attemptCount} failed`)
                }
                return 'success-data'
              },
            },
          ],
        }))
      }

      const fixture = TestBed.createComponent(Page)
      fixture.detectChanges()
      const query = fixture.componentInstance.queries()[0]

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(50)
      await stablePromise

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('success-data')
      expect(attemptCount).toBe(3)
    })
  })

  it('should pause fetching while restoring and fetch once restoring is disabled', async () => {
    const isRestoring = signal(true)
    const fetchSpy = vi.fn(() => sleep(10).then(() => 'restored-data'))
    setupTanStackQueryTestBed(queryClient, {
      providers: [provideIsRestoring(() => isRestoring.asReadonly())],
    })

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['restoring'],
            queryFn: fetchSpy,
          },
        ],
      }))
    }

    const fixture = TestBed.createComponent(Page)
    fixture.detectChanges()

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(fixture.componentInstance.queries()[0].status()).toBe('pending')

    const stablePromise = fixture.whenStable()
    await Promise.resolve()
    await stablePromise

    isRestoring.set(false)
    fixture.detectChanges()

    await vi.advanceTimersByTimeAsync(11)
    await fixture.whenStable()

    const result = fixture.componentInstance.queries()[0]
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result.status()).toBe('success')
    expect(result.data()).toBe('restored-data')

    const cachedQuery = queryClient
      .getQueryCache()
      .find({ queryKey: ['restoring'] })!
    expect(cachedQuery.getObserversCount()).toBe(1)

    isRestoring.set(true)
    fixture.detectChanges()
    expect(cachedQuery.getObserversCount()).toBe(0)

    isRestoring.set(false)
    fixture.detectChanges()
    expect(cachedQuery.getObserversCount()).toBe(1)

    fixture.destroy()
    expect(cachedQuery.getObserversCount()).toBe(0)
  })

  it.each(['options-first', 'restoring-first'] as const)(
    'uses the latest query list when leaving restoration in the same turn (%s)',
    async (writeOrder) => {
      const isRestoring = signal(true)
      const key = signal('old')
      const queriedKeys: Array<string> = []
      setupTanStackQueryTestBed(queryClient, {
        providers: [provideIsRestoring(() => isRestoring.asReadonly())],
      })

      const queries = TestBed.runInInjectionContext(() =>
        injectQueries(() => ({
          queries: [
            {
              queryKey: ['same-turn-restoration', key()],
              queryFn: ({ queryKey: currentQueryKey }) => {
                const currentKey = currentQueryKey[1] as string
                queriedKeys.push(currentKey)
                return Promise.resolve(currentKey)
              },
            },
          ],
        })),
      )

      expect(queries()[0].status()).toBe('pending')
      expect(queriedKeys).toEqual([])

      if (writeOrder === 'options-first') {
        key.set('new')
        isRestoring.set(false)
      } else {
        isRestoring.set(false)
        key.set('new')
      }
      TestBed.tick()
      await TestBed.inject(ApplicationRef).whenStable()

      expect(queriedKeys).toEqual(['new'])
      expect(queries()[0].data()).toBe('new')
      expect(
        queryClient
          .getQueryCache()
          .find({ queryKey: ['same-turn-restoration', 'old'] })?.state
          .fetchStatus,
      ).toBe('idle')
      expect(
        queryClient
          .getQueryCache()
          .find({ queryKey: ['same-turn-restoration', 'new'] })
          ?.getObserversCount(),
      ).toBe(1)
    },
  )

  it('allows a cache listener to read a result during restoration-boundary configuration', () => {
    const isRestoring = signal(true)
    const staleTime = signal(0)
    setupTanStackQueryTestBed(queryClient, {
      providers: [provideIsRestoring(() => isRestoring.asReadonly())],
    })

    const queries = TestBed.runInInjectionContext(() =>
      injectQueries(() => ({
        queries: [
          {
            queryKey: ['restoration-reentrant'],
            queryFn: () => 'data',
            enabled: false,
            staleTime: staleTime(),
          },
        ],
      })),
    )

    expect(queries()[0].status()).toBe('pending')
    TestBed.tick()

    const boundaryRead = vi.fn(() => queries()[0].status())
    let appliedStaleTime: number | undefined
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'observerOptionsUpdated') {
        appliedStaleTime = event.observer.options.staleTime as number
        boundaryRead()
      }
    })

    staleTime.set(1)
    isRestoring.set(false)

    expect(() => TestBed.tick()).not.toThrow()
    expect(boundaryRead).toHaveBeenCalled()
    expect(appliedStaleTime).toBe(1)
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: ['restoration-reentrant'] })
        ?.getObserversCount(),
    ).toBe(1)

    unsubscribe()
  })

  it('converges to the current query list after an early restoration read', () => {
    const isRestoring = signal(true)
    const key = signal('old')
    const oldQueryKey = ['early-restoration-read', 'old'] as const
    const newQueryKey = ['early-restoration-read', 'new'] as const
    setupTanStackQueryTestBed(queryClient, {
      providers: [provideIsRestoring(() => isRestoring.asReadonly())],
    })

    const queries = TestBed.runInInjectionContext(() =>
      injectQueries(() => ({
        queries: [
          {
            queryKey: ['early-restoration-read', key()],
            queryFn: () => 'unused',
            enabled: false,
          },
        ],
      })),
    )

    expect(queries()[0].status()).toBe('pending')
    TestBed.tick()
    const oldQuery = queryClient
      .getQueryCache()
      .find({ queryKey: oldQueryKey })!
    expect(oldQuery.getObserversCount()).toBe(0)

    key.set('new')
    isRestoring.set(false)

    expect(queries()[0].status()).toBe('pending')
    expect(
      queryClient.getQueryCache().find({ queryKey: newQueryKey }),
    ).toBeDefined()

    queryClient.setQueryData(newQueryKey, 'early data')
    const newQuery = queryClient
      .getQueryCache()
      .find({ queryKey: newQueryKey })!
    expect(newQuery.getObserversCount()).toBe(0)
    TestBed.tick()

    expect(oldQuery.getObserversCount()).toBe(0)
    expect(newQuery.getObserversCount()).toBe(1)
    expect(queries()[0].data()).toBe('early data')
  })

  it('reads the optimistic query list before moving subscriptions on the next tick', () => {
    const key = signal('old')
    const oldQueryKey = ['early-options-read', 'old'] as const
    const newQueryKey = ['early-options-read', 'new'] as const
    const queries = TestBed.runInInjectionContext(() =>
      injectQueries(() => ({
        queries: [
          {
            queryKey: ['early-options-read', key()],
            queryFn: () => 'unused',
            enabled: false,
          },
        ],
      })),
    )

    expect(queries()[0].status()).toBe('pending')
    TestBed.tick()
    const oldQuery = queryClient
      .getQueryCache()
      .find({ queryKey: oldQueryKey })!
    expect(oldQuery.getObserversCount()).toBe(1)

    key.set('new')

    expect(queries()[0].status()).toBe('pending')
    // The existing observer list stays attached until the configuration effect
    // can move it atomically.
    expect(oldQuery.getObserversCount()).toBe(1)
    expect(
      queryClient.getQueryCache().find({ queryKey: newQueryKey }),
    ).toBeDefined()

    queryClient.setQueryData(newQueryKey, 'early data')
    const newQuery = queryClient
      .getQueryCache()
      .find({ queryKey: newQueryKey })!
    expect(newQuery.getObserversCount()).toBe(0)
    TestBed.tick()

    expect(oldQuery.getObserversCount()).toBe(0)
    expect(newQuery.getObserversCount()).toBe(1)
    expect(queries()[0].data()).toBe('early data')
  })

  it('should complete queries before whenStable resolves', async () => {
    const app = TestBed.inject(ApplicationRef)

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['query-1'],
            queryFn: async () => {
              await new Promise((resolve) => setTimeout(resolve, 10))
              return 1
            },
          },
          {
            queryKey: ['query-2'],
            queryFn: async () => {
              await new Promise((resolve) => setTimeout(resolve, 20))
              return 2
            },
          },
        ],
      }))
    }

    const fixture = TestBed.createComponent(Page)
    fixture.detectChanges()

    const stablePromise = app.whenStable()
    let stableResolved = false
    void stablePromise.then(() => {
      stableResolved = true
    })

    await Promise.resolve()
    expect(stableResolved).toBe(false)

    await vi.advanceTimersByTimeAsync(25)
    await stablePromise

    const result = fixture.componentInstance.queries()
    expect(result[0].status()).toBe('success')
    expect(result[1].status()).toBe('success')
    expect(result[0].data()).toBe(1)
    expect(result[1].data()).toBe(2)
  })

  it('should use latest query key for aliased refetch function', async () => {
    const key = signal('one')
    const fetchSpy = vi.fn(async (context: any) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return context.queryKey[1]
    })

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      key = key
      fetchSpy = fetchSpy

      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['query', this.key()],
            queryFn: this.fetchSpy,
            enabled: false,
          },
        ],
      }))
    }

    const rendered = await render(Page)
    const query = rendered.fixture.componentInstance.queries()[0]
    const refetch = query.refetch

    key.set('two')
    rendered.fixture.detectChanges()

    const refetchPromise = refetch()
    await vi.advanceTimersByTimeAsync(15)
    await refetchPromise

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['query', 'two'],
      }),
    )
  })
})
