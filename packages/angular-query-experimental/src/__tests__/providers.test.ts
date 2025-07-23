import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { TestBed } from '@angular/core/testing'
import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentInjector,
  PLATFORM_ID,
  createEnvironmentInjector,
  isDevMode,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core'
import { provideTanStackQuery } from '../providers'
import { withDevtools } from '../devtools'
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

const mockTanstackQueryDevtools = vi.fn(() => mockDevtoolsInstance)

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
  })

  test.each([
    {
      description: 'should load developer tools in development mode',
      isDevMode: true,
      expectedCalled: true,
    },
    {
      description: 'should not load developer tools in production mode',
      isDevMode: false,
      expectedCalled: false,
    },
    {
      description: `should load developer tools in development mode when 'loadDevtools' is set to 'auto'`,
      isDevMode: true,
      loadDevtools: 'auto',
      expectedCalled: true,
    },
    {
      description: `should not load developer tools in production mode when 'loadDevtools' is set to 'auto'`,
      isDevMode: false,
      loadDevtools: 'auto',
      expectedCalled: false,
    },
    {
      description:
        "should load developer tools in development mode when 'loadDevtools' is set to true",
      isDevMode: true,
      loadDevtools: true,
      expectedCalled: true,
    },
    {
      description:
        "should load developer tools in production mode when 'loadDevtools' is set to true",
      isDevMode: false,
      loadDevtools: true,
      expectedCalled: true,
    },
    {
      description:
        "should not load developer tools in development mode when 'loadDevtools' is set to false",
      isDevMode: true,
      loadDevtools: false,
      expectedCalled: false,
    },
    {
      description:
        "should not load developer tools in production mode when 'loadDevtools' is set to false",
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
      await vi.advanceTimersByTimeAsync(0)
      TestBed.tick()
      await vi.dynamicImportSettled()
      TestBed.tick()
      await vi.dynamicImportSettled()

      if (expectedCalled) {
        expect(mockTanstackQueryDevtools).toHaveBeenCalled()
      } else {
        expect(mockTanstackQueryDevtools).not.toHaveBeenCalled()
      }
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
    await vi.advanceTimersByTimeAsync(0)

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
    await vi.advanceTimersByTimeAsync(0)

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
    await vi.advanceTimersByTimeAsync(0)

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
    await vi.advanceTimersByTimeAsync(0)

    TestBed.tick()

    expect(mockDevtoolsInstance.setErrorTypes).toHaveBeenCalledTimes(0)

    errorTypes.set([
      {
        name: '',
        initializer: () => new Error(),
      },
    ])

    TestBed.tick()

    expect(mockDevtoolsInstance.setErrorTypes).toHaveBeenCalledTimes(1)
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
    await vi.advanceTimersByTimeAsync(0)

    TestBed.tick()

    expect(mockDevtoolsInstance.setClient).toHaveBeenCalledTimes(0)

    client.set(new QueryClient())

    TestBed.tick()

    expect(mockDevtoolsInstance.setClient).toHaveBeenCalledTimes(1)
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
    await vi.advanceTimersByTimeAsync(0)

    TestBed.tick()

    expect(mockDevtoolsInstance.setPosition).toHaveBeenCalledTimes(0)

    position.set('left')

    TestBed.tick()

    expect(mockDevtoolsInstance.setPosition).toHaveBeenCalledTimes(1)
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
    await vi.advanceTimersByTimeAsync(0)

    TestBed.tick()

    expect(mockDevtoolsInstance.setButtonPosition).toHaveBeenCalledTimes(0)

    buttonPosition.set('bottom-right')

    TestBed.tick()

    expect(mockDevtoolsInstance.setButtonPosition).toHaveBeenCalledTimes(1)
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
    await vi.advanceTimersByTimeAsync(0)

    TestBed.tick()

    expect(mockDevtoolsInstance.setInitialIsOpen).toHaveBeenCalledTimes(0)

    initialIsOpen.set(true)

    TestBed.tick()

    expect(mockDevtoolsInstance.setInitialIsOpen).toHaveBeenCalledTimes(1)
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
    await vi.advanceTimersByTimeAsync(0)

    expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(0)

    loadDevtools.set(false)

    TestBed.tick()

    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(1)
  })
})
