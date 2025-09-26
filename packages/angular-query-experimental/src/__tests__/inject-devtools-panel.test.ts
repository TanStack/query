import {
  ElementRef,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { provideTanStackQuery } from '../providers'
import { injectDevtoolsPanel } from '../devtools-panel'

const mockDevtoolsPanelInstance = {
  mount: vi.fn(),
  unmount: vi.fn(),
  setClient: vi.fn(),
  setErrorTypes: vi.fn(),
  setOnClose: vi.fn(),
}

const mocks = vi.hoisted(() => {
  return {
    mockTanstackQueryDevtoolsPanel: vi.fn(() => mockDevtoolsPanelInstance),
  }
})

vi.mock('@tanstack/query-devtools', () => ({
  TanstackQueryDevtoolsPanel: mocks.mockTanstackQueryDevtoolsPanel,
}))

describe('injectDevtoolsPanel', () => {
  let queryClient: QueryClient
  let mockElementRef: ElementRef

  const waitForDevtoolsToBeCreated = async () => {
    await vi.waitFor(() => {
      expect(mocks.mockTanstackQueryDevtoolsPanel).toHaveBeenCalledTimes(1)
    })
  }

  beforeEach(() => {
    queryClient = new QueryClient()
    mockElementRef = new ElementRef(document.createElement('div'))
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
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

  it('should initialize TanstackQueryDevtoolsPanel', async () => {
    TestBed.runInInjectionContext(() => {
      injectDevtoolsPanel(() => ({
        hostElement: TestBed.inject(ElementRef),
      }))
    })

    TestBed.tick()

    await waitForDevtoolsToBeCreated()

    expect(mockDevtoolsPanelInstance.mount).toHaveBeenCalledTimes(1)
  })

  it('should destroy TanstackQueryDevtoolsPanel', async () => {
    const result = TestBed.runInInjectionContext(() => {
      return injectDevtoolsPanel(() => ({
        hostElement: TestBed.inject(ElementRef),
      }))
    })

    TestBed.tick()

    await waitForDevtoolsToBeCreated()

    result.destroy()

    expect(mockDevtoolsPanelInstance.unmount).toHaveBeenCalledTimes(1)
  })

  it('should destroy TanstackQueryDevtoolsPanel when hostElement is removed', async () => {
    const hostElement = signal<ElementRef>(mockElementRef)

    TestBed.runInInjectionContext(() => {
      return injectDevtoolsPanel(() => ({
        hostElement: hostElement(),
      }))
    })

    TestBed.tick()

    await waitForDevtoolsToBeCreated()

    expect(mockDevtoolsPanelInstance.unmount).toHaveBeenCalledTimes(0)

    hostElement.set(null as unknown as ElementRef)

    TestBed.tick()

    expect(mockDevtoolsPanelInstance.unmount).toHaveBeenCalledTimes(1)
  })

  it('should update client', async () => {
    const client = signal(new QueryClient())

    TestBed.runInInjectionContext(() => {
      return injectDevtoolsPanel(() => ({
        hostElement: TestBed.inject(ElementRef),
        client: client(),
      }))
    })

    TestBed.tick()

    await waitForDevtoolsToBeCreated()

    expect(mockDevtoolsPanelInstance.setClient).toHaveBeenCalledTimes(0)

    client.set(new QueryClient())

    TestBed.tick()

    expect(mockDevtoolsPanelInstance.setClient).toHaveBeenCalledTimes(1)
  })

  it('should update error types', async () => {
    const errorTypes = signal([])

    TestBed.runInInjectionContext(() => {
      return injectDevtoolsPanel(() => ({
        hostElement: TestBed.inject(ElementRef),
        errorTypes: errorTypes(),
      }))
    })

    TestBed.tick()

    await waitForDevtoolsToBeCreated()

    expect(mockDevtoolsPanelInstance.setErrorTypes).toHaveBeenCalledTimes(0)

    errorTypes.set([])

    TestBed.tick()

    expect(mockDevtoolsPanelInstance.setErrorTypes).toHaveBeenCalledTimes(1)
  })

  it('should update onclose', async () => {
    const functionA = () => {}
    const functionB = () => {}

    const onClose = signal(functionA)

    TestBed.runInInjectionContext(() => {
      return injectDevtoolsPanel(() => ({
        hostElement: TestBed.inject(ElementRef),
        onClose: onClose(),
      }))
    })

    TestBed.tick()

    await waitForDevtoolsToBeCreated()

    expect(mockDevtoolsPanelInstance.setOnClose).toHaveBeenCalledTimes(0)

    onClose.set(functionB)

    TestBed.tick()

    expect(mockDevtoolsPanelInstance.setOnClose).toHaveBeenCalledTimes(1)
  })
})
