import { TestBed } from '@angular/core/testing'
import { describe, expect, it } from 'vitest'
import { Injector, provideZonelessChangeDetection, signal } from '@angular/core'
import {
  QueryClient,
  injectIsRestoring,
  provideIsRestoring,
  provideTanStackQuery,
} from '..'

describe('injectIsRestoring', () => {
  let queryClient: QueryClient

  it('returns false by default when provideIsRestoring is not used', () => {
    queryClient = new QueryClient()

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
      ],
    })

    const isRestoring = TestBed.runInInjectionContext(() => {
      return injectIsRestoring()
    })

    expect(isRestoring()).toBe(false)
  })

  it('returns provided signal value when provideIsRestoring is used', () => {
    queryClient = new QueryClient()
    const restoringSignal = signal(true)

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
        provideIsRestoring(restoringSignal.asReadonly()),
      ],
    })

    const isRestoring = TestBed.runInInjectionContext(() => {
      return injectIsRestoring()
    })

    expect(isRestoring()).toBe(true)
  })

  it('can be used outside injection context when passing an injector', () => {
    queryClient = new QueryClient()

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
      ],
    })

    const isRestoring = injectIsRestoring({
      injector: TestBed.inject(Injector),
    })

    expect(isRestoring()).toBe(false)
  })

  it('throws NG0203 with descriptive error outside injection context', () => {
    expect(() => {
      injectIsRestoring()
    }).toThrow(/NG0203(.*?)injectIsRestoring/)
  })
})
