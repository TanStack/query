import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Component,
  effect,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, provideIsRestoring, provideTanStackQuery } from '..'
import { injectQueries } from '../inject-queries'

describe('injectQueries', () => {
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

  it('should return the correct states', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: Array<Array<Record<string, any>>> = []

    @Component({
      template: `
        <div>
          <div>
            data1: {{ result()[0].data() ?? 'null' }}, data2:
            {{ result()[1].data() ?? 'null' }}
          </div>
        </div>
      `,
    })
    class Page {
      result = injectQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 1),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(100).then(() => 2),
          },
        ],
      }))

      constructor() {
        effect(() => {
          const snapshot = this.result().map((q) => ({ data: q.data() }))
          results.push(snapshot)
        })
      }
    }

    const rendered = await render(Page)

    await vi.advanceTimersByTimeAsync(101)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('data1: 1, data2: 2')).toBeInTheDocument()

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject([{ data: undefined }, { data: undefined }])
    expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
    expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  it('should return the combined result when combine is provided', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: Array<Record<string, any>> = []

    @Component({
      template: `
        <div>data: {{ combined().data.join(',') }}</div>
        <div>isPending: {{ combined().isPending }}</div>
      `,
    })
    class Page {
      combined = injectQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 1),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(10).then(() => 2),
          },
        ],
        combine: (queries) => ({
          data: queries.map((q) => q.data),
          isPending: queries.some((q) => q.isPending),
        }),
      }))

      constructor() {
        effect(() => {
          results.push({ ...this.combined() })
        })
      }
    }

    const rendered = await render(Page)

    expect(rendered.getByText('data: ,')).toBeInTheDocument()
    expect(rendered.getByText('isPending: true')).toBeInTheDocument()
    expect(results[0]).toMatchObject({
      data: [undefined, undefined],
      isPending: true,
    })

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('data: 1,2')).toBeInTheDocument()
    expect(rendered.getByText('isPending: false')).toBeInTheDocument()
    expect(results[results.length - 1]).toMatchObject({
      data: [1, 2],
      isPending: false,
    })
    expect(results.length).toBeGreaterThanOrEqual(2)
  })

  describe('isRestoring', () => {
    it('should not fetch for the duration of the restoring period when isRestoring is true', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = vi.fn().mockImplementation(() => sleep(10).then(() => 1))
      const queryFn2 = vi.fn().mockImplementation(() => sleep(10).then(() => 2))

      TestBed.configureTestingModule({
        providers: [provideIsRestoring(signal(true).asReadonly())],
      })

      const queries = TestBed.runInInjectionContext(() =>
        injectQueries(() => ({
          queries: [
            { queryKey: key1, queryFn: queryFn1 },
            { queryKey: key2, queryFn: queryFn2 },
          ],
        })),
      )

      await vi.advanceTimersByTimeAsync(0)
      expect(queries()[0].status()).toBe('pending')
      expect(queries()[0].fetchStatus()).toBe('idle')
      expect(queries()[0].data()).toBeUndefined()
      expect(queries()[1].status()).toBe('pending')
      expect(queries()[1].fetchStatus()).toBe('idle')
      expect(queries()[1].data()).toBeUndefined()
      expect(queryFn1).toHaveBeenCalledTimes(0)
      expect(queryFn2).toHaveBeenCalledTimes(0)

      await vi.advanceTimersByTimeAsync(11)
      expect(queries()[0].status()).toBe('pending')
      expect(queries()[0].fetchStatus()).toBe('idle')
      expect(queries()[0].data()).toBeUndefined()
      expect(queries()[1].status()).toBe('pending')
      expect(queries()[1].fetchStatus()).toBe('idle')
      expect(queries()[1].data()).toBeUndefined()
      expect(queryFn1).toHaveBeenCalledTimes(0)
      expect(queryFn2).toHaveBeenCalledTimes(0)
    })
  })
})
