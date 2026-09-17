import { ApplicationRef, ElementRef, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { injectDevtoolsPanel } from '../devtools-panel'
import { setupTanStackQueryTestBed } from './test-utils'

const mockDevtoolsPanelInstance = {
  mount: vi.fn(),
  unmount: vi.fn(),
  setClient: vi.fn(),
  setErrorTypes: vi.fn(),
  setOnClose: vi.fn(),
}

const mocks = vi.hoisted(() => {
  function MockTanstackQueryDevtoolsPanel() {
    return mockDevtoolsPanelInstance
  }

  return {
    mockTanstackQueryDevtoolsPanel: vi.fn(MockTanstackQueryDevtoolsPanel),
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
    vi.clearAllMocks()
    queryClient = new QueryClient()
    mockElementRef = new ElementRef(document.createElement('div'))
    setupTanStackQueryTestBed(queryClient, {
      providers: [{ provide: ElementRef, useValue: signal(mockElementRef) }],
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

    await TestBed.inject(ApplicationRef).whenStable()

    await waitForDevtoolsToBeCreated()

    expect(mockDevtoolsPanelInstance.mount).toHaveBeenCalledTimes(1)
  })

  it('should destroy TanstackQueryDevtoolsPanel', async () => {
    const result = TestBed.runInInjectionContext(() => {
      return injectDevtoolsPanel(() => ({
        hostElement: TestBed.inject(ElementRef),
      }))
    })

    await TestBed.inject(ApplicationRef).whenStable()

    await waitForDevtoolsToBeCreated()

    result.destroy()

    expect(mockDevtoolsPanelInstance.unmount).toHaveBeenCalledTimes(1)
  })

  it('should stop reacting after it is manually destroyed', async () => {
    const hostElement = signal<ElementRef | undefined>(mockElementRef)
    const result = TestBed.runInInjectionContext(() =>
      injectDevtoolsPanel(() => ({
        hostElement: hostElement(),
      })),
    )

    await TestBed.inject(ApplicationRef).whenStable()
    await waitForDevtoolsToBeCreated()

    result.destroy()
    hostElement.set(undefined)
    hostElement.set(mockElementRef)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mocks.mockTanstackQueryDevtoolsPanel).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsPanelInstance.mount).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsPanelInstance.unmount).toHaveBeenCalledTimes(1)
  })

  it('should not mount when destroyed while the devtools import is pending', async () => {
    const result = TestBed.runInInjectionContext(() =>
      injectDevtoolsPanel(() => ({
        hostElement: mockElementRef,
      })),
    )

    TestBed.tick()
    result.destroy()
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mocks.mockTanstackQueryDevtoolsPanel).not.toHaveBeenCalled()
    expect(mockDevtoolsPanelInstance.mount).not.toHaveBeenCalled()
  })

  it('should destroy TanstackQueryDevtoolsPanel when hostElement is removed', async () => {
    const hostElement = signal<ElementRef | null>(mockElementRef)

    TestBed.runInInjectionContext(() => {
      return injectDevtoolsPanel(() => ({
        hostElement: hostElement(),
      }))
    })

    await TestBed.inject(ApplicationRef).whenStable()

    await waitForDevtoolsToBeCreated()

    expect(mockDevtoolsPanelInstance.unmount).toHaveBeenCalledTimes(0)

    hostElement.set(null)

    await TestBed.inject(ApplicationRef).whenStable()

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

    await TestBed.inject(ApplicationRef).whenStable()

    await waitForDevtoolsToBeCreated()

    expect(mockDevtoolsPanelInstance.setClient).toHaveBeenCalledTimes(0)

    client.set(new QueryClient())

    await TestBed.inject(ApplicationRef).whenStable()

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

    await TestBed.inject(ApplicationRef).whenStable()

    await waitForDevtoolsToBeCreated()

    expect(mockDevtoolsPanelInstance.setErrorTypes).toHaveBeenCalledTimes(0)

    errorTypes.set([])

    await TestBed.inject(ApplicationRef).whenStable()

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

    await TestBed.inject(ApplicationRef).whenStable()

    await waitForDevtoolsToBeCreated()

    expect(mockDevtoolsPanelInstance.setOnClose).toHaveBeenCalledTimes(0)

    onClose.set(functionB)

    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsPanelInstance.setOnClose).toHaveBeenCalledTimes(1)
  })
})
