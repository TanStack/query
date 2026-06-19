import { Component, provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  infiniteQueryResource,
  provideTanStackQuery,
} from '..'

// Ported from angular-resource-query: infinite-query.spec.ts, infinite-bidirectional.spec.ts.
// Unlike the source library, paging here is driven by TanStack's InfiniteQueryObserver
// (fetchNextPage / fetchPreviousPage come straight off the result), and the data is the
// `InfiniteData` shape (`{ pages, pageParams }`).
interface Page {
  page: number
  hasMore: boolean
}

const makePage = (page: number): Page => ({ page, hasMore: page < 3 })

describe('infiniteQueryResource', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({ queryCache: new QueryCache() })
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

  it('loads the first page and exposes hasNextPage', async () => {
    const key = queryKey()

    @Component({
      template: `<div>pages: {{ feed.data()?.pages?.length ?? 0 }}</div>`,
    })
    class Page1 {
      readonly feed = infiniteQueryResource({
        queryKey: () => key,
        queryFn: ({ pageParam }) => sleep(10).then(() => makePage(pageParam)),
        initialPageParam: 1,
        getNextPageParam: (last: Page) =>
          last.hasMore ? last.page + 1 : undefined,
      })
    }

    const rendered = await render(Page1)
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    const feed = rendered.fixture.componentInstance.feed
    expect(feed.data()?.pages.length).toBe(1)
    expect(feed.data()?.pages[0]?.page).toBe(1)
    expect(feed.hasNextPage()).toBe(true)
  })

  it('fetchNextPage appends pages until getNextPageParam returns undefined', async () => {
    const key = queryKey()

    @Component({
      template: `<div>pages: {{ feed.data()?.pages?.length ?? 0 }}</div>`,
    })
    class Page2 {
      readonly feed = infiniteQueryResource({
        queryKey: () => key,
        queryFn: ({ pageParam }) => sleep(10).then(() => makePage(pageParam)),
        initialPageParam: 1,
        getNextPageParam: (last: Page) =>
          last.hasMore ? last.page + 1 : undefined,
      })
    }

    const rendered = await render(Page2)
    await vi.advanceTimersByTimeAsync(11)
    const feed = rendered.fixture.componentInstance.feed

    feed.fetchNextPage()
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(feed.data()?.pages.length).toBe(2)
    expect(feed.hasNextPage()).toBe(true)

    feed.fetchNextPage()
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(feed.data()?.pages.map((p) => p.page)).toEqual([1, 2, 3])
    expect(feed.hasNextPage()).toBe(false)
  })

  it('respects maxPages by dropping the oldest page', async () => {
    const key = queryKey()

    @Component({
      template: `<div>pages: {{ feed.data()?.pages?.length ?? 0 }}</div>`,
    })
    class Page3 {
      readonly feed = infiniteQueryResource({
        queryKey: () => key,
        queryFn: ({ pageParam }) => sleep(10).then(() => makePage(pageParam)),
        initialPageParam: 1,
        getNextPageParam: (last: Page) =>
          last.hasMore ? last.page + 1 : undefined,
        maxPages: 2,
      })
    }

    const rendered = await render(Page3)
    await vi.advanceTimersByTimeAsync(11)
    const feed = rendered.fixture.componentInstance.feed

    feed.fetchNextPage()
    await vi.advanceTimersByTimeAsync(11)
    feed.fetchNextPage()
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(feed.data()?.pages.length).toBe(2)
    expect(feed.data()?.pages.map((p) => p.page)).toEqual([2, 3])
  })

  it('prepends pages with fetchPreviousPage (bi-directional)', async () => {
    const key = queryKey()

    @Component({
      template: `<div>pages: {{ feed.data()?.pages?.length ?? 0 }}</div>`,
    })
    class PageBidi {
      readonly feed = infiniteQueryResource({
        queryKey: () => key,
        queryFn: ({ pageParam }) =>
          sleep(10).then(() => ({ page: pageParam })),
        initialPageParam: 5,
        getNextPageParam: (last: { page: number }) =>
          last.page < 7 ? last.page + 1 : undefined,
        getPreviousPageParam: (first: { page: number }) =>
          first.page > 1 ? first.page - 1 : undefined,
      })
    }

    const rendered = await render(PageBidi)
    await vi.advanceTimersByTimeAsync(11)
    const feed = rendered.fixture.componentInstance.feed
    rendered.fixture.detectChanges()
    expect(feed.data()?.pages.map((p) => p.page)).toEqual([5])
    expect(feed.hasPreviousPage()).toBe(true)
    expect(feed.hasNextPage()).toBe(true)

    feed.fetchPreviousPage()
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(feed.data()?.pages.map((p) => p.page)).toEqual([4, 5])

    feed.fetchNextPage()
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(feed.data()?.pages.map((p) => p.page)).toEqual([4, 5, 6])
  })
})
