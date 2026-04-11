import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Component,
  effect,
  provideZonelessChangeDetection,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, provideTanStackQuery } from '..'
import { injectQueries } from '../inject-queries'

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

      _ = effect(() => {
        const snapshot = this.result().map((q) => ({ data: q.data() }))
        results.push(snapshot)
      })
    }

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
      ],
    })

    await vi.advanceTimersByTimeAsync(101)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('data1: 1, data2: 2')).toBeInTheDocument()

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject([{ data: undefined }, { data: undefined }])
    expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
    expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
  })
})
