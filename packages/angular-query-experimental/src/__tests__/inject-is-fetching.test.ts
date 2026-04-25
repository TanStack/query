import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Component,
  Injector,
  provideZonelessChangeDetection,
} from '@angular/core'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  injectIsFetching,
  injectQuery,
  provideTanStackQuery,
} from '..'

describe('injectIsFetching', () => {
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

    expect(rendered.getByText('fetching: 0')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(0)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('fetching: 1')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(101)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('fetching: 0')).toBeInTheDocument()
  })

  describe('injection context', () => {
    it('should throw NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectIsFetching()
      }).toThrow(/NG0203(.*?)injectIsFetching/)
    })

    it('should be usable outside injection context when passing an injector', () => {
      expect(
        injectIsFetching(undefined, {
          injector: TestBed.inject(Injector),
        }),
      ).not.toThrow()
    })
  })
})
