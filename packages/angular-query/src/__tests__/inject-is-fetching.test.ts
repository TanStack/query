import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Component, input, inputBinding, signal } from '@angular/core'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  injectIsFetching,
  injectQuery,
  provideTanStackQuery,
} from '..'
import { provideAngularQueryChangeDetection } from './test-utils'

describe('injectIsFetching', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()

    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => queryClient),
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the number of fetching queries', async () => {
    const key = queryKey()

    @Component({
      template: `<div>fetching: {{ isFetching() }}</div>`,
    })
    class Page {
      readonly query = injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(100).then(() => 'Some data'),
      }))
      readonly isFetching = injectIsFetching()
    }

    const rendered = await render(Page)

    expect(rendered.getByText('fetching: 1')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(101)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('fetching: 0')).toBeInTheDocument()
  })

  it('should return a read-only signal', () => {
    const isFetching = TestBed.runInInjectionContext(() => injectIsFetching())

    expect(isFetching).not.toHaveProperty('set')
  })

  it('should be able to filter by queryKey', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    @Component({
      template: `<div>fetching: {{ isFetching() }}</div>`,
    })
    class Page {
      readonly query1 = injectQuery(() => ({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 'test1'),
      }))
      readonly query2 = injectQuery(() => ({
        queryKey: key2,
        queryFn: () => sleep(100).then(() => 'test2'),
      }))
      readonly isFetching = injectIsFetching(() => ({ queryKey: key1 }))
    }

    const rendered = await render(Page)

    await vi.advanceTimersByTimeAsync(0)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('fetching: 1')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('fetching: 0')).toBeInTheDocument()
  })

  it('should support signal reads in filter predicates', async () => {
    const key = queryKey()

    void queryClient.query({
      queryKey: key,
      queryFn: () => sleep(100).then(() => 'data'),
    })

    @Component({
      template: `<div>fetching: {{ isFetching() }}</div>`,
    })
    class Page {
      readonly includeQuery = input.required<boolean>()
      readonly isFetching = injectIsFetching(() => ({
        predicate: () => this.includeQuery(),
      }))
    }

    const subscribe = vi.spyOn(queryClient.getQueryCache(), 'subscribe')
    const includeQuery = signal(true)
    const rendered = await render(Page, {
      bindings: [inputBinding('includeQuery', includeQuery)],
    })

    expect(rendered.getByText('fetching: 1')).toBeInTheDocument()

    includeQuery.set(false)
    rendered.fixture.detectChanges()
    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('fetching: 0')).toBeInTheDocument()
  })

  describe('injection context', () => {
    it('should throw NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectIsFetching()
      }).toThrow(/NG0203(.*?)injectIsFetching/)
    })
  })
})
