import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/angular'
import {
  Component,
  effect,
  provideZonelessChangeDetection,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient, provideTanStackQuery } from '..'
import { injectQueries } from '../inject-queries'

let queryClient: QueryClient

beforeEach(() => {
  queryClient = new QueryClient()
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideTanStackQuery(queryClient),
    ],
  })
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
            data1: {{ result()[0].data() ?? 'null' }}, data2:
            {{ result()[1].data() ?? 'null' }}
          </div>
        </div>
      `,
    })
    class Page {
      toString(val: any) {
        return String(val)
      }
      result = injectQueries(() => ({
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
        const snapshot = this.result().map((q) => ({ data: q.data() }))
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
})
