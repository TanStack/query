import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expectTypeOf, test, vi } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { sleep } from '@tanstack/query-test-utils'
import { QueryClient, injectInfiniteQuery, provideTanStackQuery } from '..'
import type { InfiniteData } from '@tanstack/query-core'

describe('injectInfiniteQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.useFakeTimers()
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

  describe('without initialData', () => {
    test('should narrow type after isSuccess', () => {
      const query = TestBed.runInInjectionContext(() => {
        return injectInfiniteQuery(() => ({
          queryKey: ['infiniteQuery'],
          queryFn: ({ pageParam }) =>
            sleep(0).then(() => 'data on page ' + pageParam),
          initialPageParam: 0,
          getNextPageParam: () => 12,
        }))
      })

      if (query.isSuccess()) {
        const data = query.data()
        expectTypeOf(data).toEqualTypeOf<InfiniteData<string, unknown>>()
      }
    })

    test('should narrow type after isPending', () => {
      const query = TestBed.runInInjectionContext(() => {
        return injectInfiniteQuery(() => ({
          queryKey: ['infiniteQuery'],
          queryFn: ({ pageParam }) =>
            sleep(0).then(() => 'data on page ' + pageParam),
          initialPageParam: 0,
          getNextPageParam: () => 12,
        }))
      })

      if (query.isPending()) {
        const data = query.data()
        expectTypeOf(data).toEqualTypeOf<undefined>()
      }
    })

    test('should narrow type after isError', () => {
      const query = TestBed.runInInjectionContext(() => {
        return injectInfiniteQuery(() => ({
          queryKey: ['infiniteQuery'],
          queryFn: ({ pageParam }) =>
            sleep(0).then(() => 'data on page ' + pageParam),
          initialPageParam: 0,
          getNextPageParam: () => 12,
        }))
      })

      if (query.isError()) {
        const error = query.error()
        expectTypeOf(error).toEqualTypeOf<Error>()
      }
    })
  })

  describe('with initialData', () => {
    test('should narrow type after isSuccess', () => {
      const query = TestBed.runInInjectionContext(() => {
        return injectInfiniteQuery(() => ({
          queryKey: ['infiniteQuery'],
          queryFn: ({ pageParam }) =>
            sleep(0).then(() => 'data on page ' + pageParam),
          initialPageParam: 0,
          getNextPageParam: () => 12,
          initialData: {
            pageParams: [0, 1],
            pages: ['page 0 data', 'page 1 data'],
          },
        }))
      })

      if (query.isSuccess()) {
        const data = query.data()
        expectTypeOf(data).toEqualTypeOf<InfiniteData<string, unknown>>()
      }
    })

    test('should narrow type after isPending', () => {
      const query = TestBed.runInInjectionContext(() => {
        return injectInfiniteQuery(() => ({
          queryKey: ['infiniteQuery'],
          queryFn: ({ pageParam }) =>
            sleep(0).then(() => 'data on page ' + pageParam),
          initialPageParam: 0,
          getNextPageParam: () => 12,
          initialData: {
            pageParams: [0, 1],
            pages: ['page 0 data', 'page 1 data'],
          },
        }))
      })

      if (query.isPending()) {
        const data = query.data()
        expectTypeOf(data).toEqualTypeOf<InfiniteData<string, unknown>>()
      }
    })

    test('should narrow type after isError', () => {
      const query = TestBed.runInInjectionContext(() => {
        return injectInfiniteQuery(() => ({
          queryKey: ['infiniteQuery'],
          queryFn: ({ pageParam }) =>
            sleep(0).then(() => 'data on page ' + pageParam),
          initialPageParam: 0,
          getNextPageParam: () => 12,
          initialData: {
            pageParams: [0, 1],
            pages: ['page 0 data', 'page 1 data'],
          },
        }))
      })

      if (query.isError()) {
        const error = query.error()
        expectTypeOf(error).toEqualTypeOf<Error>()
      }
    })
  })
})
