import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  Injector,
  NgZone,
  computed,
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

    @Component({
      selector: 'app-test',
      template: '',
      standalone: true,
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
          fetcher: (
            obj: TQueryKey[1],
            token: string,
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
    expectTypeOf(fromGenericOptionsQueryFn.error()).toEqualTypeOf<Error | null>()

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

  test('should return pending status initially', () => {
    @Component({
      selector: 'app-test',
      template: '',
      standalone: true,
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
    const query = fixture.componentInstance.query

    expect(query.status()).toBe('pending')
    expect(query.isPending()).toBe(true)
    expect(query.isFetching()).toBe(true)
    expect(query.isStale()).toBe(true)
    expect(query.isFetched()).toBe(false)
  })

  test('should resolve to success and update signal: injectQuery()', async () => {
    @Component({
      selector: 'app-test',
      template: '',
      standalone: true,
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

  test('should reject and update signal', async () => {
    @Component({
      selector: 'app-test',
      template: '',
      standalone: true,
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

  test('should update query on options contained signal change', async () => {
    const key = signal(['key6', 'key7'])
    const spy = vi.fn(() => sleep(10).then(() => 'Some data'))

    @Component({
      selector: 'app-test',
      template: '',
      standalone: true,
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

    await vi.advanceTimersByTimeAsync(11)
    expect(query.status()).toBe('success')

    key.set(['key8'])
    fixture.detectChanges()

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

    @Component({
      selector: 'app-test',
      template: '',
      standalone: true,
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

    await vi.advanceTimersByTimeAsync(11)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(query.status()).toBe('success')
  })

  test('should properly execute dependant queries', async () => {
    const dependentQueryFn = vi
      .fn()
      .mockImplementation(() => sleep(1000).then(() => 'Some data'))

    @Component({
      selector: 'app-test',
      template: '',
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      query1 = injectQuery(() => ({
        queryKey: ['dependant1'],
        queryFn: () => sleep(10).then(() => 'Some data'),
      }))

      query2 = injectQuery(
        computed(() => ({
          queryKey: ['dependant2'],
          queryFn: dependentQueryFn,
          enabled: !!this.query1.data(),
        })),
      )
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
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
      expect.objectContaining({ queryKey: ['dependant2'] }),
    )
  })

  test('should use the current value for the queryKey when refetch is called', async () => {
    const fetchFn = vi.fn(() => sleep(10).then(() => 'Some data'))
    const keySignal = signal('key11')

    @Component({
      selector: 'app-test',
      template: '',
      standalone: true,
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

    void query.refetch().then(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1)
      expect(fetchFn).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['key10', 'key11'],
        }),
      )
    })

    await vi.advanceTimersByTimeAsync(11)

    keySignal.set('key12')
    fixture.detectChanges()

    void query.refetch().then(() => {
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

      @Component({
        selector: 'app-test',
        template: '',
        standalone: true,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {
        boundaryFn = boundaryFn
        query = injectQuery(() => ({
          queryKey: ['key12'],
          queryFn: () =>
            sleep(10).then(() => Promise.reject(new Error('Some error'))),
          retry: false,
          throwOnError: this.boundaryFn,
        }))
      }

      const fixture = TestBed.createComponent(TestComponent)
      fixture.detectChanges()

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
      const zone = TestBed.inject(NgZone)
      const errorPromise = new Promise<Error>((resolve) => {
        const sub = zone.onError.subscribe((error) => {
          sub.unsubscribe()
          resolve(error as Error)
        })
      })

      @Component({
        selector: 'app-test',
        template: '',
        standalone: true,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {
        query = injectQuery(() => ({
          queryKey: ['key13'],
          queryFn: () =>
            sleep(0).then(() => Promise.reject(new Error('Some error'))),
          throwOnError: true,
        }))
      }

      TestBed.createComponent(TestComponent).detectChanges()

      await vi.runAllTimersAsync()
      await expect(errorPromise).resolves.toEqual(Error('Some error'))
    })

    test('should throw when throwOnError function returns true', async () => {
      const zone = TestBed.inject(NgZone)
      const errorPromise = new Promise<Error>((resolve) => {
        const sub = zone.onError.subscribe((error) => {
          sub.unsubscribe()
          resolve(error as Error)
        })
      })

      @Component({
        selector: 'app-test',
        template: '',
        standalone: true,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {
        query = injectQuery(() => ({
          queryKey: ['key14'],
          queryFn: () =>
            sleep(0).then(() => Promise.reject(new Error('Some error'))),
          throwOnError: () => true,
        }))
      }

      TestBed.createComponent(TestComponent).detectChanges()

      await vi.runAllTimersAsync()
      await expect(errorPromise).resolves.toEqual(Error('Some error'))
    })
  })

  test('should set state to error when queryFn returns reject promise', async () => {
    @Component({
      selector: 'app-test',
      template: '',
      standalone: true,
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

  test('should render with required signal inputs', async () => {
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
      const injector = TestBed.inject(Injector)

      @Component({
        selector: 'app-test',
        template: '',
        standalone: true,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {
        query = injectQuery(
          () => ({
            queryKey: ['manualInjector'],
            queryFn: () => sleep(0).then(() => 'Some data'),
          }),
          {
            injector: injector,
          },
        )
      }

      const fixture = TestBed.createComponent(TestComponent)
      fixture.detectChanges()
      const query = fixture.componentInstance.query

      expect(query.status()).toBe('pending')
    })

    test('should complete queries before whenStable() resolves', async () => {
      const app = TestBed.inject(ApplicationRef)

      @Component({
        selector: 'app-test',
        template: '',
        standalone: true,
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

      @Component({
        selector: 'app-test',
        template: '',
        standalone: true,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {
        httpClient = httpClient
        query = injectQuery(() => ({
          queryKey: ['httpClientTest'],
          queryFn: () =>
            lastValueFrom(this.httpClient.get<{ message: string }>('/api/test')),
        }))
      }

      const fixture = TestBed.createComponent(TestComponent)
      fixture.detectChanges()
      const query = fixture.componentInstance.query

      // Schedule the HTTP response
      setTimeout(() => {
        const req = httpTestingController.expectOne('/api/test')
        req.flush({ message: 'http test data' })
      }, 10)

      // Initial state
      expect(query.status()).toBe('pending')

      // Advance timers and wait for Angular to be "stable"
      await vi.advanceTimersByTimeAsync(20)
      await app.whenStable()

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

      @Component({
        selector: 'app-test',
        template: '',
        standalone: true,
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

      await app.whenStable()

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

      @Component({
        selector: 'app-test',
        template: '',
        standalone: true,
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

      // Initially disabled
      await vi.advanceTimersByTimeAsync(0)
      await app.whenStable()
      expect(query.status()).toBe('pending')
      expect(query.data()).toBeUndefined()
      expect(component.callCount).toBe(0)

      // Enable the query
      enabledSignal.set(true)
      fixture.detectChanges()

      await vi.advanceTimersByTimeAsync(0)
      await app.whenStable()
      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-1')
      expect(component.callCount).toBe(1)
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

      @Component({
        selector: 'app-test',
        template: '',
        standalone: true,
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

      // Invalidate the query
      queryClient.invalidateQueries({ queryKey: testKey })

      // Wait for the invalidation to trigger a refetch
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10)

      await app.whenStable()
      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-2')
      expect(component.callCount).toBe(2)
    })
  })
})
