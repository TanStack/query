import { TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { Injector, provideZonelessChangeDetection, signal } from '@angular/core'
import {
  QueryClient,
  injectIsRestoring,
  provideIsRestoring,
  provideTanStackQuery,
} from '..'

describe('injectIsRestoring', () => {
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

  it('should return false by default when provideIsRestoring is not used', () => {
    const isRestoring = TestBed.runInInjectionContext(() => {
      return injectIsRestoring()
    })

    expect(isRestoring()).toBe(false)
  })

  it('should return the provided signal value when provideIsRestoring is used', () => {
    const restoringSignal = signal(true)

    TestBed.configureTestingModule({
      providers: [provideIsRestoring(restoringSignal.asReadonly())],
    })

    const isRestoring = TestBed.runInInjectionContext(() => {
      return injectIsRestoring()
    })

    expect(isRestoring()).toBe(true)
  })

  it('should be usable outside injection context when passing an injector', () => {
    const isRestoring = injectIsRestoring({
      injector: TestBed.inject(Injector),
    })

    expect(isRestoring()).toBe(false)
  })

  it('should throw NG0203 with descriptive error outside injection context', () => {
    expect(() => {
      injectIsRestoring()
    }).toThrow(/NG0203(.*?)injectIsRestoring/)
  })
})
