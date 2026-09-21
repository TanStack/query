import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Component,
  Injector,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  injectInfiniteQuery,
  provideTanStackQuery,
  skipToken,
} from '..'

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

  it('should reject and update signal', async () => {
    const key = queryKey()

    @Component({
      template: `
        <div>status: {{ query.status() }}</div>
        <div>pages: {{ query.data()?.pages?.join(', ') ?? 'none' }}</div>
        <div>error: {{ query.error()?.message ?? 'none' }}</div>
        <div>isError: {{ query.isError() }}</div>
        <div>failureCount: {{ query.failureCount() }}</div>
      `,
    })
    class Page {
      readonly query = injectInfiniteQuery(() => ({
        retry: false,
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
        initialPageParam: 0,
        getNextPageParam: () => 12,
      }))
    }

    const rendered = await render(Page)

    expect(rendered.getByText('status: pending')).toBeInTheDocument()
    expect(rendered.getByText('pages: none')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('status: error')).toBeInTheDocument()
    expect(rendered.getByText('pages: none')).toBeInTheDocument()
    expect(rendered.getByText('error: Some error')).toBeInTheDocument()
    expect(rendered.getByText('isError: true')).toBeInTheDocument()
    expect(rendered.getByText('failureCount: 1')).toBeInTheDocument()
  })

  it('should keep initialData visible alongside the error when a refetch fails', async () => {
    const key = queryKey()

    @Component({
      template: `
        <div>pages: {{ query.data().pages.join(', ') }}</div>
        <div>isError: {{ query.isError() }}</div>
      `,
    })
    class Page {
      readonly query = injectInfiniteQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
        initialData: { pages: [1], pageParams: [1] },
        getNextPageParam: (lastPage: number) => lastPage + 1,
        initialPageParam: 0,
        retry: false,
      }))
    }

    const rendered = await render(Page)

    expect(rendered.getByText('pages: 1')).toBeInTheDocument()
    expect(rendered.getByText('isError: false')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('pages: 1')).toBeInTheDocument()
    expect(rendered.getByText('isError: true')).toBeInTheDocument()
  })

  describe('skipToken', () => {
    it('should not fetch when queryFn is skipToken, and fetch once it is replaced', async () => {
      const key = queryKey()
      const queryFn = vi.fn(({ pageParam }: { pageParam: number }) =>
        sleep(10).then(() => `comments for 1 page ${pageParam}`),
      )

      @Component({
        template: `
          <div>status: {{ query.status() }}</div>
          <div>isFetching: {{ query.isFetching() }}</div>
          <div>pages: {{ query.data()?.pages?.join(', ') ?? 'none' }}</div>
        `,
      })
      class Page {
        postId = signal<string | undefined>(undefined)

        readonly query = injectInfiniteQuery(() => ({
          queryKey: key,
          queryFn: this.postId() != null ? queryFn : skipToken,
          initialPageParam: 0,
          getNextPageParam: () => 12,
        }))
      }

      const rendered = await render(Page)

      expect(rendered.getByText('status: pending')).toBeInTheDocument()
      expect(rendered.getByText('isFetching: false')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      expect(queryFn).not.toHaveBeenCalled()
      expect(rendered.getByText('status: pending')).toBeInTheDocument()
      expect(rendered.getByText('isFetching: false')).toBeInTheDocument()

      rendered.fixture.componentInstance.postId.set('1')
      rendered.fixture.detectChanges()
      expect(rendered.getByText('isFetching: true')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(rendered.getByText('status: success')).toBeInTheDocument()
      expect(
        rendered.getByText('pages: comments for 1 page 0'),
      ).toBeInTheDocument()
    })
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
