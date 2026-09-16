import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { TestBed } from '@angular/core/testing'
import {
  ApplicationRef,
  ENVIRONMENT_INITIALIZER,
  EnvironmentInjector,
  InjectionToken,
  PLATFORM_ID,
  createEnvironmentInjector,
  inject,
  isDevMode,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core'
import { provideTanStackQuery } from '@tanstack/angular-query'
import { getQueryFeatureProviders } from '@tanstack/angular-query/internal'
import { withDevtools } from '../index'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  Theme,
} from '@tanstack/query-devtools'
import type { DevtoolsOptions } from '../types'

const { mockDevtoolsInstance, mockTanstackQueryDevtools } = vi.hoisted(() => {
  const instance = {
    mount: vi.fn(),
    unmount: vi.fn(),
    setClient: vi.fn(),
    setPosition: vi.fn(),
    setErrorTypes: vi.fn(),
    setButtonPosition: vi.fn(),
    setInitialIsOpen: vi.fn(),
    setTheme: vi.fn(),
  }

  return {
    mockDevtoolsInstance: instance,
    mockTanstackQueryDevtools: vi.fn(function MockTanstackQueryDevtools() {
      return instance
    }),
  }
})

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
  })

  afterEach(() => {
    vi.restoreAllMocks()
    TestBed.resetTestingModule()
  })

  it.each([
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
          () => new QueryClient(),
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
      expect(mockTanstackQueryDevtools).toHaveBeenCalledTimes(1)

      await TestBed.inject(ApplicationRef).whenStable()

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
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
          })),
        ),
      ],
    })

    const app = TestBed.inject(ApplicationRef)
    TestBed.inject(ENVIRONMENT_INITIALIZER)
    const stable = app.whenStable()
    // Destroys injector
    TestBed.resetTestingModule()
    await stable

    expect(mockTanstackQueryDevtools).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.mount).not.toHaveBeenCalled()
  })

  it('should not create devtools again when already provided', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockTanstackQueryDevtools).toHaveBeenCalledTimes(1)

    const injector = TestBed.inject(EnvironmentInjector)

    createEnvironmentInjector(
      [
        getQueryFeatureProviders(
          withDevtools(() => ({
            loadDevtools: true,
          })),
        ),
      ],
      injector,
    )

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

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
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockTanstackQueryDevtools).not.toHaveBeenCalled()
  })

  it('should update error types', async () => {
    const errorTypes = signal([] as Array<DevtoolsErrorType>)

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
            errorTypes,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.setErrorTypes).toHaveBeenCalledTimes(0)

    const newErrorTypes = [
      {
        name: '',
        initializer: () => new Error(),
      },
    ]

    errorTypes.set(newErrorTypes)
    await TestBed.inject(ApplicationRef).whenStable()

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
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
            client,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.setClient).toHaveBeenCalledTimes(0)

    const newClient = new QueryClient()
    client.set(newClient)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.setClient).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.setClient).toHaveBeenCalledWith(newClient)
  })

  it('should update position', async () => {
    const position = signal<DevtoolsPosition>('top')

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
            position,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.setPosition).toHaveBeenCalledTimes(0)

    position.set('left')
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.setPosition).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.setPosition).toHaveBeenCalledWith('left')
  })

  it('should update button position', async () => {
    const buttonPosition = signal<DevtoolsButtonPosition>('bottom-left')

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
            buttonPosition,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.setButtonPosition).toHaveBeenCalledTimes(0)

    buttonPosition.set('bottom-right')
    await TestBed.inject(ApplicationRef).whenStable()

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
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
            initialIsOpen,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.setInitialIsOpen).toHaveBeenCalledTimes(0)

    initialIsOpen.set(true)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.setInitialIsOpen).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.setInitialIsOpen).toHaveBeenCalledWith(true)
  })

  it('should update theme', async () => {
    const theme = signal<Theme>('system')

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
            theme,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.setTheme).toHaveBeenCalledTimes(0)

    theme.set('dark')
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.setTheme).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.setTheme).toHaveBeenCalledWith('dark')
  })

  it('should pass construction-only options to the devtools', async () => {
    const shadowDOMTarget = document
      .createElement('div')
      .attachShadow({ mode: 'open' })

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
            styleNonce: 'nonce',
            shadowDOMTarget,
            hideDisabledQueries: true,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockTanstackQueryDevtools).toHaveBeenCalledWith(
      expect.objectContaining({
        styleNonce: 'nonce',
        shadowDOMTarget,
        hideDisabledQueries: true,
      }),
    )
  })

  it('should destroy devtools', async () => {
    const loadDevtools = signal(true)

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(0)

    loadDevtools.set(false)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(1)
  })

  it('should unmount devtools when injector is destroyed', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools: true,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

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
          () => new QueryClient(),
          withDevtools(() => ({
            loadDevtools,
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockTanstackQueryDevtools).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.mount).not.toHaveBeenCalled()

    loadDevtools.set(true)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.unmount).not.toHaveBeenCalled()

    loadDevtools.set(false)
    await TestBed.inject(ApplicationRef).whenStable()

    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(1)

    loadDevtools.set(true)
    await TestBed.inject(ApplicationRef).whenStable()

    // Should remount (mount called twice now)
    expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(2)
    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(1)
  })

  describe('injection context', () => {
    it('should inject dependencies directly in the callback', async () => {
      const firstService = { value: 'first' }
      const secondService = { value: 'second' }
      const firstServiceToken = new InjectionToken('FirstService')
      const secondServiceToken = new InjectionToken('SecondService')
      const withDevtoolsFn = vi.fn(() => {
        const first = inject(firstServiceToken)
        const second = inject(secondServiceToken)

        return {
          loadDevtools: true,
          initialIsOpen: first === firstService && second === secondService,
        }
      })

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: firstServiceToken, useValue: firstService },
          { provide: secondServiceToken, useValue: secondService },
          provideTanStackQuery(
            () => new QueryClient(),
            withDevtools(withDevtoolsFn),
          ),
        ],
      })

      TestBed.inject(ENVIRONMENT_INITIALIZER)
      await TestBed.inject(ApplicationRef).whenStable()

      expect(withDevtoolsFn).toHaveBeenCalled()
      expect(mockTanstackQueryDevtools).toHaveBeenCalledWith(
        expect.objectContaining({ initialIsOpen: true }),
      )
    })

    it('should reactively update when an injected service changes', async () => {
      class ReactiveService {
        enabled = signal(false)
        position = signal<DevtoolsPosition>('bottom')
      }

      const withDevtoolsFn = vi.fn(() => {
        const service = inject(ReactiveService)
        return {
          loadDevtools: service.enabled,
          position: service.position,
        }
      })

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          ReactiveService,
          provideTanStackQuery(
            () => new QueryClient(),
            withDevtools(withDevtoolsFn),
          ),
        ],
      })

      TestBed.inject(ENVIRONMENT_INITIALIZER)
      await TestBed.inject(ApplicationRef).whenStable()

      const service = TestBed.inject(ReactiveService)

      expect(mockTanstackQueryDevtools).toHaveBeenCalledTimes(1)
      expect(mockDevtoolsInstance.mount).not.toHaveBeenCalled()

      service.enabled.set(true)
      await TestBed.inject(ApplicationRef).whenStable()

      expect(mockTanstackQueryDevtools).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 'bottom',
        }),
      )

      service.position.set('top')
      await TestBed.inject(ApplicationRef).whenStable()

      expect(mockDevtoolsInstance.setPosition).toHaveBeenCalledWith('top')
      expect(withDevtoolsFn).toHaveBeenCalledTimes(1)
    })
  })
})
