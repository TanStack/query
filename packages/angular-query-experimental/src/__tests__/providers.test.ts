import { beforeEach, describe, expect, test, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { TestBed } from '@angular/core/testing'
import { ENVIRONMENT_INITIALIZER } from '@angular/core'
import { isDevMode } from '../util/is-dev-mode/is-dev-mode'
import { provideTanStackQuery, withDevtools } from '../providers'
import type { DevtoolsOptions } from '../providers'
import type { Mock } from 'vitest'

vi.mock('../util/is-dev-mode/is-dev-mode', () => ({
  isDevMode: vi.fn(),
}))

const mockDevtoolsInstance = {
  mount: vi.fn(),
  unmount: vi.fn(),
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
})
