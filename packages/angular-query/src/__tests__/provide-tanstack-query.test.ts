import { TestBed } from '@angular/core/testing'
import { describe, expect, it } from 'vitest'
import { InjectionToken, PLATFORM_ID, inject } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import { provideTanStackQuery } from '../providers'
import { provideAngularQueryChangeDetection } from './test-utils'

describe('provideTanStackQuery', () => {
  it('should provide a QueryClient instance using a factory', () => {
    const queryClient = new QueryClient()

    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => queryClient),
      ],
    })

    const providedQueryClient = TestBed.inject(QueryClient)
    expect(providedQueryClient).toBe(queryClient)
  })

  it('resolves an existing QueryClient through a factory in the injection context', () => {
    const queryClient = new QueryClient()
    const CUSTOM_QUERY_CLIENT = new InjectionToken<QueryClient>('', {
      factory: () => queryClient,
    })

    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => inject(CUSTOM_QUERY_CLIENT)),
      ],
    })

    const providedQueryClient = TestBed.inject(QueryClient)
    expect(providedQueryClient).toBe(queryClient)
  })
})

describe('server client defaults', () => {
  it('uses server defaults without changing an unrelated client', () => {
    const unrelated = new QueryClient()
    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        { provide: PLATFORM_ID, useValue: 'server' },
        provideTanStackQuery(() => new QueryClient()),
      ],
    })
    expect(TestBed.inject(QueryClient).getDefaultOptions()).toEqual({
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity },
    })
    expect(unrelated.getDefaultOptions()).toEqual({})
  })

  it('preserves explicit server client defaults', () => {
    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        { provide: PLATFORM_ID, useValue: 'server' },
        provideTanStackQuery(
          () =>
            new QueryClient({
              defaultOptions: {
                queries: { gcTime: 1000, retry: 1, staleTime: 30000 },
                mutations: { gcTime: 2000 },
              },
            }),
        ),
      ],
    })
    expect(TestBed.inject(QueryClient).getDefaultOptions()).toEqual({
      queries: { gcTime: 1000, retry: 1, staleTime: 30000 },
      mutations: { gcTime: 2000 },
    })
  })
})
