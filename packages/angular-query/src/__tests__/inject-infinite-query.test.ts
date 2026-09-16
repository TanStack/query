import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { sleep } from '@tanstack/query-test-utils'
import { QueryClient, injectInfiniteQuery, skipToken } from '..'
import { expectSignals, setupTanStackQueryTestBed } from './test-utils'

describe('injectInfiniteQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.useFakeTimers()
    setupTanStackQueryTestBed(queryClient)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each(['refetch', 'fetchNextPage', 'fetchPreviousPage'] as const)(
    'applies current infinite-query options before %s',
    async (method) => {
      vi.useRealTimers()
      const version = signal('old')
      const query = TestBed.runInInjectionContext(() =>
        injectInfiniteQuery(() => {
          const current = version()
          return {
            queryKey: ['infinite'],
            enabled: false,
            initialPageParam: 0,
            initialData: { pages: ['initial'], pageParams: [0] },
            getNextPageParam: () => 1,
            getPreviousPageParam: () => -1,
            queryFn: async () => current,
          }
        }),
      )
      query.data()
      const execute = query[method]
      version.set('new')
      const result = await execute()
      expect(result.data?.pages).toContain('new')
      expect(result.data?.pages).not.toContain('old')
    },
  )

  it('should properly execute infinite query', async () => {
    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      query = injectInfiniteQuery(() => ({
        queryKey: ['infiniteQuery'],
        queryFn: ({ pageParam }) =>
          sleep(10).then(() => 'data on page ' + pageParam),
        initialPageParam: 0,
        getNextPageParam: () => 12,
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    const query = fixture.componentInstance.query

    expectSignals(query, {
      data: undefined,
      status: 'pending',
    })

    await vi.advanceTimersByTimeAsync(11)

    expectSignals(query, {
      data: {
        pageParams: [0],
        pages: ['data on page 0'],
      },
      status: 'success',
    })

    void query.fetchNextPage()

    await vi.advanceTimersByTimeAsync(11)

    expectSignals(query, {
      data: {
        pageParams: [0, 12],
        pages: ['data on page 0', 'data on page 12'],
      },
      status: 'success',
    })
  })

  it('should keep initialData visible alongside the error when a refetch fails', async () => {
    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      query = injectInfiniteQuery(() => ({
        queryKey: ['infiniteInitialDataError'],
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
        initialData: { pages: [1], pageParams: [1] },
        getNextPageParam: (lastPage: number) => lastPage + 1,
        initialPageParam: 0,
        retry: false,
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    const query = fixture.componentInstance.query

    expect(query.data()?.pages).toEqual([1])
    expect(query.isError()).toBe(false)
    expect(query.status()).toBe('success')

    await vi.advanceTimersByTimeAsync(11)
    fixture.detectChanges()

    expect(query.data()?.pages).toEqual([1])
    expect(query.isError()).toBe(true)
    expect(query.status()).toBe('error')
  })

  it('should not fetch when queryFn is skipToken, and fetch once it is replaced', async () => {
    const queryFn = vi.fn(({ pageParam }: { pageParam: number }) =>
      sleep(10).then(() => `comments for 1 page ${pageParam}`),
    )
    const postId = signal<string | undefined>(undefined)

    @Component({
      selector: 'app-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      query = injectInfiniteQuery(() => ({
        queryKey: ['skipTokenInfinite'],
        queryFn: postId() != null ? queryFn : skipToken,
        initialPageParam: 0,
        getNextPageParam: () => 12,
      }))
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()
    const query = fixture.componentInstance.query

    expect(query.status()).toBe('pending')
    expect(query.isFetching()).toBe(false)

    await vi.advanceTimersByTimeAsync(11)
    fixture.detectChanges()
    expect(queryFn).not.toHaveBeenCalled()
    expect(query.status()).toBe('pending')
    expect(query.isFetching()).toBe(false)

    postId.set('1')
    fixture.detectChanges()
    expect(query.isFetching()).toBe(true)

    await vi.advanceTimersByTimeAsync(11)
    fixture.detectChanges()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(query.status()).toBe('success')
    expect(query.data()?.pages).toEqual(['comments for 1 page 0'])
  })

  describe('injection context', () => {
    it('throws NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectInfiniteQuery(() => ({
          queryKey: ['injectionContextError'],
          queryFn: ({ pageParam }) =>
            sleep(0).then(() => 'data on page ' + pageParam),
          initialPageParam: 0,
          getNextPageParam: () => 12,
        }))
      }).toThrowError(/NG0203(.*?)injectInfiniteQuery/)
    })
  })
})
