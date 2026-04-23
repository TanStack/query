import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Component,
  Injector,
  provideZonelessChangeDetection,
} from '@angular/core'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, injectInfiniteQuery, provideTanStackQuery } from '..'

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

  it('should properly execute infinite query', async () => {
    const key = queryKey()

    @Component({
      template: `
        <div>status: {{ query.status() }}</div>
        <div>pages: {{ query.data()?.pages?.join(', ') ?? 'none' }}</div>
      `,
    })
    class Page {
      readonly query = injectInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          sleep(10).then(() => 'data on page ' + pageParam),
        initialPageParam: 0,
        getNextPageParam: () => 12,
      }))
    }

    const rendered = await render(Page)

    expect(rendered.getByText('status: pending')).toBeInTheDocument()
    expect(rendered.getByText('pages: none')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('status: success')).toBeInTheDocument()
    expect(rendered.getByText('pages: data on page 0')).toBeInTheDocument()

    rendered.fixture.componentInstance.query.fetchNextPage()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('status: success')).toBeInTheDocument()
    expect(
      rendered.getByText('pages: data on page 0, data on page 12'),
    ).toBeInTheDocument()
  })

  describe('injection context', () => {
    it('should throw NG0203 with descriptive error outside injection context', () => {
      const key = queryKey()
      expect(() => {
        injectInfiniteQuery(() => ({
          queryKey: key,
          queryFn: ({ pageParam }) =>
            sleep(0).then(() => 'data on page ' + pageParam),
          initialPageParam: 0,
          getNextPageParam: () => 12,
        }))
      }).toThrow(/NG0203(.*?)injectInfiniteQuery/)
    })

    it('should be usable outside injection context when passing an injector', () => {
      const key = queryKey()
      const query = injectInfiniteQuery(
        () => ({
          queryKey: key,
          queryFn: ({ pageParam }) =>
            sleep(0).then(() => 'data on page ' + pageParam),
          initialPageParam: 0,
          getNextPageParam: () => 12,
        }),
        {
          injector: TestBed.inject(Injector),
        },
      )

      expect(query.status()).toBe('pending')
    })
  })
})
