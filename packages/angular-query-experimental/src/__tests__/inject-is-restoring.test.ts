import { TestBed } from '@angular/core/testing'
import { describe, expect, test } from 'vitest'
import { Injector, provideZonelessChangeDetection, signal } from '@angular/core'
import {
  QueryClient,
  injectIsRestoring,
  provideIsRestoring,
  provideTanStackQuery,
} from '..'

describe('injectIsRestoring', () => {
  let queryClient: QueryClient

  test('returns false by default when provideIsRestoring is not used', () => {
    queryClient = new QueryClient()

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ...provideTanStackQuery(queryClient),
      ],
    })

    const isRestoring = TestBed.runInInjectionContext(() => {
      return injectIsRestoring()
    })

    expect(isRestoring()).toBe(false)
  })

  test('returns provided signal value when provideIsRestoring is used', () => {
    queryClient = new QueryClient()
    const restoringSignal = signal(true)

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ...provideTanStackQuery(queryClient),
        provideIsRestoring(restoringSignal.asReadonly()),
      ],
    })

    const isRestoring = TestBed.runInInjectionContext(() => {
      return injectIsRestoring()
    })

    expect(isRestoring()).toBe(true)
  })

  test('can be used outside injection context when passing an injector', () => {
    queryClient = new QueryClient()

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ...provideTanStackQuery(queryClient),
      ],
    })

    const isRestoring = injectIsRestoring({
      injector: TestBed.inject(Injector),
    })

    expect(isRestoring()).toBe(false)
  })

  test('throws NG0203 with descriptive error outside injection context', () => {
    expect(() => {
      injectIsRestoring()
    }).toThrow(/NG0203(.*?)injectIsRestoring/)
  })
})
