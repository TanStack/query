import { computed, signal } from '@angular/core'
import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing'
import { QueryClient } from '@tanstack/query-core'
import { expect, vi } from 'vitest'
import { createQuery } from '../createQuery'
import { provideAngularQuery } from '../providers'
import {
  delayedFetcher,
  getSimpleFetcherWithReturnData,
  rejectFetcher,
  simpleFetcher,
} from './test-utils'

describe('CreateQuery', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAngularQuery(new QueryClient())],
    })
  })

  it('should return pending status initially', fakeAsync(() => {
    const query = TestBed.runInInjectionContext(() => {
      return createQuery(signal({ queryKey: ['key1'], queryFn: simpleFetcher }))
    })

    expect(query()).toMatchObject({
      status: 'pending',
      isPending: true,
      isFetching: true,
      isStale: true,
    })

    flush()
  }))

  it('should resolve to success and update signal: createQuery', fakeAsync(() => {
    const query = TestBed.runInInjectionContext(() => {
      return createQuery(
        signal({
          queryKey: ['key2'],
          queryFn: getSimpleFetcherWithReturnData('result2'),
        }),
      )
    })

    flush()

    expect(query()).toMatchObject({
      status: 'success',
      data: 'result2',
      isPending: false,
      isFetching: false,
      isFetched: true,
      isSuccess: true,
    })
  }))

  it('should reject and update signal', fakeAsync(() => {
    const query = TestBed.runInInjectionContext(() => {
      return createQuery(
        signal({
          retry: false,
          queryKey: ['key3'],
          queryFn: rejectFetcher,
        }),
      )
    })

    flush()

    expect(query()).toMatchObject({
      status: 'error',
      data: undefined,
      error: { message: 'Some error' },
      isPending: false,
      isFetching: false,
      isFetched: true,
      isError: true,
      failureCount: 1,
      failureReason: { message: 'Some error' },
    })
  }))

  it('should update query on options signal change', fakeAsync(() => {
    const options = signal({
      queryKey: ['key6', 'key7'],
      queryFn: simpleFetcher,
    })

    const query = TestBed.runInInjectionContext(() => {
      return createQuery(options)
    })
    flush()

    expect(query()).toMatchObject({
      status: 'success',
    })

    const spy = vi.fn()

    options.set({
      queryKey: ['key8'],
      queryFn: spy,
    })
    TestBed.flushEffects()

    expect(spy).toHaveBeenCalledTimes(1)

    flush()
  }))

  it('should only run query once enabled is set to true', fakeAsync(() => {
    const spy = vi.fn(simpleFetcher)
    const enabled = signal(false)
    const options = computed(() => ({
      queryKey: ['key9'],
      queryFn: spy,
      enabled: enabled(),
    }))

    const query = TestBed.runInInjectionContext(() => {
      return createQuery(options)
    })

    expect(spy).not.toHaveBeenCalled()
    expect(query()).toMatchObject({
      status: 'pending',
    })

    enabled.set(true)
    TestBed.flushEffects()
    flush()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(query()).toMatchObject({
      status: 'success',
    })
  }))

  it('should properly execute dependant queries', fakeAsync(() => {
    const query1 = TestBed.runInInjectionContext(() => {
      return createQuery(
        signal({
          queryKey: ['dependant1'],
          queryFn: simpleFetcher,
        }),
      )
    })

    const enabled = computed(() => !!query1().data)

    const dependentQueryFn = vi.fn().mockImplementation(delayedFetcher(1000))

    const query2 = TestBed.runInInjectionContext(() => {
      return createQuery(
        computed(() => ({
          queryKey: ['dependant2'],
          queryFn: dependentQueryFn,
          enabled: enabled(),
        })),
      )
    })

    expect(query1().data).toStrictEqual(undefined)
    expect(query2().fetchStatus).toStrictEqual('idle')
    expect(dependentQueryFn).not.toHaveBeenCalled()

    tick()
    TestBed.flushEffects()

    expect(query1().data).toStrictEqual('Some data')
    // expect(query2().fetchStatus).toStrictEqual('fetching') // TODO: is this working correctly?

    flush()

    expect(query2().fetchStatus).toStrictEqual('idle')
    expect(query2().status).toStrictEqual('success')
    expect(dependentQueryFn).toHaveBeenCalledTimes(1)
    expect(dependentQueryFn).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['dependant2'] }),
    )
  }))

  it('should use the current value for the queryKey when refetch is called', fakeAsync(() => {
    const fetchFn = vi.fn()
    const keySignal = signal('key11')

    const query = TestBed.runInInjectionContext(() => {
      return createQuery(
        computed(() => ({
          queryKey: ['key10', keySignal()],
          queryFn: fetchFn,
          enabled: false,
        })),
      )
    })

    expect(fetchFn).not.toHaveBeenCalled()

    query()
      .refetch()
      .then(() => {
        expect(fetchFn).toHaveBeenCalledTimes(1)
        expect(fetchFn).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['key10', 'key11'],
          }),
        )
      })

    flush()

    keySignal.set('key12')

    TestBed.flushEffects()

    query()
      .refetch()
      .then(() => {
        expect(fetchFn).toHaveBeenCalledTimes(2)
        expect(fetchFn).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['key10', 'key12'],
          }),
        )
      })

    flush()
  }))

  it('should set state to error when queryFn returns reject promise', fakeAsync(() => {
    const query = TestBed.runInInjectionContext(() => {
      return createQuery(
        signal({
          retry: false,
          queryKey: ['key13'],
          queryFn: rejectFetcher,
        }),
      )
    })

    expect(query().status).toBe('pending')

    flush()

    expect(query().status).toBe('error')
  }))

  it('should not update signal when notifyOnChangeProps is set without the changed property being in notifyOnChangeProps', fakeAsync(() => {
    const query = TestBed.runInInjectionContext(() => {
      return createQuery(
        signal({
          queryKey: ['key14'],
          queryFn: simpleFetcher,
          notifyOnChangeProps: 'all',
        }),
      )
    })

    flush()

    expect(query().status).toBe('success')
  }))

  it('should allow passing a different queryClient', fakeAsync(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          queryFn: simpleFetcher,
        },
      },
    })

    const query = TestBed.runInInjectionContext(() => {
      return createQuery(
        signal({
          queryKey: ['key15'],
        }),
        queryClient,
      )
    })

    flush()

    expect(query().data).toBe('Some data')
  }))
})
