import {
  ApplicationRef,
  Component,
  Injector,
  computed,
  effect,
  input,
  provideZonelessChangeDetection,
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
  test,
  vi,
} from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { lastValueFrom } from 'rxjs'
import { QueryCache, QueryClient, injectQuery, provideTanStackQuery } from '..'
import { setSignalInputs } from './test-utils'
import type { CreateQueryOptions, OmitKeyof, QueryFunction } from '..'

describe('injectQuery', () => {
  let queryCache: QueryCache
  let queryClient: QueryClient
  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should return the correct types', () => {
    const key = queryKey()
    // unspecified query function should default to unknown
    const noQueryFn = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
      })),
    )
    expectTypeOf(noQueryFn.data()).toEqualTypeOf<unknown>()
    expectTypeOf(noQueryFn.error()).toEqualTypeOf<Error | null>()

    // it should infer the result type from the query function
    const fromQueryFn = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        queryFn: () => 'test',
      })),
    )
    expectTypeOf(fromQueryFn.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(fromQueryFn.error()).toEqualTypeOf<Error | null>()

    // it should be possible to specify the result type
    const withResult = TestBed.runInInjectionContext(() =>
      injectQuery<string>(() => ({
        queryKey: key,
        queryFn: () => 'test',
      })),
    )
    expectTypeOf(withResult.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(withResult.error()).toEqualTypeOf<Error | null>()

    // it should be possible to specify the error type
    type CustomErrorType = { message: string }
    const withError = TestBed.runInInjectionContext(() =>
      injectQuery<string, CustomErrorType>(() => ({
        queryKey: key,
        queryFn: () => 'test',
      })),
    )
    expectTypeOf(withError.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(withError.error()).toEqualTypeOf<CustomErrorType | null>()

    // it should infer the result type from the configuration
    const withResultInfer = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        queryFn: () => true,
      })),
    )
    expectTypeOf(withResultInfer.data()).toEqualTypeOf<boolean | undefined>()
    expectTypeOf(withResultInfer.error()).toEqualTypeOf<Error | null>()

    // it should be possible to specify a union type as result type
    const unionTypeSync = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        queryFn: () => (Math.random() > 0.5 ? ('a' as const) : ('b' as const)),
      })),
    )
    expectTypeOf(unionTypeSync.data()).toEqualTypeOf<'a' | 'b' | undefined>()
    const unionTypeAsync = TestBed.runInInjectionContext(() =>
      injectQuery<'a' | 'b'>(() => ({
        queryKey: key,
        queryFn: () => Promise.resolve(Math.random() > 0.5 ? 'a' : 'b'),
      })),
    )
    expectTypeOf(unionTypeAsync.data()).toEqualTypeOf<'a' | 'b' | undefined>()

    // it should error when the query function result does not match with the specified type
    TestBed.runInInjectionContext(() =>
      // @ts-expect-error
      injectQuery<number>(() => ({ queryKey: key, queryFn: () => 'test' })),
    )

    // it should infer the result type from a generic query function
    /**
     *
     */
    function queryFn<T = string>(): Promise<T> {
      return Promise.resolve({} as T)
    }

    const fromGenericQueryFn = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        queryFn: () => queryFn(),
      })),
    )
    expectTypeOf(fromGenericQueryFn.data()).toEqualTypeOf<string | undefined>()
    expectTypeOf(fromGenericQueryFn.error()).toEqualTypeOf<Error | null>()

    // todo use query options?
    const fromGenericOptionsQueryFn = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        queryFn: () => queryFn(),
      })),
    )
    expectTypeOf(fromGenericOptionsQueryFn.data()).toEqualTypeOf<
      string | undefined
    >()
    expectTypeOf(
      fromGenericOptionsQueryFn.error(),
    ).toEqualTypeOf<Error | null>()

    type MyData = number
    type MyQueryKey = readonly ['my-data', number]

    const getMyDataArrayKey: QueryFunction<MyData, MyQueryKey> = ({
      queryKey: [, n],
    }) => {
      return n + 42
    }

    const fromMyDataArrayKeyQueryFn = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['my-data', 100] as const,
        queryFn: getMyDataArrayKey,
      })),
    )
    expectTypeOf(fromMyDataArrayKeyQueryFn.data()).toEqualTypeOf<
      number | undefined
    >()

    // it should handle query-functions that return Promise<any>
    const fromPromiseAnyQueryFn = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        queryFn: () => fetch('return Promise<any>').then((resp) => resp.json()),
      })),
    )
    expectTypeOf(fromPromiseAnyQueryFn.data()).toEqualTypeOf<any | undefined>()

    TestBed.runInInjectionContext(() =>
      effect(() => {
        if (fromPromiseAnyQueryFn.isSuccess()) {
          expect(fromMyDataArrayKeyQueryFn.data()).toBe(142)
        }
      }),
    )

    const getMyDataStringKey: QueryFunction<MyData, ['1']> = (context) => {
      expectTypeOf(context.queryKey).toEqualTypeOf<['1']>()
      return Number(context.queryKey[0]) + 42
    }

    const fromGetMyDataStringKeyQueryFn = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['1'] as ['1'],
        queryFn: getMyDataStringKey,
      })),
    )
    expectTypeOf(fromGetMyDataStringKeyQueryFn.data()).toEqualTypeOf<
      number | undefined
    >()

    TestBed.runInInjectionContext(() =>
      effect(() => {
        if (fromGetMyDataStringKeyQueryFn.isSuccess()) {
          expect(fromGetMyDataStringKeyQueryFn.data()).toBe(43)
        }
      }),
    )

    // handles wrapped queries with custom fetcher passed as inline queryFn
    const createWrappedQuery = <
      TQueryKey extends [string, Record<string, unknown>?],
      TQueryFnData,
      TError,
      TData = TQueryFnData,
    >(
      qk: TQueryKey,
      fetcher: (
        obj: TQueryKey[1],
        token: string,
        // return type must be wrapped with TQueryFnReturn
      ) => Promise<TQueryFnData>,
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
    const fromWrappedQuery = TestBed.runInInjectionContext(() =>
      createWrappedQuery([''], () => Promise.resolve('1')),
    )
    expectTypeOf(fromWrappedQuery.data()).toEqualTypeOf<string | undefined>()

    // handles wrapped queries with custom fetcher passed directly to createQuery
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
    const fromWrappedFuncStyleQuery = TestBed.runInInjectionContext(() =>
      createWrappedFuncStyleQuery([''], () => Promise.resolve(true)),
    )
    expectTypeOf(fromWrappedFuncStyleQuery.data()).toEqualTypeOf<
      boolean | undefined
    >()
  })

  test('should return pending status initially', () => {
    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: ['key1'],
        queryFn: () => sleep(10).then(() => 'Some data'),
      }))
    })

    expect(query.status()).toBe('pending')
    expect(query.isPending()).toBe(true)
    expect(query.isFetching()).toBe(true)
    expect(query.isStale()).toBe(true)
    expect(query.isFetched()).toBe(false)
  })

  test('should resolve to success and update signal: injectQuery()', async () => {
    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: ['key2'],
        queryFn: () => sleep(10).then(() => 'result2'),
      }))
    })

    await vi.advanceTimersByTimeAsync(11)
    expect(query.status()).toBe('success')
    expect(query.data()).toBe('result2')
    expect(query.isPending()).toBe(false)
    expect(query.isFetching()).toBe(false)
    expect(query.isFetched()).toBe(true)
    expect(query.isSuccess()).toBe(true)
  })

  test('should reject and update signal', async () => {
    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        retry: false,
        queryKey: ['key3'],
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
      }))
    })

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

  test('should update query on options contained signal change', async () => {
    const key = signal(['key6', 'key7'])
    const spy = vi.fn(() => sleep(10).then(() => 'Some data'))

    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: key(),
        queryFn: spy,
      }))
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(spy).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(11)
    expect(query.status()).toBe('success')

    key.set(['key8'])
    TestBed.tick()

    expect(spy).toHaveBeenCalledTimes(2)
    // should call queryFn with context containing the new queryKey
    expect(spy).toBeCalledWith({
      client: queryClient,
      meta: undefined,
      queryKey: ['key8'],
      signal: expect.anything(),
    })
  })

  test('should only run query once enabled signal is set to true', async () => {
    const spy = vi.fn(() => sleep(10).then(() => 'Some data'))
    const enabled = signal(false)

    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: ['key9'],
        queryFn: spy,
        enabled: enabled(),
      }))
    })

    expect(spy).not.toHaveBeenCalled()
    expect(query.status()).toBe('pending')

    enabled.set(true)

    await vi.advanceTimersByTimeAsync(11)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(query.status()).toBe('success')
  })

  test('should properly execute dependant queries', async () => {
    const query1 = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: ['dependant1'],
        queryFn: () => sleep(10).then(() => 'Some data'),
      }))
    })

    const dependentQueryFn = vi
      .fn()
      .mockImplementation(() => sleep(1000).then(() => 'Some data'))

    const query2 = TestBed.runInInjectionContext(() => {
      return injectQuery(
        computed(() => ({
          queryKey: ['dependant2'],
          queryFn: dependentQueryFn,
          enabled: !!query1.data(),
        })),
      )
    })

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
      expect.objectContaining({ queryKey: ['dependant2'] }),
    )
  })

  test('should use the current value for the queryKey when refetch is called', async () => {
    const fetchFn = vi.fn(() => sleep(10).then(() => 'Some data'))
    const keySignal = signal('key11')

    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: ['key10', keySignal()],
        queryFn: fetchFn,
        enabled: false,
      }))
    })

    expect(fetchFn).not.toHaveBeenCalled()

    query.refetch().then(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1)
      expect(fetchFn).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['key10', 'key11'],
        }),
      )
    })

    await vi.advanceTimersByTimeAsync(11)

    keySignal.set('key12')

    query.refetch().then(() => {
      expect(fetchFn).toHaveBeenCalledTimes(2)
      expect(fetchFn).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['key10', 'key12'],
        }),
      )
    })

    await vi.advanceTimersByTimeAsync(11)
  })

  describe('throwOnError', () => {
    test('should evaluate throwOnError when query is expected to throw', async () => {
      const boundaryFn = vi.fn()
      TestBed.runInInjectionContext(() => {
        return injectQuery(() => ({
          queryKey: ['key12'],
          queryFn: () =>
            sleep(10).then(() => Promise.reject(new Error('Some error'))),
          retry: false,
          throwOnError: boundaryFn,
        }))
      })

      await vi.advanceTimersByTimeAsync(11)
      expect(boundaryFn).toHaveBeenCalledTimes(1)
      expect(boundaryFn).toHaveBeenCalledWith(
        Error('Some error'),
        expect.objectContaining({
          state: expect.objectContaining({ status: 'error' }),
        }),
      )
    })

    test('should throw when throwOnError is true', async () => {
      TestBed.runInInjectionContext(() => {
        return injectQuery(() => ({
          queryKey: ['key13'],
          queryFn: () =>
            sleep(0).then(() => Promise.reject(new Error('Some error'))),
          throwOnError: true,
        }))
      })

      await expect(vi.runAllTimersAsync()).rejects.toThrow('Some error')
    })

    test('should throw when throwOnError function returns true', async () => {
      TestBed.runInInjectionContext(() => {
        return injectQuery(() => ({
          queryKey: ['key14'],
          queryFn: () =>
            sleep(0).then(() => Promise.reject(new Error('Some error'))),
          throwOnError: () => true,
        }))
      })

      await expect(vi.runAllTimersAsync()).rejects.toThrow('Some error')
    })
  })

  test('should set state to error when queryFn returns reject promise', async () => {
    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        retry: false,
        queryKey: ['key15'],
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
      }))
    })

    expect(query.status()).toBe('pending')

    await vi.advanceTimersByTimeAsync(11)

    expect(query.status()).toBe('error')
  })

  test('should render with required signal inputs', async () => {
    @Component({
      selector: 'app-fake',
      template: `{{ query.data() }}`,
    })
    class FakeComponent {
      name = input.required<string>()

      query = injectQuery(() => ({
        queryKey: ['fake', this.name()],
        queryFn: () => this.name(),
      }))
    }

    const fixture = TestBed.createComponent(FakeComponent)
    setSignalInputs(fixture.componentInstance, {
      name: 'signal-input-required-test',
    })

    fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(0)

    expect(fixture.componentInstance.query.data()).toEqual(
      'signal-input-required-test',
    )
  })

  describe('injection context', () => {
    test('throws NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectQuery(() => ({
          queryKey: ['injectionContextError'],
          queryFn: () => sleep(0).then(() => 'Some data'),
        }))
      }).toThrowError(/NG0203(.*?)injectQuery/)
    })

    test('can be used outside injection context when passing an injector', () => {
      const query = injectQuery(
        () => ({
          queryKey: ['manualInjector'],
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
        {
          injector: TestBed.inject(Injector),
        },
      )

      expect(query.status()).toBe('pending')
    })

    test('should complete queries before whenStable() resolves', async () => {
      const app = TestBed.inject(ApplicationRef)

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['pendingTasksTest'],
          queryFn: async () => {
            await sleep(50)
            return 'test data'
          },
        })),
      )

      expect(query.status()).toBe('pending')
      expect(query.data()).toBeUndefined()

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(60)
      await stablePromise

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('test data')
    })

    test('should complete HttpClient-based queries before whenStable() resolves', async () => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTanStackQuery(queryClient),
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      })

      const app = TestBed.inject(ApplicationRef)
      const httpClient = TestBed.inject(HttpClient)
      const httpTestingController = TestBed.inject(HttpTestingController)

      // Create a query using HttpClient
      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['httpClientTest'],
          queryFn: () =>
            lastValueFrom(httpClient.get<{ message: string }>('/api/test')),
        })),
      )

      // Schedule the HTTP response
      setTimeout(() => {
        const req = httpTestingController.expectOne('/api/test')
        req.flush({ message: 'http test data' })
      }, 10)

      // Initial state
      expect(query.status()).toBe('pending')

      // Advance timers and wait for Angular to be "stable"
      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(20)
      await stablePromise

      // Query should be complete after whenStable() thanks to PendingTasks integration
      expect(query.status()).toBe('success')
      expect(query.data()).toEqual({ message: 'http test data' })

      httpTestingController.verify()
    })

    test('should handle synchronous queryFn with staleTime', async () => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTanStackQuery(queryClient),
        ],
      })

      const app = TestBed.inject(ApplicationRef)
      let callCount = 0

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['sync-stale'],
          staleTime: 1000,
          queryFn: () => {
            callCount++
            return `sync-data-${callCount}`
          },
        })),
      )

      // Synchronize pending effects
      TestBed.tick()

      const stablePromise = app.whenStable()
      await stablePromise

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-1')
      expect(callCount).toBe(1)

      await query.refetch()
      await Promise.resolve()
      await vi.runAllTimersAsync()
      await app.whenStable()

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-2')
      expect(callCount).toBe(2)
    })

    test('should handle enabled/disabled transitions with synchronous queryFn', async () => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTanStackQuery(queryClient),
        ],
      })

      const app = TestBed.inject(ApplicationRef)
      const enabledSignal = signal(false)
      let callCount = 0

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['sync-enabled'],
          enabled: enabledSignal(),
          queryFn: () => {
            callCount++
            return `sync-data-${callCount}`
          },
        })),
      )

      // Initially disabled
      TestBed.tick()
      await app.whenStable()
      expect(query.status()).toBe('pending')
      expect(query.data()).toBeUndefined()
      expect(callCount).toBe(0)

      // Enable the query
      enabledSignal.set(true)
      TestBed.tick()

      await app.whenStable()
      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-1')
      expect(callCount).toBe(1)
    })

    test('should handle query invalidation with synchronous data', async () => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTanStackQuery(queryClient),
        ],
      })

      const app = TestBed.inject(ApplicationRef)
      const testKey = ['sync-invalidate']
      let callCount = 0

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: testKey,
          queryFn: () => {
            callCount++
            return `sync-data-${callCount}`
          },
        })),
      )

      // Synchronize pending effects
      TestBed.tick()

      await app.whenStable()
      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-1')
      expect(callCount).toBe(1)

      // Invalidate the query
      queryClient.invalidateQueries({ queryKey: testKey })
      TestBed.tick()

      // Wait for the invalidation to trigger a refetch
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10)
      TestBed.tick()

      await app.whenStable()
      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-2')
      expect(callCount).toBe(2)
    })
  })


  test('callbacks `onSuccess`, `onError` and `onSettled` should be called after a successful fetch', async () => {
    const onSuccessMock = vi.fn()
    const onFailureMock = vi.fn()
    const onSuccessSettledMock = vi.fn()
    const onFailureSettledMock = vi.fn()


    TestBed.runInInjectionContext(() => {
      injectQuery(() => ({
        queryKey: ['expected-success'],
        queryFn: () => 'fetched',
        onSuccess: (data) => onSuccessMock(data),
        onSettled: (data, _) => onSuccessSettledMock(data),
      }));

      injectQuery(() => ({
        queryKey: ['expected-failure'],
        queryFn: () => Promise.reject(new Error('error')),
        onError: (error) => onFailureMock(error),
        onSettled: (_, error) => onFailureSettledMock(error),
        retry: false,
      }));
    })

    await vi.advanceTimersByTimeAsync(10)

    expect(onSuccessMock).toHaveBeenCalled()
    expect(onSuccessSettledMock).toHaveBeenCalled()
    expect(onFailureMock).toHaveBeenCalled()
    expect(onFailureSettledMock).toHaveBeenCalled()
  })
})
