import {
  Component,
  Injectable,
  Injector,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core'
import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing'
import { describe, expect, vi } from 'vitest'
import { QueryCache, QueryClient, injectQuery, provideTanStackQuery } from '..'
import {
  delayedFetcher,
  getSimpleFetcherWithReturnData,
  queryKey,
  rejectFetcher,
  setSignalInputs,
  simpleFetcher,
} from './test-utils'
import type { CreateQueryOptions, OmitKeyof, QueryFunction } from '..'

describe('injectQuery', () => {
  let queryCache: QueryCache
  let queryClient: QueryClient
  beforeEach(() => {
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
    TestBed.configureTestingModule({
      providers: [provideTanStackQuery(queryClient)],
    })
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

    const getMyDataArrayKey: QueryFunction<MyData, MyQueryKey> = async ({
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

    TestBed.runInInjectionContext(() =>
      effect(() => {
        if (fromPromiseAnyQueryFn.isSuccess()) {
          expect(fromMyDataArrayKeyQueryFn.data()).toBe(142)
        }
      }),
    )

    const getMyDataStringKey: QueryFunction<MyData, ['1']> = async (
      context,
    ) => {
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

    // it should handle query-functions that return Promise<any>
    const fromPromiseAnyQueryFn = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        queryFn: () => fetch('return Promise<any>').then((resp) => resp.json()),
      })),
    )
    expectTypeOf(fromPromiseAnyQueryFn.data()).toEqualTypeOf<any | undefined>()

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
      createWrappedQuery([''], async () => '1'),
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
      createWrappedFuncStyleQuery([''], async () => true),
    )
    expectTypeOf(fromWrappedFuncStyleQuery.data()).toEqualTypeOf<
      boolean | undefined
    >()
  })

  test('should return pending status initially', fakeAsync(() => {
    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: ['key1'],
        queryFn: simpleFetcher,
      }))
    })

    expect(query.status()).toBe('pending')
    expect(query.isPending()).toBe(true)
    expect(query.isFetching()).toBe(true)
    expect(query.isStale()).toBe(true)
    expect(query.isFetched()).toBe(false)
  }))

  test('should resolve to success and update signal: injectQuery()', fakeAsync(() => {
    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: ['key2'],
        queryFn: getSimpleFetcherWithReturnData('result2'),
      }))
    })

    tick()

    expect(query.status()).toBe('success')
    expect(query.data()).toBe('result2')
    expect(query.isPending()).toBe(false)
    expect(query.isFetching()).toBe(false)
    expect(query.isFetched()).toBe(true)
    expect(query.isSuccess()).toBe(true)
  }))

  test('should reject and update signal', fakeAsync(() => {
    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        retry: false,
        queryKey: ['key3'],
        queryFn: rejectFetcher,
      }))
    })

    tick()

    expect(query.status()).toBe('error')
    expect(query.data()).toBe(undefined)
    expect(query.error()).toMatchObject({ message: 'Some error' })
    expect(query.isPending()).toBe(false)
    expect(query.isFetching()).toBe(false)
    expect(query.isError()).toBe(true)
    expect(query.failureCount()).toBe(1)
    expect(query.failureReason()).toMatchObject({ message: 'Some error' })
  }))

  test('should update query on options contained signal change', fakeAsync(() => {
    const key = signal(['key6', 'key7'])
    const spy = vi.fn(simpleFetcher)

    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: key(),
        queryFn: spy,
      }))
    })
    tick()
    expect(spy).toHaveBeenCalledTimes(1)

    expect(query.status()).toBe('success')

    key.set(['key8'])
    TestBed.flushEffects()

    expect(spy).toHaveBeenCalledTimes(2)
    // should call queryFn with context containing the new queryKey
    expect(spy).toBeCalledWith({
      meta: undefined,
      queryKey: ['key8'],
      signal: expect.anything(),
    })
  }))

  test('should only run query once enabled signal is set to true', fakeAsync(() => {
    const spy = vi.fn(simpleFetcher)
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
    tick()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(query.status()).toBe('success')
  }))

  test('should properly execute dependant queries', fakeAsync(() => {
    const query1 = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: ['dependant1'],
        queryFn: simpleFetcher,
      }))
    })

    const dependentQueryFn = vi.fn().mockImplementation(delayedFetcher(1000))

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

    tick()

    expect(query1.data()).toStrictEqual('Some data')
    expect(query2.fetchStatus()).toStrictEqual('fetching')

    flush()

    expect(query2.fetchStatus()).toStrictEqual('idle')
    expect(query2.status()).toStrictEqual('success')
    expect(dependentQueryFn).toHaveBeenCalledTimes(1)
    expect(dependentQueryFn).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['dependant2'] }),
    )
  }))

  test('should use the current value for the queryKey when refetch is called', fakeAsync(() => {
    const fetchFn = vi.fn(simpleFetcher)
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

    tick()

    keySignal.set('key12')

    TestBed.flushEffects()

    query.refetch().then(() => {
      expect(fetchFn).toHaveBeenCalledTimes(2)
      expect(fetchFn).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['key10', 'key12'],
        }),
      )
    })
  }))

  describe('throwOnError', () => {
    test('should evaluate throwOnError when query is expected to throw', fakeAsync(() => {
      const boundaryFn = vi.fn()
      TestBed.runInInjectionContext(() => {
        return injectQuery(() => ({
          queryKey: ['key12'],
          queryFn: rejectFetcher,
          throwOnError: boundaryFn,
        }))
      })

      flush()

      expect(boundaryFn).toHaveBeenCalledTimes(1)
      expect(boundaryFn).toHaveBeenCalledWith(
        Error('Some error'),
        expect.objectContaining({
          state: expect.objectContaining({ status: 'error' }),
        }),
      )
    }))

    test('should throw when throwOnError is true', fakeAsync(() => {
      TestBed.runInInjectionContext(() => {
        return injectQuery(() => ({
          queryKey: ['key13'],
          queryFn: rejectFetcher,
          throwOnError: true,
        }))
      })

      expect(() => {
        flush()
      }).toThrowError('Some error')
    }))

    test('should throw when throwOnError function returns true', fakeAsync(() => {
      TestBed.runInInjectionContext(() => {
        return injectQuery(() => ({
          queryKey: ['key14'],
          queryFn: rejectFetcher,
          throwOnError: () => true,
        }))
      })

      expect(() => {
        flush()
      }).toThrowError('Some error')
    }))
  })

  test('should set state to error when queryFn returns reject promise', fakeAsync(() => {
    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        retry: false,
        queryKey: ['key15'],
        queryFn: rejectFetcher,
      }))
    })

    expect(query.status()).toBe('pending')

    tick()

    expect(query.status()).toBe('error')
  }))

  test('should render with required signal inputs', fakeAsync(() => {
    @Component({
      selector: 'app-fake',
      template: `{{ query.data() }}`,
      standalone: true,
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
    tick()

    expect(fixture.componentInstance.query.data()).toEqual(
      'signal-input-required-test',
    )
  }))

  test('should run optionsFn in injection context', fakeAsync(async () => {
    @Injectable()
    class FakeService {
      getData(name: string) {
        return Promise.resolve(name)
      }
    }

    @Component({
      selector: 'app-fake',
      template: `{{ query.data() }}`,
      standalone: true,
      providers: [FakeService],
    })
    class FakeComponent {
      name = signal<string>('test name')

      query = injectQuery(() => {
        const service = inject(FakeService)

        return {
          queryKey: ['fake', this.name()],
          queryFn: () => {
            return service.getData(this.name())
          },
        }
      })
    }

    const fixture = TestBed.createComponent(FakeComponent)
    fixture.detectChanges()
    tick()

    expect(fixture.componentInstance.query.data()).toEqual('test name')

    fixture.componentInstance.name.set('test name 2')
    fixture.detectChanges()
    tick()

    expect(fixture.componentInstance.query.data()).toEqual('test name 2')
  }))

  test('should run optionsFn in injection context and allow passing injector to queryFn', fakeAsync(async () => {
    @Injectable()
    class FakeService {
      getData(name: string) {
        return Promise.resolve(name)
      }
    }

    @Component({
      selector: 'app-fake',
      template: `{{ query.data() }}`,
      standalone: true,
      providers: [FakeService],
    })
    class FakeComponent {
      name = signal<string>('test name')

      query = injectQuery(() => {
        const injector = inject(Injector)

        return {
          queryKey: ['fake', this.name()],
          queryFn: () => {
            const service = injector.get(FakeService)
            return service.getData(this.name())
          },
        }
      })
    }

    const fixture = TestBed.createComponent(FakeComponent)
    fixture.detectChanges()
    tick()

    expect(fixture.componentInstance.query.data()).toEqual('test name')

    fixture.componentInstance.name.set('test name 2')
    fixture.detectChanges()
    tick()

    expect(fixture.componentInstance.query.data()).toEqual('test name 2')
  }))

  describe('injection context', () => {
    test('throws NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectQuery(() => ({
          queryKey: ['injectionContextError'],
          queryFn: simpleFetcher,
        }))
      }).toThrowError(/NG0203(.*?)injectQuery/)
    })

    test('can be used outside injection context when passing an injector', () => {
      const query = injectQuery(
        () => ({
          queryKey: ['manualInjector'],
          queryFn: simpleFetcher,
        }),
        TestBed.inject(Injector),
      )

      expect(query.status()).toBe('pending')
    })
  })
})
