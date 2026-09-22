import { TestBed } from '@angular/core/testing'
import { describe, expect, it } from 'vitest'
import { InjectionToken, inject, signal } from '@angular/core'
import { provideIsRestoring } from '../internal'
import { QueryClient, injectIsRestoring, provideTanStackQuery } from '..'
import { provideAngularQueryChangeDetection } from './test-utils'

describe('injectIsRestoring', () => {
  let queryClient: QueryClient

  it('returns false by default when provideIsRestoring is not used', () => {
    queryClient = new QueryClient()

    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => queryClient),
      ],
    })

    const isRestoring = TestBed.runInInjectionContext(() => {
      return injectIsRestoring()
    })

    expect(isRestoring()).toBe(false)
  })

  it('resolves a restoration signal factory in the injection context', () => {
    const state = signal(true)
    const token = new InjectionToken<typeof state>('restoration state')
    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        { provide: token, useValue: state },
        provideIsRestoring(() => inject(token).asReadonly()),
      ],
    })

    const isRestoring = TestBed.runInInjectionContext(injectIsRestoring)
    expect(isRestoring()).toBe(true)
    state.set(false)
    expect(isRestoring()).toBe(false)
    expect(TestBed.runInInjectionContext(injectIsRestoring)).toBe(isRestoring)
  })

  it('throws NG0203 with descriptive error outside injection context', () => {
    expect(() => {
      injectIsRestoring()
    }).toThrow(/NG0203(.*?)injectIsRestoring/)
  })
})
