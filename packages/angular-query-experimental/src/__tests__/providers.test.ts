import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { TestBed } from '@angular/core/testing'
import {
  ENVIRONMENT_INITIALIZER,
  PLATFORM_ID,
  provideExperimentalZonelessChangeDetection,
  signal,
} from '@angular/core'
import {
  QueryFeatureKind,
  provideTanStackQuery,
  withDevtools,
} from '../providers'
import type { DevtoolsOptions } from '../providers'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
} from '@tanstack/query-devtools'

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

describe('withDevtools feature', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('tree shaking', () => {
    it('should return empty providers when ngDevMode and withDevtoolsFn are undefined', () => {
      vi.stubGlobal('ngDevMode', undefined)
      const feature = withDevtools()
      expect(feature.ɵkind).toEqual(QueryFeatureKind.DeveloperTools)
      expect(feature.ɵproviders.length).toEqual(0)
    })

    it('should return providers when ngDevMode is undefined and withDevtoolsFn is defined', () => {
      vi.stubGlobal('ngDevMode', undefined)
      const feature = withDevtools(() => ({}))
      expect(feature.ɵkind).toEqual(QueryFeatureKind.DeveloperTools)
      expect(feature.ɵproviders.length).toBeGreaterThan(0)
    })

    it('should return providers when ngDevMode is defined and withDevtoolsFn is undefined', () => {
      vi.stubGlobal('ngDevMode', {})
      const feature = withDevtools()
      expect(feature.ɵkind).toEqual(QueryFeatureKind.DeveloperTools)
      expect(feature.ɵproviders.length).toBeGreaterThan(0)
    })
  })

  test.each([
    {
      description:
        'should provide developer tools in development mode by default',
      isDevMode: true,
      expectedCalled: true,
    },
    {
      description:
        'should not provide developer tools in production mode by default',
      isDevMode: false,
      expectedCalled: false,
    },
    {
      description: `should provide developer tools in development mode when 'loadDeveloperTools' is set to 'auto'`,
      isDevMode: true,
      loadDevtools: 'auto',
      expectedCalled: true,
    },
    {
      description: `should not provide developer tools in production mode when 'loadDeveloperTools' is set to 'auto'`,
      isDevMode: false,
      loadDevtools: 'auto',
      expectedCalled: false,
    },
    {
      description:
        "should provide developer tools in development mode when 'loadDevtools' is set to true",
      isDevMode: true,
      loadDevtools: true,
      expectedCalled: true,
    },
    {
      description:
        "should provide developer tools in production mode when 'loadDevtools' is set to true",
      isDevMode: false,
      loadDevtools: true,
      expectedCalled: true,
    },
    {
      description:
        "should not provide developer tools in development mode when 'loadDevtools' is set to false",
      isDevMode: true,
      loadDevtools: false,
      expectedCalled: false,
    },
    {
      description:
        "should not provide developer tools in production mode when 'loadDevtools' is set to false",
      isDevMode: false,
      loadDevtools: false,
      expectedCalled: false,
    },
  ])('$description', async ({ isDevMode, loadDevtools, expectedCalled }) => {
    vi.stubGlobal('ngDevMode', isDevMode ? {} : undefined)

    const providers = [
      provideExperimentalZonelessChangeDetection(),
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
    await vi.runAllTimersAsync()
    TestBed.flushEffects()
    await vi.dynamicImportSettled()
    TestBed.flushEffects()
    await vi.dynamicImportSettled()

    if (expectedCalled) {
      expect(mockTanstackQueryDevtools).toHaveBeenCalled()
    } else {
      expect(mockTanstackQueryDevtools).not.toHaveBeenCalled()
    }
  })

  it('should not load devtools if injector is destroyed', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
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
    await vi.runAllTimersAsync()

    expect(mockTanstackQueryDevtools).not.toHaveBeenCalled()
  })

  it('should not load devtools if platform is not browser', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PLATFORM_ID,
          useValue: 'server',
        },
        provideExperimentalZonelessChangeDetection(),
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
        provideExperimentalZonelessChangeDetection(),
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
    await vi.runAllTimersAsync()

    TestBed.flushEffects()

    expect(mockDevtoolsInstance.setErrorTypes).toHaveBeenCalledTimes(0)

    errorTypes.set([
      {
        name: '',
        initializer: () => new Error(),
      },
    ])

    TestBed.flushEffects()

    expect(mockDevtoolsInstance.setErrorTypes).toHaveBeenCalledTimes(1)
  })

  it('should update client', async () => {
    const client = signal(new QueryClient())

    TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
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
    await vi.runAllTimersAsync()

    TestBed.flushEffects()

    expect(mockDevtoolsInstance.setClient).toHaveBeenCalledTimes(0)

    client.set(new QueryClient())

    TestBed.flushEffects()

    expect(mockDevtoolsInstance.setClient).toHaveBeenCalledTimes(1)
  })

  it('should update position', async () => {
    const position = signal<DevtoolsPosition>('top')

    TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
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
    await vi.runAllTimersAsync()

    TestBed.flushEffects()

    expect(mockDevtoolsInstance.setPosition).toHaveBeenCalledTimes(0)

    position.set('left')

    TestBed.flushEffects()

    expect(mockDevtoolsInstance.setPosition).toHaveBeenCalledTimes(1)
  })

  it('should update button position', async () => {
    const buttonPosition = signal<DevtoolsButtonPosition>('bottom-left')

    TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
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
    await vi.runAllTimersAsync()

    TestBed.flushEffects()

    expect(mockDevtoolsInstance.setButtonPosition).toHaveBeenCalledTimes(0)

    buttonPosition.set('bottom-right')

    TestBed.flushEffects()

    expect(mockDevtoolsInstance.setButtonPosition).toHaveBeenCalledTimes(1)
  })

  it('should update initialIsOpen', async () => {
    const initialIsOpen = signal(false)

    TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
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
    await vi.runAllTimersAsync()

    TestBed.flushEffects()

    expect(mockDevtoolsInstance.setInitialIsOpen).toHaveBeenCalledTimes(0)

    initialIsOpen.set(true)

    TestBed.flushEffects()

    expect(mockDevtoolsInstance.setInitialIsOpen).toHaveBeenCalledTimes(1)
  })

  it('should destroy devtools', async () => {
    const loadDevtools = signal(true)

    TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideTanStackQuery(
          new QueryClient(),
          withDevtools(() => ({
            loadDevtools: loadDevtools(),
          })),
        ),
      ],
    })

    TestBed.inject(ENVIRONMENT_INITIALIZER)
    await vi.runAllTimersAsync()

    expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(0)

    loadDevtools.set(false)

    TestBed.flushEffects()

    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(1)
  })
})
