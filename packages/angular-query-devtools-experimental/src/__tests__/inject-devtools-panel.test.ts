import { ElementRef, signal } from '@angular/core'
import { TestBed, fakeAsync } from '@angular/core/testing'
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental'
import { beforeEach, describe, expect, vi } from 'vitest'
import { injectDevtoolsPanel } from '../inject-devtools-panel'

const mockDevtoolsPanelInstance = {
  mount: vi.fn(),
  unmount: vi.fn(),
  setClient: vi.fn(),
  setErrorTypes: vi.fn(),
}

const mocks = vi.hoisted(() => {
  return {
    mockTanstackQueryDevtoolsPanel: vi.fn(() => mockDevtoolsPanelInstance)
  }
})

vi.mock('@tanstack/query-devtools', () => ({
  TanstackQueryDevtoolsPanel: mocks.mockTanstackQueryDevtoolsPanel,
}))

describe('injectDevtoolsPanel', () => {
  let queryClient: QueryClient
  let mockElementRef: ElementRef

  beforeEach(() => {
    queryClient = new QueryClient()
    mockElementRef = new ElementRef(document.createElement('div'))
    TestBed.configureTestingModule({
      providers: [provideTanStackQuery(queryClient),
        { provide: ElementRef, useValue: signal(mockElementRef) },
      ],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return a DevtoolsPanelRef', () => {
    const result = TestBed.runInInjectionContext(() => {
      return injectDevtoolsPanel(() => ({
        hostElement: TestBed.inject(ElementRef),
      }))
    })

    expect(result).toEqual({
      destroy: expect.any(Function),
    })
  })

  it('should initialize TanstackQueryDevtoolsPanel', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      injectDevtoolsPanel(() => ({
        hostElement: TestBed.inject(ElementRef),
      }))
    })

    TestBed.flushEffects()

    expect (mocks.mockTanstackQueryDevtoolsPanel).toHaveBeenCalledTimes(1)
  }))

  it('should destroy TanstackQueryDevtoolsPanel', fakeAsync(() => {
    const result = TestBed.runInInjectionContext(() => {
      return injectDevtoolsPanel(() => ({
        hostElement: TestBed.inject(ElementRef),
      }))
    })

    TestBed.flushEffects()

    result.destroy()

    expect(mockDevtoolsPanelInstance.unmount).toHaveBeenCalledTimes(1)
  }))

})
