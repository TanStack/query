import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { TestBed } from '@angular/core/testing'
import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentInjector,
  InjectionToken,
  PLATFORM_ID,
  createEnvironmentInjector,
  isDevMode,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core'
import { provideTanStackQuery } from '../providers'
import { withDevtools } from '../devtools'
import { flushQueryUpdates } from './test-utils'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
} from '@tanstack/query-devtools'
import type { DevtoolsOptions } from '../devtools'

const mockDevtoolsInstance = {
  mount: vi.fn(),
  unmount: vi.fn(),
  setClient: vi.fn(),
  setPosition: vi.fn(),
  setErrorTypes: vi.fn(),
  setButtonPosition: vi.fn(),
  setInitialIsOpen: vi.fn(),
}

function MockTanstackQueryDevtools() {
  return mockDevtoolsInstance
}

const mockTanstackQueryDevtools = vi.fn(MockTanstackQueryDevtools)

vi.mock('@tanstack/query-devtools', () => ({
  TanstackQueryDevtools: mockTanstackQueryDevtools,
}))

vi.mock('@angular/core', async () => {
  const actual = await vi.importActual('@angular/core')
  return {
    ...actual,
    isDevMode: vi.fn(),
  }
})

const mockIsDevMode = vi.mocked(isDevMode)

