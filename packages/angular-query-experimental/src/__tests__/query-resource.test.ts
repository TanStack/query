import { Component, provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  injectQuery,
  mutationResource,
  provideTanStackQuery,
  queryResource,
} from '..'

describe('queryResource', () => {
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

  it('config form: resolves and exposes the resource + query surface', async () => {
    const key = queryKey()

    @Component({
      template: `
        <div>status: {{ q.status() }}</div>
        <div>queryStatus: {{ q.queryStatus() }}</div>
        <div>data: {{ q.data() ?? 'none' }}</div>
        @if (q.hasValue()) {
          <div>value: {{ q.value() }}</div>
        }
        <div>isLoading: {{ q.isLoading() }}</div>
        <div>isSuccess: {{ q.isSuccess() }}</div>
      `,
    })
    class Page {
      readonly q = queryResource({
        queryKey: () => key,
        queryFn: () => sleep(10).then(() => 'result'),
      })
    }

    const rendered = await render(Page)
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('status: resolved')).toBeInTheDocument()
    expect(rendered.getByText('queryStatus: success')).toBeInTheDocument()
    expect(rendered.getByText('data: result')).toBeInTheDocument()
    expect(rendered.getByText('value: result')).toBeInTheDocument()
    expect(rendered.getByText('isLoading: false')).toBeInTheDocument()
    expect(rendered.getByText('isSuccess: true')).toBeInTheDocument()
  })

  it('options-function form resolves', async () => {
    const key = queryKey()

    @Component({
      template: `<div>data: {{ q.data() ?? 'none' }}</div>`,
    })
    class Page {
      readonly q = queryResource(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fn-form'),
      }))
    }

    const rendered = await render(Page)
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('data: fn-form')).toBeInTheDocument()
  })

  it('error state: data() is safe, hasValue() is false, value() throws', async () => {
    const key = queryKey()

    @Component({
      template: `
        <div>queryStatus: {{ q.queryStatus() }}</div>
        <div>data: {{ q.data() ?? 'none' }}</div>
        <div>hasValue: {{ q.hasValue() }}</div>
        <div>error: {{ q.error()?.message ?? 'none' }}</div>
      `,
    })
    class Page {
      readonly q = queryResource({
        queryKey: () => key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('boom'))),
        retry: false,
      })
    }

    const rendered = await render(Page)
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('queryStatus: error')).toBeInTheDocument()
    expect(rendered.getByText('data: none')).toBeInTheDocument()
    expect(rendered.getByText('hasValue: false')).toBeInTheDocument()
    expect(rendered.getByText('error: boom')).toBeInTheDocument()
    expect(() => rendered.fixture.componentInstance.q.value()).toThrow()
  })

  it('shares the cache with injectQuery (dedupes a single fetch)', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 'shared'))

    @Component({
      template: `
        <div>r: {{ r.data() ?? 'none' }}</div>
        <div>i: {{ i.data() ?? 'none' }}</div>
      `,
    })
    class Page {
      readonly r = queryResource({ queryKey: () => key, queryFn })
      readonly i = injectQuery(() => ({ queryKey: key, queryFn }))
    }

    const rendered = await render(Page)
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('r: shared')).toBeInTheDocument()
    expect(rendered.getByText('i: shared')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('set() writes through to the cache', async () => {
    const key = queryKey()

    @Component({
      template: `<div>data: {{ q.data() ?? 'none' }}</div>`,
    })
    class Page {
      readonly q = queryResource({
        queryKey: () => key,
        queryFn: () => sleep(10).then(() => 'a'),
      })
    }

    const rendered = await render(Page)
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('data: a')).toBeInTheDocument()

    rendered.fixture.componentInstance.q.set('b')
    rendered.fixture.detectChanges()

    expect(rendered.getByText('data: b')).toBeInTheDocument()
    expect(queryClient.getQueryData(key)).toBe('b')
  })
})

describe('mutationResource', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
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

  it('runs imperatively and exposes the result as a resource', async () => {
    @Component({
      template: `
        <div>mutationStatus: {{ m.mutationStatus() }}</div>
        <div>status: {{ m.status() }}</div>
        <div>data: {{ m.data() ?? 'none' }}</div>
      `,
    })
    class Page {
      readonly m = mutationResource({
        mutationFn: (title: string) => sleep(10).then(() => `saved:${title}`),
      })
    }

    const rendered = await render(Page)
    expect(rendered.getByText('mutationStatus: idle')).toBeInTheDocument()
    expect(rendered.getByText('status: idle')).toBeInTheDocument()

    rendered.fixture.componentInstance.m.mutate('todo')
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('mutationStatus: success')).toBeInTheDocument()
    expect(rendered.getByText('status: resolved')).toBeInTheDocument()
    expect(rendered.getByText('data: saved:todo')).toBeInTheDocument()
  })
})
