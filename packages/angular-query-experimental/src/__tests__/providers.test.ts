import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { TestBed } from '@angular/core/testing'
import {
  ENVIRONMENT_INITIALIZER,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core'
import { isDevMode } from '../util/is-dev-mode/is-dev-mode'
import { provideTanStackQuery, withDevtools } from '../providers'
import type { DevtoolsOptions } from '../providers'
import type { Mock } from 'vitest'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
} from '@tanstack/query-devtools'

vi.mock('../util/is-dev-mode/is-dev-mode', () => ({
  isDevMode: vi.fn(),
}))

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
  let isDevModeMock: Mock

  beforeEach(() => {
    vi.useFakeTimers()
    isDevModeMock = isDevMode as Mock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test.each([
    {
      description:
        'should provide developer tools in development mode by default',
      isDevModeValue: true,
      expectedCalled: true,
    },
    {
      description:
        'should not provide developer tools in production mode by default',
      isDevModeValue: false,
      expectedCalled: false,
    },
    {
      description: `should provide developer tools in development mode when 'loadDeveloperTools' is set to 'auto'`,
      isDevModeValue: true,
      loadDevtools: 'auto',
      expectedCalled: true,
    },
    {
      description: `should not provide developer tools in production mode when 'loadDeveloperTools' is set to 'auto'`,
      isDevModeValue: false,
      loadDevtools: 'auto',
      expectedCalled: false,
    },
    {
      description:
        "should provide developer tools in development mode when 'loadDevtools' is set to true",
      isDevModeValue: true,
      loadDevtools: true,
      expectedCalled: true,
    },
    {
      description:
        "should provide developer tools in production mode when 'loadDevtools' is set to true",
      isDevModeValue: false,
      loadDevtools: true,
      expectedCalled: true,
    },
    {
      description:
        "should not provide developer tools in development mode when 'loadDevtools' is set to false",
      isDevModeValue: true,
      loadDevtools: false,
      expectedCalled: false,
    },
    {
      description:
        "should not provide developer tools in production mode when 'loadDevtools' is set to false",
      isDevModeValue: false,
      loadDevtools: false,
      expectedCalled: false,
    },
  ])(
    '$description',
    async ({ isDevModeValue, loadDevtools, expectedCalled }) => {
      isDevModeMock.mockReturnValue(isDevModeValue)

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
      await vi.runAllTimersAsync()

      if (expectedCalled) {
        expect(mockTanstackQueryDevtools).toHaveBeenCalled()
      } else {
        expect(mockTanstackQueryDevtools).not.toHaveBeenCalled()
      }
    },
  )

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
    await vi.runAllTimersAsync()

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
    await vi.runAllTimersAsync()

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
    await vi.runAllTimersAsync()

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
    await vi.runAllTimersAsync()

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
    await vi.runAllTimersAsync()

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
    await vi.runAllTimersAsync()

    expect(mockDevtoolsInstance.mount).toHaveBeenCalledTimes(1)
    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(0)

    loadDevtools.set(false)

    TestBed.tick()

    expect(mockDevtoolsInstance.unmount).toHaveBeenCalledTimes(1)
  })
})