describe('withDevtools feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    TestBed.resetTestingModule()
  })

  test.each([
    {
      description: 'should load devtools in development mode',
      isDevMode: true,
      expectedCalled: true,
    },
    {
      description: 'should not load devtools in production mode',
      isDevMode: false,
      expectedCalled: false,
    },
    {
      description: `should load devtools in development mode when 'loadDevtools' is set to 'auto'`,
      isDevMode: true,
      loadDevtools: 'auto',
      expectedCalled: true,
    },
    {
      description: `should not load devtools in production mode when 'loadDevtools' is set to 'auto'`,
      isDevMode: false,
      loadDevtools: 'auto',
      expectedCalled: false,
    },
    {
      description:
        "should load devtools in development mode when 'loadDevtools' is set to true",
      isDevMode: true,
      loadDevtools: true,
      expectedCalled: true,
    },
    {
      description:
        "should load devtools in production mode when 'loadDevtools' is set to true",
      isDevMode: false,
      loadDevtools: true,
      expectedCalled: true,
    },
    {
      description:
        "should not load devtools in development mode when 'loadDevtools' is set to false",
      isDevMode: true,
      loadDevtools: false,
      expectedCalled: false,
    },
    {
      description:
        "should not load devtools in production mode when 'loadDevtools' is set to false",
      isDevMode: false,
      loadDevtools: false,
      expectedCalled: false,
    },
  ])(
    '$description',
    async ({ isDevMode: isDevModeValue, loadDevtools, expectedCalled }) => {
      mockIsDevMode.mockReturnValue(isDevModeValue)

      const providers = [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          loadDevtools !== undefined
            ? withDevtools(
                () =>
                  ({
                    loadDevtools,
                  }) as DevtoolsOptions,
              )
            : withDevtools(),
        ),
      ]

      TestBed.configureTestingModule({
        providers,
      })

      TestBed.inject(ENVIRONMENT_INITIALIZER)
      await flushQueryUpdates()
      TestBed.tick()
      await vi.dynamicImportSettled()
      TestBed.tick()
      await vi.dynamicImportSettled()

      expect(mockTanstackQueryDevtools).toHaveBeenCalledTimes(
        expectedCalled ? 1 : 0,
      )
      expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(
        expectedCalled ? 1 : 0,
      )
    },
  )

  it('should not continue loading devtools after injector is destroyed', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    // Destroys injector
    TestBed.resetTestingModule()
    await flushQueryUpdates()
    await vi.dynamicImportSettled()

    expect(mockTanstackQueryDevtools).not.toHaveBeenCalled()
  })

  it('should not create devtools again when already provided', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await flushQueryUpdates()

    expect(mockTanstackQueryDevtools).toHaveBeenCalledTimes(1)

    const injector = TestBed.inject(EnvironmentInjector)

    createEnvironmentInjector(
      [
        withDevtools(() => ({
          loadDevtools: true,
        })).ɵproviders,
      ],
      injector,
    )

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await flushQueryUpdates()

    expect(mockTanstackQueryDevtools).toHaveBeenCalledTimes(1)
  })

  it('should not load devtools if platform is not browser', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PLATFORM_ID,
          useValue: 'server',
        },
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await vi.runAllTimersAsync()

    expect(mockTanstackQueryDevtools).not.toHaveBeenCalled()
  })

  it('should update error types', async () => {
    const errorTypes = signal([] as Array<DevtoolsErrorType>)

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
            errorTypes: errorTypes(),
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await flushQueryUpdates()

    TestBed.tick()

    expect(mockDevtoolsInstance.setErrorTypes).toHaveBeenCalledTimes(0)

    const newErrorTypes = [
      {
        name: '',
        initializer: () => new Error(),
      },
    ]

    errorTypes.set(newErrorTypes)

    TestBed.tick()

    expect(mockDevtoolsInstance.setErrorTypes).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.setErrorTypes).toHaveBeenCalledWith(
      newErrorTypes,
    )
  })

  it('should update client', async () => {
    const client = signal(new QueryClient())

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
            client: client(),
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await flushQueryUpdates()

    TestBed.tick()

    expect(mockDevtoolsInstance.setClient).toHaveBeenCalledTimes(0)

    const newClient = new QueryClient()
    client.set(newClient)

    TestBed.tick()

    expect(mockDevtoolsInstance.setClient).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.setClient).toHaveBeenCalledWith(newClient)
  })

  it('should update position', async () => {
    const position = signal<DevtoolsPosition>('top')

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
            position: position(),
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await flushQueryUpdates()

    TestBed.tick()

    expect(mockDevtoolsInstance.setPosition).toHaveBeenCalledTimes(0)

    position.set('left')

    TestBed.tick()

    expect(mockDevtoolsInstance.setPosition).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.setPosition).toHaveBeenCalledWith('left')
  })

  it('should update button position', async () => {
    const buttonPosition = signal<DevtoolsButtonPosition>('bottom-left')

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
            buttonPosition: buttonPosition(),
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await flushQueryUpdates()

    TestBed.tick()

    expect(mockDevtoolsInstance.setButtonPosition).toHaveBeenCalledTimes(0)

    buttonPosition.set('bottom-right')

    TestBed.tick()

    expect(mockDevtoolsInstance.setButtonPosition).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.setButtonPosition).toHaveBeenCalledWith(
      'bottom-right',
    )
  })

  it('should update initialIsOpen', async () => {
    const initialIsOpen = signal(false)

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
            initialIsOpen: initialIsOpen(),
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await flushQueryUpdates()

    TestBed.tick()

    expect(mockDevtoolsInstance.setInitialIsOpen).toHaveBeenCalledTimes(0)

    initialIsOpen.set(true)

    TestBed.tick()

    expect(mockDevtoolsInstance.setInitialIsOpen).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.setInitialIsOpen).toHaveBeenCalledWith(true)
  })

  it('should destroy devtools', async () => {
    const loadDevtools = signal(true)

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          withDevtools(() => ({
            loadDevtools: loadDevtools(),
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await flushQueryUpdates()

    expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(0)

    loadDevtools.set(false)

    TestBed.tick()

    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(1)
  })

  it('should unmount devtools when injector is destroyed', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await flushQueryUpdates()
    TestBed.tick()
    await vi.dynamicImportSettled()

    expect(mockTanstackQueryDevtools).toHaveBeenCalled()
    expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(0)

    // Destroy the injector
    TestBed.resetTestingModule()

    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(1)
  })

  it('should remount devtools when toggled from false to true', async () => {
    const loadDevtools = signal(false)

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          withDevtools(() => ({
            loadDevtools: loadDevtools(),
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await flushQueryUpdates()

    expect(mockTanstackQueryDevtools).not.toHaveBeenCalled()
    expect(mockDevtoolsInstance.mount).not.toHaveBeenCalled()

    loadDevtools.set(true)
    TestBed.tick()
    await vi.dynamicImportSettled()

    expect(mockTanstackQueryDevtools).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.unmount).not.toHaveBeenCalled()

    loadDevtools.set(false)
    TestBed.tick()

    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(1)

    loadDevtools.set(true)
    TestBed.tick()
    await vi.dynamicImportSettled()

    // Should remount (mount called twice now)
    expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(2)
    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(1)
  })

  describe('deps parameter', () => {
    it('should inject dependencies and pass them to withDevtoolsFn in correct order', async () => {
      const mockService1 = { value: 'service1' }
      const mockService2 = { value: 'service2' }
      const mockService1Token = new InjectionToken('MockService1')
      const mockService2Token = new InjectionToken('MockService2')
      const withDevtoolsFn = vi.fn().mockReturnValue({ loadDevtools: true })

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          {
            provide: mockService1Token,
            useValue: mockService1,
          },
          {
            provide: mockService2Token,
            useValue: mockService2,
          },
          provideTanStackQuery(
            new QueryClient(),
            withDevtools(withDevtoolsFn, {
              deps: [mockService1Token, mockService2Token],
            }),
          ),
        ],
      })

      TestBed.inject(ENVIRONMENT_INITIALIZER)
      await flushQueryUpdates()

      expect(withDevtoolsFn).toHaveBeenCalledWith(mockService1, mockService2)
    })

    it('should work with empty deps array', async () => {
      const withDevtoolsFn = vi.fn().mockReturnValue({ loadDevtools: true })

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTanStackQuery(
            new QueryClient(),
            withDevtools(withDevtoolsFn, {
              deps: [],
            }),
          ),
        ],
      })

      TestBed.inject(ENVIRONMENT_INITIALIZER)
      await flushQueryUpdates()

      expect(withDevtoolsFn).toHaveBeenCalledWith()
    })

    it('should reactively update when injected services change', async () => {
      class ReactiveService {
        enabled = signal(false)
        position = signal<DevtoolsPosition>('bottom')
      }

      const withDevtoolsFn = (service: ReactiveService) => ({
        loadDevtools: service.enabled(),
        position: service.position(),
      })

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          ReactiveService,
          provideTanStackQuery(
            new QueryClient(),
            withDevtools(withDevtoolsFn, {
              deps: [ReactiveService],
            }),
          ),
        ],
      })

      TestBed.inject(ENVIRONMENT_INITIALIZER)
      await flushQueryUpdates()

      const service = TestBed.inject(ReactiveService)

      expect(mockTanstackQueryDevtools).not.toHaveBeenCalled()

      service.enabled.set(true)
      TestBed.tick()
      await vi.dynamicImportSettled()

      expect(mockTanstackQueryDevtools).toHaveBeenCalledTimes(1)
      expect(mockTanstackQueryDevtools).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 'bottom',
        }),
      )

      service.position.set('top')
      TestBed.tick()

      expect(mockDevtoolsInstance.setPosition).toHaveBeenCalledWith('top')
    })
  })
})
