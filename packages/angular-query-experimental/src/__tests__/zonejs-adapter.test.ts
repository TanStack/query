import 'zone.js'
import {
  ChangeDetectionStrategy,
  Component,
  provideZoneChangeDetection,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QueryClient,
  injectMutation,
  injectQuery,
  provideTanStackQuery,
} from '..'
import { sleep } from '@tanstack/query-test-utils'

describe('adapter with Zone.js', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    queryClient = new QueryClient()

    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      providers: [
        provideZoneChangeDetection(),
        provideTanStackQuery(queryClient),
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('supports injectQuery in a Zone.js app', async () => {
    @Component({
      selector: 'zone-query-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ZoneQueryTestComponent {
      query = injectQuery(() => ({
        queryKey: ['zone-query'],
        queryFn: async () => {
          await sleep(10)
          return 'query-data'
        },
      }))
    }

    const fixture = TestBed.createComponent(ZoneQueryTestComponent)
    fixture.detectChanges()

    const query = fixture.componentInstance.query
    expect(query.status()).toBe('pending')

    const stablePromise = fixture.whenStable()
    await vi.advanceTimersByTimeAsync(20)
    await stablePromise

    expect(query.status()).toBe('success')
    expect(query.data()).toBe('query-data')
  })

  it('supports injectMutation in a Zone.js app', async () => {
    @Component({
      selector: 'zone-mutation-test',
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class ZoneMutationTestComponent {
      mutation = injectMutation(() => ({
        mutationKey: ['zone-mutation'],
        mutationFn: async (value: string) => {
          await sleep(10)
          return `mutated-${value}`
        },
      }))
    }

    const fixture = TestBed.createComponent(ZoneMutationTestComponent)
    fixture.detectChanges()

    const mutation = fixture.componentInstance.mutation
    mutation.mutate('value')

    const stablePromise = fixture.whenStable()
    await vi.advanceTimersByTimeAsync(20)
    await stablePromise

    expect(mutation.status()).toBe('success')
    expect(mutation.data()).toBe('mutated-value')
  })
})
