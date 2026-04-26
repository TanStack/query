import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import {
  Component,
  Injector,
  provideZonelessChangeDetection,
} from '@angular/core'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  injectIsMutating,
  injectMutation,
  provideTanStackQuery,
} from '..'

describe('injectIsMutating', () => {
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

  it('should properly return isMutating state', async () => {
    const key = queryKey()

    @Component({
      template: `<div>mutating: {{ isMutating() }}</div>`,
    })
    class Page {
      readonly mutation = injectMutation(() => ({
        mutationKey: key,
        mutationFn: (params: { par1: string }) => sleep(10).then(() => params),
      }))
      readonly isMutating = injectIsMutating()
    }

    const rendered = await render(Page)

    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    rendered.fixture.componentInstance.mutation.mutate({ par1: 'par1' })

    await vi.advanceTimersByTimeAsync(0)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })

  it('should be able to filter by mutationKey', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    @Component({
      template: `<div>mutating: {{ isMutating() }}</div>`,
    })
    class Page {
      readonly mutation1 = injectMutation(() => ({
        mutationKey: key1,
        mutationFn: () => sleep(10).then(() => 'data1'),
      }))
      readonly mutation2 = injectMutation(() => ({
        mutationKey: key2,
        mutationFn: () => sleep(100).then(() => 'data2'),
      }))
      readonly isMutating = injectIsMutating({ mutationKey: key1 })
    }

    const rendered = await render(Page)

    rendered.fixture.componentInstance.mutation1.mutate()
    rendered.fixture.componentInstance.mutation2.mutate()

    await vi.advanceTimersByTimeAsync(0)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })

  describe('injection context', () => {
    it('should throw NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectIsMutating()
      }).toThrow(/NG0203(.*?)injectIsMutating/)
    })

    it('should be usable outside injection context when passing an injector', () => {
      expect(
        injectIsMutating(undefined, {
          injector: TestBed.inject(Injector),
        }),
      ).not.toThrow()
    })
  })
})
