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
import type {
  TanstackQueryDevtoolsPanel,
  Theme,
} from '@tanstack/query-devtools'

const mockDevtoolsPanelInstance = {
  mount: vi.fn<TanstackQueryDevtoolsPanel['mount']>(),
  unmount: vi.fn<TanstackQueryDevtoolsPanel['unmount']>(),
  setClient: vi.fn<TanstackQueryDevtoolsPanel['setClient']>(),
  setErrorTypes: vi.fn<TanstackQueryDevtoolsPanel['setErrorTypes']>(),
  setOnClose: vi.fn<TanstackQueryDevtoolsPanel['setOnClose']>(),
  setTheme: vi.fn<TanstackQueryDevtoolsPanel['setTheme']>(),
}

const mocks = vi.hoisted(() => {
  function MockTanstackQueryDevtoolsPanel() {
    return mockDevtoolsPanelInstance
  }

  return {
    mockTanstackQueryDevtoolsPanel: vi.fn<
      typeof MockTanstackQueryDevtoolsPanel
    >(MockTanstackQueryDevtoolsPanel),
  }
})

// oxlint-disable-next-line vitest/prefer-import-in-mock -- the mocked devtools classes have '#private' fields, and this environment cannot load the real Solid module
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

    expect(result).toStrictEqual({
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

  it('should pass hideDisabledQueries and theme to TanstackQueryDevtoolsPanel', async () => {
    TestBed.runInInjectionContext(() => {
      injectDevtoolsPanel(() => ({
        hostElement: TestBed.inject(ElementRef),
        hideDisabledQueries: true,
        theme: 'dark',
      }))
    })

    TestBed.tick()
    await waitForDevtoolsToBeCreated()
    expect(mocks.mockTanstackQueryDevtoolsPanel).toHaveBeenCalledWith(
      expect.objectContaining({ hideDisabledQueries: true, theme: 'dark' }),
    )
  })

  it('should update theme', async () => {
    const theme = signal<Theme | undefined>('light')

    TestBed.runInInjectionContext(() => {
      return injectDevtoolsPanel(() => ({
        hostElement: TestBed.inject(ElementRef),
        theme: theme(),
      }))
    })

    TestBed.tick()
    await waitForDevtoolsToBeCreated()
    expect(mockDevtoolsPanelInstance.setTheme).toHaveBeenCalledTimes(0)

    theme.set('dark')
    TestBed.tick()
    expect(mockDevtoolsPanelInstance.setTheme).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsPanelInstance.setTheme).toHaveBeenCalledWith('dark')

    theme.set(undefined)
    TestBed.tick()
    expect(mockDevtoolsPanelInstance.setTheme).toHaveBeenCalledTimes(2)
    expect(mockDevtoolsPanelInstance.setTheme).toHaveBeenLastCalledWith(
      undefined,
    )
  })
})
