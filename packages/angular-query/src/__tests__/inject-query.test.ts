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
import { HttpClient, provideHttpClient } from '@angular/common/http'
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { lastValueFrom } from 'rxjs'
import { provideIsRestoring } from '../internal'
import {
  QueryCache,
  QueryClient,
  injectQuery,
  provideTanStackQuery,
  toResource,
} from '..'
import { provideAngularQueryChangeDetection } from './test-utils'
import type { CreateQueryOptions, OmitKeyof, QueryFunction } from '..'

// cspell:ignore ZONEFUL

describe('injectQuery', () => {
  let queryCache: QueryCache
  let queryClient: QueryClient
  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => queryClient),
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => options),
    )
    const cacheReport = vi.fn()
    queryCache.config.onError = cacheReport
    const second = TestBed.runInInjectionContext(() =>
      injectQuery(() => options),
    )
    await TestBed.inject(ApplicationRef).whenStable()
    await expect(query.refetch()).resolves.toMatchObject({
      status: 'error',
      error,
    })
    expect(query.error()).toBe(error)
    expect(second.error()).toBe(error)
    expect(cacheReport).toHaveBeenCalledTimes(1)
    expect(query.data()).toBe('cached')
    expect(query.isError()).toBe(true)
    await expect(query.refetch({ throwOnError: true })).rejects.toBe(error)
    expect(report).not.toHaveBeenCalled()
  })

  it('should return the correct types', () => {
    const key = queryKey()

    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      // unspecified query function should default to unknown
      noQueryFn = injectQuery(() => ({
        queryKey: key,
      }))

      // it should infer the result type from the query function
      fromQueryFn = injectQuery(() => ({
        queryKey: key,
        queryFn: () => 'test',
      }))

      // it should be possible to specify the result type
      withResult = injectQuery<string>(() => ({
        queryKey: key,
        queryFn: () => 'test',
      }))

      // it should be possible to specify the error type
      withError = injectQuery<string, { message: string }>(() => ({
        queryKey: key,
        queryFn: () => 'test',
      }))

      // it should infer the result type from the configuration
      withResultInfer = injectQuery(() => ({
        queryKey: key,
        queryFn: () => true,
      }))

      // it should be possible to specify a union type as result type
      unionTypeSync = injectQuery(() => ({
        queryKey: key,
        queryFn: () => (Math.random() > 0.5 ? ('a' as const) : ('b' as const)),
      }))

      unionTypeAsync = injectQuery<'a' | 'b'>(() => ({
        queryKey: key,
        queryFn: () => Promise.resolve(Math.random() > 0.5 ? 'a' : 'b'),
      }))

      // it should infer the result type from a generic query function
      fromGenericQueryFn = (() => {
        function queryFn<T = string>(): Promise<T> {
          return Promise.resolve({} as T)
        }
        return injectQuery(() => ({
          queryKey: key,
          queryFn: () => queryFn(),
        }))
      })()

      // todo use query options?
      fromGenericOptionsQueryFn = (() => {
        function queryFn<T = string>(): Promise<T> {
          return Promise.resolve({} as T)
        }
        return injectQuery(() => ({
          queryKey: key,
          queryFn: () => queryFn(),
        }))
      })()

      fromMyDataArrayKeyQueryFn = (() => {
        type MyData = number
        type MyQueryKey = readonly ['my-data', number]
        const getMyDataArrayKey: QueryFunction<MyData, MyQueryKey> = ({
          queryKey: [, n],
        }) => {
          return n + 42
        }
        return injectQuery(() => ({
          queryKey: ['my-data', 100] as const,
          queryFn: getMyDataArrayKey,
        }))
      })()

      // it should handle query-functions that return Promise<any>
      fromPromiseAnyQueryFn = injectQuery(() => ({
        queryKey: key,
        queryFn: () => fetch('return Promise<any>').then((resp) => resp.json()),
      }))

      fromGetMyDataStringKeyQueryFn = (() => {
        type MyData = number
        const getMyDataStringKey: QueryFunction<MyData, ['1']> = (context) => {
          expectTypeOf(context.queryKey).toEqualTypeOf<['1']>()
          return Number(context.queryKey[0]) + 42
        }
        return injectQuery(() => ({
          queryKey: ['1'] as ['1'],
          queryFn: getMyDataStringKey,
        }))
      })()

      // Wrapped queries
      fromWrappedQuery = (() => {
        const createWrappedQuery = <
          TQueryKey extends [string, Record<string, unknown>?],
          TQueryFnData,
          TError,
          TData = TQueryFnData,
        >(
          qk: TQueryKey,
          fetcher: (obj: TQueryKey[1], token: string) => Promise<TQueryFnData>,
          options?: OmitKeyof<
            CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
            'queryKey' | 'queryFn' | 'initialData',
            'safely'
          >,
        ) =>
          injectQuery(() => ({
            queryKey: qk,
            queryFn: () => fetcher(qk[1], 'token'),
            ...options,
          }))
        return createWrappedQuery([''], () => Promise.resolve('1'))
      })()

      fromWrappedFuncStyleQuery = (() => {
        const createWrappedFuncStyleQuery = <
          TQueryKey extends [string, Record<string, unknown>?],
          TQueryFnData,
          TError,
          TData = TQueryFnData,
        >(
          qk: TQueryKey,
          fetcher: () => Promise<TQueryFnData>,
          options?: OmitKeyof<
            CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
            'queryKey' | 'queryFn' | 'initialData',
            'safely'
          >,
        ) => injectQuery(() => ({ queryKey: qk, queryFn: fetcher, ...options }))
        return createWrappedFuncStyleQuery([''], () => Promise.resolve(true))
      })()
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    const {
      noQueryFn,
      fromQueryFn,
      withResult,
      withError,
      withResultInfer,
      unionTypeSync,
      unionTypeAsync,
      fromGenericQueryFn,
      fromGenericOptionsQueryFn,
      fromMyDataArrayKeyQueryFn,
      fromPromiseAnyQueryFn,
      fromGetMyDataStringKeyQueryFn,
      fromWrappedQuery,
      fromWrappedFuncStyleQuery,
    } = fixture.componentInstance

    expectTypeOf(noQueryFn.data()).toEqualTypeOf<unknown>()
    expectTypeOf(noQueryFn.error()).toEqualTypeOf<Error | null>()

    expectTypeOf(fromQueryFn.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(fromQueryFn.error()).toEqualTypeOf<Error | null>()

    expectTypeOf(withResult.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(withResult.error()).toEqualTypeOf<Error | null>()

    expectTypeOf(withError.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(withError.error()).toEqualTypeOf<{ message: string } | null>()

    expectTypeOf(withResultInfer.data()).toEqualTypeOf<boolean | undefined>()
    expectTypeOf(withResultInfer.error()).toEqualTypeOf<Error | null>()

    expectTypeOf(unionTypeSync.data()).toEqualTypeOf<'a' | 'b' | undefined>()
    expectTypeOf(unionTypeAsync.data()).toEqualTypeOf<'a' | 'b' | undefined>()

    expectTypeOf(fromGenericQueryFn.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(fromGenericQueryFn.error()).toEqualTypeOf<Error | null>()

    expectTypeOf(fromGenericOptionsQueryFn.data()).toEqualTypeOf<
      string | undefined
    >()
    expectTypeOf(
      fromGenericOptionsQueryFn.error(),
    ).toEqualTypeOf<Error | null>()

    expectTypeOf(fromMyDataArrayKeyQueryFn.data()).toEqualTypeOf<
      number | undefined
    >()

    expectTypeOf(fromPromiseAnyQueryFn.data()).toEqualTypeOf<any | undefined>()
    expectTypeOf(fromGetMyDataStringKeyQueryFn.data()).toEqualTypeOf<
      number | undefined
    >()
    expectTypeOf(fromWrappedQuery.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(fromWrappedFuncStyleQuery.data()).toEqualTypeOf<
      boolean | undefined
    >()
  })

  it('should return pending status initially', () => {
    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      query = injectQuery(() => ({
        queryKey: ['key1'],
        queryFn: () => sleep(10).then(() => 'Some data'),
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    fixture.autoDetectChanges()
    const query = fixture.componentInstance.query

    expect(query.status()).toBe('pending')
    expect(query.isPending()).toBe(true)
    expect(query.isFetching()).toBe(true)
    expect(query.isStale()).toBe(true)
    expect(query.isFetched()).toBe(false)
  })

  it('should resolve to success and update signal: injectQuery()', async () => {
    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      query = injectQuery(() => ({
        queryKey: ['key2'],
        queryFn: () => sleep(10).then(() => 'result2'),
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    const query = fixture.componentInstance.query

    await vi.advanceTimersByTimeAsync(11)
    expect(query.status()).toBe('success')
    expect(query.data()).toBe('result2')
    expect(query.isPending()).toBe(false)
    expect(query.isFetching()).toBe(false)
    expect(query.isFetched()).toBe(true)
    expect(query.isSuccess()).toBe(true)
  })

  it('should reject and update signal', async () => {
    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      query = injectQuery(() => ({
        retry: false,
        queryKey: ['key3'],
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    const query = fixture.componentInstance.query

    await vi.advanceTimersByTimeAsync(11)
    expect(query.status()).toBe('error')
    expect(query.data()).toBe(undefined)
    expect(query.error()).toMatchObject({ message: 'Some error' })
    expect(query.isPending()).toBe(false)
    expect(query.isFetching()).toBe(false)
    expect(query.isError()).toBe(true)
    expect(query.failureCount()).toBe(1)
    expect(query.failureReason()).toMatchObject({ message: 'Some error' })
  })

  it('should expose the query result as an Angular resource', async () => {
    const queryFn = vi.fn(() => sleep(10).then(() => 'result'))
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['resource-query'],
        queryFn,
      })),
    )

    TestBed.tick()
    expect('resource' in query).toBe(false)
    const resource = toResource(query)
    expect(resource.status()).toBe('loading')
    expect(resource.snapshot()).toEqual({ status: 'loading', value: undefined })
    expect(resource.isLoading()).toBe(true)
    expect(resource.hasValue()).toBe(false)

    await vi.advanceTimersByTimeAsync(11)

    expect(resource.status()).toBe('resolved')
    expect(resource.snapshot()).toEqual({ status: 'resolved', value: 'result' })
    expect(resource.isLoading()).toBe(false)
    expect(resource.hasValue()).toBe(true)
    expect(resource.value()).toBe('result')

    expect(resource.reload()).toBe(true)
    await Promise.resolve()
    expect(queryFn).toHaveBeenCalledTimes(2)

    expect(resource.status()).toBe('reloading')
    expect(resource.snapshot()).toEqual({
      status: 'reloading',
      value: 'result',
    })
    expect(resource.isLoading()).toBe(true)
    expect(resource.value()).toBe('result')
    expect(resource.reload()).toBe(false)
    expect(queryFn).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(11)

    expect(resource.status()).toBe('resolved')
    expect(resource.value()).toBe('result')
  })

  it.each([undefined, null, 'query failed'])(
    'should normalize a %s query rejection for the resource error state',
    async (rejection) => {
      const query = TestBed.runInInjectionContext(() =>
        injectQuery<unknown, unknown>(() => ({
          queryKey: ['resource-query-error', rejection],
          queryFn: () => Promise.reject(rejection),
          retry: false,
        })),
      )

      TestBed.tick()
      await vi.advanceTimersByTimeAsync(1)

      const resource = toResource(query)
      const resourceError = resource.error()
      expect(resource.status()).toBe('error')
      expect(resourceError).toBeInstanceOf(Error)
      expect(resourceError?.cause).toBe(rejection)
      expect(resource.snapshot()).toEqual({
        status: 'error',
        error: resourceError,
      })

      let thrown: unknown
      try {
        resource.value()
      } catch (error) {
        thrown = error
      }
      expect(thrown).toBe(resourceError)
    },
  )

  it('should preserve Error-like query rejections', async () => {
    const rejection = { name: 'QueryError', message: 'query failed' }
    const query = TestBed.runInInjectionContext(() =>
      injectQuery<unknown, typeof rejection>(() => ({
        queryKey: ['resource-query-error-like'],
        queryFn: () => Promise.reject(rejection),
        retry: false,
      })),
    )

    TestBed.tick()
    await vi.advanceTimersByTimeAsync(1)

    const resource = toResource(query)
    expect(resource.status()).toBe('error')
    expect(resource.error()).toBe(rejection)
  })

  it('should not reload fresh query resources', async () => {
    const queryFn = vi.fn(() => sleep(10).then(() => 'fresh-result'))
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['fresh-resource-query'],
        queryFn,
        staleTime: Infinity,
      })),
    )

    TestBed.tick()
    await vi.advanceTimersByTimeAsync(11)

    const resource = toResource(query)
    expect(resource.status()).toBe('resolved')
    expect(resource.reload()).toBe(false)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should expose disabled queries as idle resources', () => {
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        enabled: false,
        queryKey: ['idle-resource-query'],
        queryFn: () => sleep(10).then(() => 'result'),
      })),
    )

    TestBed.tick()
    const resource = toResource(query)

    expect(resource.status()).toBe('idle')
    expect(resource.snapshot()).toEqual({ status: 'idle', value: undefined })
    expect(resource.isLoading()).toBe(false)
    expect(resource.hasValue()).toBe(false)
    expect(resource.value()).toBe(undefined)
    expect(resource.reload()).toBe(false)
  })

  it('should update query on options contained signal change', async () => {
    const key = signal(['key6', 'key7'])
    const spy = vi.fn(() => sleep(10).then(() => 'Some data'))

    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      key = key
      spy = spy
      query = injectQuery(() => ({
        queryKey: this.key(),
        queryFn: this.spy,
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    const query = fixture.componentInstance.query

    await vi.advanceTimersByTimeAsync(0)
    expect(spy).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(10)
    expect(query.status()).toBe('success')

    key.set(['key8'])
    fixture.detectChanges()

    expect(spy).toHaveBeenCalledTimes(2)
    // should call queryFn with context containing the new queryKey
    expect(spy).toHaveBeenNthCalledWith(2, {
      client: queryClient,
      meta: undefined,
      queryKey: ['key8'],
      signal: expect.anything(),
    })
  })

  it('allows cache listeners to read the result while options update', () => {
    const key = signal('one')
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['reentrant-options', key()],
        queryFn: () => 'data',
        enabled: false,
      })),
    )

    TestBed.tick()
    const readResult = vi.fn(() => query.status())
    const unsubscribe = queryCache.subscribe((event) => {
      // setOptions emits synchronously; this read must not re-enter the signal
      // computation that caused the options update.
      if (event.type === 'observerOptionsUpdated') readResult()
    })

    key.set('two')

    expect(() => TestBed.tick()).not.toThrow()
    expect(readResult).toHaveBeenCalled()

    unsubscribe()
  })

  it('allows deferred cache-listener reads during restoration detach and reattach', async () => {
    const isRestoring = signal(false)
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => queryClient),
        provideIsRestoring(() => isRestoring.asReadonly()),
      ],
    })
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['reentrant-restoration-subscription'],
        queryFn: () => 'data',
        enabled: false,
      })),
    )
    expect(query.status()).toBe('pending')
    TestBed.tick()

    const nestedStatuses: Array<string> = []
    const unsubscribe = queryCache.subscribe((event) => {
      if (event.type === 'observerAdded' || event.type === 'observerRemoved') {
        void Promise.resolve().then(() => nestedStatuses.push(query.status()))
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

  it('allows deferred cache-listener reads while an option change creates a query', async () => {
    const key = signal('old')
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['reentrant-query-added', key()],
        queryFn: () => 'data',
        enabled: false,
      })),
    )

    expect(query.status()).toBe('pending')
    TestBed.tick()
    const nestedStatuses: Array<string> = []
    const unsubscribe = queryCache.subscribe((event) => {
      if (event.type === 'added')
        void Promise.resolve().then(() => nestedStatuses.push(query.status()))
    })

    key.set('new')

    expect(() => query.status()).not.toThrow()
    expect(nestedStatuses).toEqual([])
    expect(() => TestBed.tick()).not.toThrow()
    await Promise.resolve()
    expect(nestedStatuses).toEqual(['pending'])
    unsubscribe()
  })

  it('keeps the external subscription when non-key options change', () => {
    const staleTime = signal(0)
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['stable-option-subscription'],
        queryFn: () => 'data',
        enabled: false,
        staleTime: staleTime(),
      })),
    )

    expect(query.status()).toBe('pending')
    TestBed.tick()
    const cachedQuery = queryCache.find({
      queryKey: ['stable-option-subscription'],
    })!
    const subscriptionEvents: Array<string> = []
    const unsubscribe = queryCache.subscribe((event) => {
      if (event.type === 'observerAdded' || event.type === 'observerRemoved') {
        subscriptionEvents.push(event.type)
      }
    })

    staleTime.set(1)
    expect(query.status()).toBe('pending')
    TestBed.tick()

    expect(cachedQuery.getObserversCount()).toBe(1)
    expect(subscriptionEvents).toEqual([])
    unsubscribe()
  })

  it('should only run query once enabled signal is set to true', async () => {
    const spy = vi.fn(() => sleep(10).then(() => 'Some data'))
    const enabled = signal(false)

    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      enabled = enabled
      spy = spy
      query = injectQuery(() => ({
        queryKey: ['key9'],
        queryFn: this.spy,
        enabled: this.enabled(),
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    const query = fixture.componentInstance.query

    expect(spy).not.toHaveBeenCalled()
    expect(query.status()).toBe('pending')

    enabled.set(true)
    fixture.detectChanges()

    await vi.advanceTimersByTimeAsync(10)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(query.status()).toBe('success')
  })

  it('should properly execute dependant queries', async () => {
    const dependentQueryFn = vi
      .fn()
      .mockImplementation(() => sleep(1000).then(() => 'Some data'))

    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      query1 = injectQuery(() => ({
        queryKey: ['dependant1'],
        queryFn: () => sleep(10).then(() => 'Some data'),
      }))

      query2 = injectQuery(
        computed(() => ({
          queryKey: ['dependent2'],
          queryFn: dependentQueryFn,
          enabled: !!this.query1.data(),
        })),
      )
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    fixture.autoDetectChanges()
    const { query1, query2 } = fixture.componentInstance

    expect(query1.data()).toStrictEqual(undefined)
    expect(query2.fetchStatus()).toStrictEqual('idle')
    expect(dependentQueryFn).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(11)

    expect(query1.data()).toStrictEqual('Some data')
    expect(query2.fetchStatus()).toStrictEqual('fetching')

    await vi.advanceTimersByTimeAsync(1002)

    expect(query2.fetchStatus()).toStrictEqual('idle')
    expect(query2.status()).toStrictEqual('success')
    expect(dependentQueryFn).toHaveBeenCalledTimes(1)
    expect(dependentQueryFn).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['dependent2'] }),
    )
  })

  it('should use the current value for the queryKey when refetch is called', async () => {
    const fetchFn = vi.fn(() => sleep(10).then(() => 'Some data'))
    const keySignal = signal('key11')

    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      keySignal = keySignal
      fetchFn = fetchFn
      query = injectQuery(() => ({
        queryKey: ['key10', this.keySignal()],
        queryFn: this.fetchFn,
        enabled: false,
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    const query = fixture.componentInstance.query

    expect(fetchFn).not.toHaveBeenCalled()

    const first = query.refetch()
    await vi.advanceTimersByTimeAsync(10)
    await first
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(fetchFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['key10', 'key11'],
      }),
    )

    keySignal.set('key12')
    const second = query.refetch()
    await vi.advanceTimersByTimeAsync(10)
    await second
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(fetchFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['key10', 'key12'],
      }),
    )
  })

  it('should keep initialData visible alongside the error when a refetch fails', async () => {
    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      query = injectQuery(() => ({
        queryKey: ['initialDataError'],
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
        initialData: 'initial',
        retry: false,
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    const query = fixture.componentInstance.query

    expect(query.data()).toBe('initial')
    expect(query.isError()).toBe(false)
    expect(query.status()).toBe('success')

    await vi.advanceTimersByTimeAsync(11)
    fixture.detectChanges()

    expect(query.data()).toBe('initial')
    expect(query.isError()).toBe(true)
    expect(query.status()).toBe('error')
  })

  it('should support selection function with select', async () => {
    const app = TestBed.inject(ApplicationRef)

    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      query = injectQuery(() => ({
        queryKey: ['key13'],
        queryFn: () => [{ id: 1 }, { id: 2 }],
        select: (data) => data.map((item) => item.id),
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    const query = fixture.componentInstance.query

    // Wait for query to complete (even synchronous queryFn needs time to process)
    const stablePromise = app.whenStable()
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(10)
    await stablePromise

    expect(query.status()).toBe('success')
    expect(query.data()).toEqual([1, 2])
  })

  it('should set state to error when queryFn returns reject promise', async () => {
    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      query = injectQuery(() => ({
        retry: false,
        queryKey: ['key15'],
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    const query = fixture.componentInstance.query

    expect(query.status()).toBe('pending')

    await vi.advanceTimersByTimeAsync(11)

    expect(query.status()).toBe('error')
  })

  it('should render with required signal inputs', async () => {
    @Component({
      selector: 'app-fake',
      template: `{{ query.data() }}`,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class FakeComponent {
      name = input.required<string>()

      query = injectQuery(() => ({
        queryKey: ['fake', this.name()],
        queryFn: () => this.name(),
      }))
    }

    const name = signal('signal-input-required-test')
    const rendered = await render(FakeComponent, {
      bindings: [inputBinding('name', name.asReadonly())],
      detectChangesOnRender: false,
    })
    rendered.fixture.detectChanges()
    rendered.fixture.autoDetectChanges()
    await vi.advanceTimersByTimeAsync(0)

    const result = rendered.fixture.nativeElement.textContent
    expect(result).toEqual('signal-input-required-test')
  })

  it('should support aliasing query.data on required signal inputs', async () => {
    @Component({
      selector: 'app-fake',
      template: `{{ data() }}`,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class FakeComponent {
      name = input.required<string>()

      query = injectQuery(() => ({
        queryKey: ['fake-alias', this.name()],
        queryFn: () => this.name(),
      }))

      data = this.query.data
    }

    const name = signal('signal-input-alias-test')
    const rendered = await render(FakeComponent, {
      bindings: [inputBinding('name', name.asReadonly())],
      detectChangesOnRender: false,
    })
    rendered.fixture.detectChanges()
    rendered.fixture.autoDetectChanges()
    await vi.advanceTimersByTimeAsync(0)

    const result = rendered.fixture.nativeElement.textContent
    expect(result).toEqual('signal-input-alias-test')
  })

  it('should allow reading the query data on effect registered before injection', () => {
    const spy = vi.fn()
    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      readEffect = effect(() => {
        spy(this.query.data())
      })

      query = injectQuery(() => ({
        queryKey: ['effect-before-injection'],
        queryFn: () => sleep(0).then(() => 'Some data'),
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    expect(spy).toHaveBeenCalledWith(undefined)
  })

  it('should render with an initial value for input signal if available before change detection', async () => {
    const key1 = queryKey() as [string]
    const key2 = queryKey() as [string]
    queryClient.setQueryData(key1, 'value 1')
    queryClient.setQueryData(key2, 'value 2')

    @Component({
      selector: 'app-test',
      template: '{{ query.data() }}',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      inputKey = input.required<[string]>()
      query = injectQuery(() => ({
        queryKey: this.inputKey(),
        queryFn: () => sleep(0).then(() => 'Some data'),
      }))
    }

    const inputKey = signal<[string]>(key1)
    const rendered = await render(TestComponent, {
      bindings: [inputBinding('inputKey', inputKey.asReadonly())],
      detectChangesOnRender: false,
    })
    rendered.fixture.detectChanges()

    const instance = rendered.fixture.componentInstance
    const query = instance.query

    expect(() => instance.inputKey()).not.toThrow()

    expect(instance.inputKey()).toEqual(key1)
    expect(query.data()).toEqual('value 1')

    inputKey.set(key2)
    rendered.fixture.detectChanges()

    expect(instance.inputKey()).toEqual(key2)
    expect(query.data()).toEqual('value 2')
  })

  it('should allow reading the query data on component ngOnInit with required signal input', async () => {
    const spy = vi.fn()
    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      key = input.required<[string]>()
      query = injectQuery(() => ({
        queryKey: this.key(),
        queryFn: () => Promise.resolve(() => 'Some data'),
      }))

      initialStatus!: string

      ngOnInit() {
        this.initialStatus = this.query.status()

        // effect should not have been called yet
        expect(spy).not.toHaveBeenCalled()
      }

      _spyEffect = effect(() => {
        spy()
      })
    }

    const key = signal<[string]>(['ngOnInitTest'])
    const rendered = await render(TestComponent, {
      bindings: [inputBinding('key', key.asReadonly())],
      detectChangesOnRender: false,
    })
    rendered.fixture.detectChanges()

    const fixture = rendered.fixture
    expect(spy).toHaveBeenCalled()

    const instance = fixture.componentInstance
    expect(instance.initialStatus).toEqual('pending')
  })

  it('should update query data synchronously when query data changes', () => {
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['test'],
        initialData: 'initial data',
      })),
    )

    TestBed.tick()

    expect(query.data()).toBe('initial data')
    queryClient.setQueryData(['test'], 'new data')
    expect(query.data()).toBe('new data')
  })

  it('should pause fetching while restoring and fetch once restoring is disabled', async () => {
    const isRestoring = signal(true)
    const fetchSpy = vi.fn(() => sleep(10).then(() => 'restored-data'))

    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => queryClient),
        provideIsRestoring(() => isRestoring.asReadonly()),
      ],
    })

    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      query = injectQuery(() => ({
        queryKey: ['restoring'],
        queryFn: fetchSpy,
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()

    const query = fixture.componentInstance.query
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(query.status()).toBe('pending')

    const stablePromise = fixture.whenStable()
    await Promise.resolve()
    await stablePromise

    isRestoring.set(false)
    fixture.detectChanges()

    await vi.advanceTimersByTimeAsync(11)
    await fixture.whenStable()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(query.status()).toBe('success')
    expect(query.data()).toBe('restored-data')

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
    'uses the latest options when leaving restoration in the same turn (%s)',
    async (writeOrder) => {
      const isRestoring = signal(true)
      const key = signal('old')
      const queriedKeys: Array<string> = []

      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideAngularQueryChangeDetection(),
          provideTanStackQuery(() => queryClient),
          provideIsRestoring(() => isRestoring.asReadonly()),
        ],
      })

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['same-turn-restoration', key()],
          queryFn: ({ queryKey: currentQueryKey }) => {
            const currentKey = currentQueryKey[1] as string
            queriedKeys.push(currentKey)
            return Promise.resolve(currentKey)
          },
        })),
      )

      expect(query.status()).toBe('pending')
      expect(queriedKeys).toEqual([])

      if (writeOrder === 'options-first') {
        key.set('new')
        isRestoring.set(false)
      } else {
        isRestoring.set(false)
        key.set('new')
      }
      TestBed.tick()
      const stablePromise = TestBed.inject(ApplicationRef).whenStable()
      await vi.advanceTimersByTimeAsync(0)
      await stablePromise

      expect(queriedKeys).toEqual(['new'])
      expect(query.data()).toBe('new')
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

  it('allows a cache listener to read the result during restoration-boundary configuration', () => {
    const isRestoring = signal(true)
    const key = signal('old')

    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => queryClient),
        provideIsRestoring(() => isRestoring.asReadonly()),
      ],
    })

    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['restoration-reentrant', key()],
        queryFn: () => 'data',
        enabled: false,
      })),
    )

    expect(query.status()).toBe('pending')
    TestBed.tick()

    const boundaryRead = vi.fn(() => query.status())
    const unsubscribe = queryCache.subscribe((event) => {
      if (
        event.type === 'observerOptionsUpdated' &&
        event.query.getObserversCount() === 0
      ) {
        boundaryRead()
      }
    })

    key.set('new')
    isRestoring.set(false)

    expect(() => TestBed.tick()).not.toThrow()
    expect(boundaryRead).toHaveBeenCalled()
    expect(
      queryCache
        .find({ queryKey: ['restoration-reentrant', 'new'] })
        ?.getObserversCount(),
    ).toBe(1)

    unsubscribe()
  })

  it('converges to the current query after an early restoration read', async () => {
    const isRestoring = signal(true)
    const key = signal('old')
    const queriedKeys: Array<string> = []
    const oldQueryKey = ['early-restoration-read', 'old'] as const
    const newQueryKey = ['early-restoration-read', 'new'] as const

    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => queryClient),
        provideIsRestoring(() => isRestoring.asReadonly()),
      ],
    })

    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['early-restoration-read', key()],
        queryFn: ({ queryKey: currentQueryKey }) => {
          const currentKey = currentQueryKey[1] as string
          queriedKeys.push(currentKey)
          return Promise.resolve(currentKey)
        },
        staleTime: Infinity,
      })),
    )

    expect(query.status()).toBe('pending')
    TestBed.tick()
    const oldQuery = queryCache.find({ queryKey: oldQueryKey })!
    expect(oldQuery.getObserversCount()).toBe(0)

    key.set('new')
    isRestoring.set(false)

    // Pull before the option-configuration effect gets a chance to run.
    expect(query.status()).toBe('pending')
    expect(queryCache.find({ queryKey: newQueryKey })).toBeDefined()

    // A cache write to the optimistic query is adopted after configuration.
    queryClient.setQueryData(newQueryKey, 'early data')
    const newQuery = queryCache.find({ queryKey: newQueryKey })!
    expect(newQuery.getObserversCount()).toBe(0)
    TestBed.tick()
    const stablePromise = TestBed.inject(ApplicationRef).whenStable()
    await vi.advanceTimersByTimeAsync(0)
    await stablePromise

    expect(oldQuery.getObserversCount()).toBe(0)
    expect(newQuery.getObserversCount()).toBe(1)
    expect(queriedKeys).not.toContain('new')
    expect(query.data()).toBe('early data')
  })

  it('reads optimistic options before moving the subscription on the next tick', () => {
    const key = signal('old')
    const oldQueryKey = ['early-options-read', 'old'] as const
    const newQueryKey = ['early-options-read', 'new'] as const
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['early-options-read', key()],
        queryFn: () => 'unused',
        enabled: false,
      })),
    )

    expect(query.status()).toBe('pending')
    TestBed.tick()
    const oldQuery = queryCache.find({ queryKey: oldQueryKey })!
    expect(oldQuery.getObserversCount()).toBe(1)

    key.set('new')

    expect(query.status()).toBe('pending')
    // An existing observer stays attached until the configuration effect can
    // move it atomically.
    expect(oldQuery.getObserversCount()).toBe(1)
    expect(queryCache.find({ queryKey: newQueryKey })).toBeDefined()

    queryClient.setQueryData(newQueryKey, 'early data')
    const newQuery = queryCache.find({ queryKey: newQueryKey })!
    expect(newQuery.getObserversCount()).toBe(0)
    TestBed.tick()

    expect(oldQuery.getObserversCount()).toBe(0)
    expect(newQuery.getObserversCount()).toBe(1)
    expect(query.data()).toBe('early data')
  })

  describe('injection context', () => {
    it('throws NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectQuery(() => ({
          queryKey: ['injectionContextError'],
          queryFn: () => sleep(0).then(() => 'Some data'),
        }))
      }).toThrowError(/NG0203(.*?)injectQuery/)
    })

    it('should complete queries before whenStable() resolves', async () => {
      const app = TestBed.inject(ApplicationRef)

      @Component({
        selector: 'app-test',
        template: '',
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {
        query = injectQuery(() => ({
          queryKey: ['pendingTasksTest'],
          queryFn: async () => {
            await sleep(50)
            return 'test data'
          },
        }))
      }

      const fixture = TestBed.createComponent(TestComponent)
      fixture.detectChanges()
      const query = fixture.componentInstance.query

      expect(query.status()).toBe('pending')
      expect(query.data()).toBeUndefined()

      await vi.advanceTimersByTimeAsync(60)
      await app.whenStable()

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('test data')
    })

    it('should complete HttpClient-based queries before whenStable() resolves', async () => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideAngularQueryChangeDetection(),
          provideTanStackQuery(() => queryClient),
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      })

      const app = TestBed.inject(ApplicationRef)
      const httpClient = TestBed.inject(HttpClient)
      const httpTestingController = TestBed.inject(HttpTestingController)

      @Component({
        selector: 'app-test',
        template: '',
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {
        httpClient = httpClient
        query = injectQuery(() => ({
          queryKey: ['httpClientTest'],
          queryFn: () =>
            lastValueFrom(
              this.httpClient.get<{ message: string }>('/api/test'),
            ),
        }))
      }

      const fixture = TestBed.createComponent(TestComponent)
      fixture.detectChanges()
      const query = fixture.componentInstance.query

      setTimeout(() => {
        const req = httpTestingController.expectOne('/api/test')
        req.flush({ message: 'http test data' })
      }, 10)

      expect(query.status()).toBe('pending')

      // Advance timers and wait for Angular to be "stable"
      await vi.advanceTimersByTimeAsync(20)
      await app.whenStable()

      // Query should be complete after whenStable() thanks to PendingTasks integration
      expect(query.status()).toBe('success')
      expect(query.data()).toEqual({ message: 'http test data' })

      httpTestingController.verify()
    })

    it('should handle synchronous queryFn with staleTime', async () => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideAngularQueryChangeDetection(),
          provideTanStackQuery(() => queryClient),
        ],
      })

      const app = TestBed.inject(ApplicationRef)

      @Component({
        selector: 'app-test',
        template: '',
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {
        callCount = 0
        query = injectQuery(() => ({
          queryKey: ['sync-stale'],
          staleTime: 1000,
          queryFn: () => {
            this.callCount++
            return `sync-data-${this.callCount}`
          },
        }))
      }

      const fixture = TestBed.createComponent(TestComponent)
      fixture.detectChanges()
      const component = fixture.componentInstance
      const query = component.query

      const stablePromise = app.whenStable()
      await vi.advanceTimersToNextTimerAsync()
      await stablePromise

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-1')
      expect(component.callCount).toBe(1)

      await query.refetch()
      await Promise.resolve()
      await vi.runAllTimersAsync()
      await app.whenStable()

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-2')
      expect(component.callCount).toBe(2)
    })

    it('should handle enabled/disabled transitions with synchronous queryFn', async () => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideAngularQueryChangeDetection(),
          provideTanStackQuery(() => queryClient),
        ],
      })

      const app = TestBed.inject(ApplicationRef)
      const enabledSignal = signal(false)

      @Component({
        selector: 'app-test',
        template: '',
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {
        enabledSignal = enabledSignal
        callCount = 0
        query = injectQuery(() => ({
          queryKey: ['sync-enabled'],
          enabled: this.enabledSignal(),
          queryFn: () => {
            this.callCount++
            return `sync-data-${this.callCount}`
          },
        }))
      }

      const fixture = TestBed.createComponent(TestComponent)
      fixture.detectChanges()
      const component = fixture.componentInstance
      const query = component.query

      await vi.advanceTimersByTimeAsync(0)
      await app.whenStable()
      expect(query.status()).toBe('pending')
      expect(query.data()).toBeUndefined()
      expect(component.callCount).toBe(0)

      enabledSignal.set(true)
      fixture.detectChanges()

      const stablePromise = app.whenStable()
      await vi.advanceTimersToNextTimerAsync()
      await stablePromise

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-1')
      expect(component.callCount).toBe(1)
    })

    it('should handle query invalidation with synchronous data', async () => {
      vi.useRealTimers()
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideAngularQueryChangeDetection(),
          provideTanStackQuery(() => queryClient),
        ],
      })

      const app = TestBed.inject(ApplicationRef)
      const testKey = ['sync-invalidate']

      @Component({
        selector: 'app-test',
        template: '',
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {
        callCount = 0
        query = injectQuery(() => ({
          queryKey: testKey,
          queryFn: () => {
            this.callCount++
            return `sync-data-${this.callCount}`
          },
        }))
      }

      const fixture = TestBed.createComponent(TestComponent)
      fixture.detectChanges()
      const component = fixture.componentInstance
      const query = component.query

      await app.whenStable()

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-1')
      expect(component.callCount).toBe(1)

      await queryClient.invalidateQueries({ queryKey: testKey })
      await app.whenStable()
      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-2')
      expect(component.callCount).toBe(2)
    })

    it('should keep the application unstable while invalidation is pending', async () => {
      vi.useRealTimers()
      let resolveRefetch!: (value: string) => void
      let callCount = 0

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['pending-invalidation'],
          queryFn: () => {
            callCount++

            if (callCount === 1) {
              return 'data-1'
            }

            return new Promise<string>((resolve) => {
              resolveRefetch = resolve
            })
          },
        })),
      )

      const app = TestBed.inject(ApplicationRef)
      await app.whenStable()

      const invalidation = queryClient.invalidateQueries({
        queryKey: ['pending-invalidation'],
      })
      const stable = app.whenStable()
      let stableResolved = false
      void stable.then(() => {
        stableResolved = true
      })

      expect(stableResolved).toBe(false)

      resolveRefetch('data-2')

      await invalidation
      await stable

      expect(query.data()).toBe('data-2')
      expect(query.fetchStatus()).toBe('idle')
    })
  })
})
