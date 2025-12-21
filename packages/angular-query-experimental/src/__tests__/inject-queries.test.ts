import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/angular'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
} from '@angular/core'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient } from '..'
import { injectQueries } from '../inject-queries'
import { setupTanStackQueryTestBed } from './test-utils'

let queryClient: QueryClient

beforeEach(() => {
  queryClient = new QueryClient()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  setupTanStackQueryTestBed(queryClient)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('injectQueries', () => {
  it('should return the correct states', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: Array<Array<Record<string, any>>> = []

    @Component({
      template: `
        <div>
          <div>
            data1: {{ queries()[0].data() ?? 'null' }}, data2:
            {{ queries()[1].data() ?? 'null' }}
          </div>
        </div>
      `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      toString(val: any) {
        return String(val)
      }
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              await new Promise((r) => setTimeout(r, 10))
              return 1
            },
          },
          {
            queryKey: key2,
            queryFn: async () => {
              await new Promise((r) => setTimeout(r, 100))
              return 2
            },
          },
        ],
      }))

      _pushResults = effect(() => {
        const snapshot = this.queries().map((q) => ({ data: q.data() }))
        results.push(snapshot)
      })
    }

    const rendered = await render(Page)

    await rendered.findByText('data1: 1, data2: 2')

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject([{ data: undefined }, { data: undefined }])
    expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
    expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  it('should support combining results', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    let count = 0

    const results: Array<{ data: string; refetch: () => void }> = []

    @Component({
      template: ` <div>data: {{ queries().data }}</div> `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              await new Promise((r) => setTimeout(r, 10))
              count++
              return count
            },
          },
          {
            queryKey: key2,
            queryFn: async () => {
              await new Promise((r) => setTimeout(r, 100))
              count++
              return count
            },
          },
        ],
        combine: (results) => {
          return {
            refetch: () => results.forEach((r) => r.refetch()),
            data: results.map((r) => r.data).join(','),
          }
        },
      }))

      _pushResults = effect(() => {
        results.push(this.queries())
      })
    }

    const rendered = await render(Page)
    const instance = rendered.fixture.componentInstance
    await rendered.findByText('data: 1,2')
    expect(instance.queries().data).toBe('1,2')

    instance.queries().refetch()

    await rendered.findByText('data: 3,4')
    expect(instance.queries().data).toBe('3,4')

    expect(results).toHaveLength(5)
    expect(results[0]).toMatchObject({
      data: ',',
      refetch: expect.any(Function),
    })
    expect(results[1]).toMatchObject({
      data: '1,',
      refetch: expect.any(Function),
    })
    expect(results[2]).toMatchObject({
      data: '1,2',
      refetch: expect.any(Function),
    })
    expect(results[3]).toMatchObject({
      data: '3,2',
      refetch: expect.any(Function),
    })
    expect(results[4]).toMatchObject({
      data: '3,4',
      refetch: expect.any(Function),
    })
  })

  it('should support changes on the queries array', async () => {
    const results: Array<Array<Record<string, any>>> = []

    @Component({
      template: ` <div>data: {{ mapped() }}</div> `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: queries().map((q) => ({
          queryKey: ['query', q],
          queryFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 20 * q))
            return q
          },
        })),
      }))

      mapped = computed(() => {
        const results = this.queries().map((q) => q.data())
        if (results.length === 0) return 'empty'
        return results.join(',')
      })

      _pushResults = effect(() => {
        const snapshot = this.queries().map((q) => ({ data: q.data() }))
        results.push(snapshot)
      })
    }

    const queries = signal([1, 2, 4])

    const rendered = await render(Page)
    const instance = rendered.fixture.componentInstance

    await rendered.findByText('data: 1,2,4')
    expect(instance.mapped()).toBe('1,2,4')

    expect(results.length).toBe(4)
    expect(results[0]).toMatchObject([
      { data: undefined },
      { data: undefined },
      { data: undefined },
    ])
    expect(results[1]).toMatchObject([
      { data: 1 },
      { data: undefined },
      { data: undefined },
    ])
    expect(results[2]).toMatchObject([
      { data: 1 },
      { data: 2 },
      { data: undefined },
    ])
    expect(results[3]).toMatchObject([{ data: 1 }, { data: 2 }, { data: 4 }])

    queries.set([3, 4])
    await rendered.findByText('data: 3,4')
    expect(instance.mapped()).toBe('3,4')

    // findByText causes another change detection cycle
    expect(results.length).toBe(7)
    expect(results[4]).toMatchObject([{ data: 1 }, { data: 2 }, { data: 4 }])
    expect(results[5]).toMatchObject([{ data: undefined }, { data: 4 }])
    expect(results[6]).toMatchObject([{ data: 3 }, { data: 4 }])

    queries.set([])
    await rendered.findByText('data: empty')
    expect(instance.mapped()).toBe('empty')

    // findByText causes another change detection cycle
    expect(results.length).toBe(9)
    expect(results[7]).toMatchObject([{ data: 3 }, { data: 4 }])
    expect(results[8]).toMatchObject([])
  })
})
