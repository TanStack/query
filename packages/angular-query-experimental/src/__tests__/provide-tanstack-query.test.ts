import { TestBed } from '@angular/core/testing'
import { describe, expect, test } from 'vitest'
import { InjectionToken, provideZonelessChangeDetection } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import { provideTanStackQuery } from '../providers'

describe('provideTanStackQuery', () => {
  test('should provide a QueryClient instance directly', () => {
    const queryClient = new QueryClient()

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
      ],
    })

    const providedQueryClient = TestBed.inject(QueryClient)
    expect(providedQueryClient).toBe(queryClient)
  })

  test('should provide a QueryClient instance using an InjectionToken', () => {
    const queryClient = new QueryClient()
    const CUSTOM_QUERY_CLIENT = new InjectionToken<QueryClient>('', {
      factory: () => queryClient,
    })

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(CUSTOM_QUERY_CLIENT),
      ],
    })

    const providedQueryClient = TestBed.inject(QueryClient)
    expect(providedQueryClient).toBe(queryClient)
  })
})
