import { describe, expect, test, vi } from 'vitest'
import { isVue2, isVue3, ref } from 'vue-demi'
import { QueryClient } from '../queryClient'
import { VueQueryPlugin } from '../vueQueryPlugin'
import { VUE_QUERY_CLIENT } from '../utils'
import { setupDevtools } from '../devtools/devtools'
import { useQuery } from '../useQuery'
import { useQueries } from '../useQueries'
import { flushPromises } from './test-utils'
import type { App, ComponentOptions } from 'vue'
import type { Mock } from 'vitest'

vi.mock('../devtools/devtools')
vi.mock('../useQueryClient')
vi.mock('../useBaseQuery')

interface TestApp extends App {
  onUnmount: Function
  _unmount: Function
  _mixin: ComponentOptions
  _provided: Record<string, any>
  $root: TestApp
}

const testIf = (condition: boolean) => (condition ? test : test.skip)

function getAppMock(withUnmountHook = false): TestApp {
  const mock = {
    provide: vi.fn(),
    unmount: vi.fn(),
    onUnmount: withUnmountHook
      ? vi.fn((u: Function) => {
          mock._unmount = u
        })
      : undefined,
    mixin: (m: ComponentOptions): any => {
      mock._mixin = m
    },
  } as unknown as TestApp

  return mock
}

describe('VueQueryPlugin', () => {
  describe('devtools', () => {
    test('should NOT setup devtools', () => {
      const setupDevtoolsMock = setupDevtools as Mock
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock)

      expect(setupDevtoolsMock).toHaveBeenCalledTimes(0)
    })

    testIf(isVue2)('should NOT setup devtools by default', () => {
      const envCopy = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const setupDevtoolsMock = setupDevtools as Mock
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock)

      appMock.$root = appMock
      appMock._mixin.beforeCreate?.call(appMock)
      process.env.NODE_ENV = envCopy

      expect(setupDevtoolsMock).toHaveBeenCalledTimes(0)
    })

    testIf(isVue2)('should setup devtools', () => {
      const envCopy = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const setupDevtoolsMock = setupDevtools as Mock
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock, { enableDevtoolsV6Plugin: true })

      appMock.$root = appMock
      appMock._mixin.beforeCreate?.call(appMock)
      process.env.NODE_ENV = envCopy

      expect(setupDevtoolsMock).toHaveBeenCalledTimes(1)
    })

    testIf(isVue3)('should NOT setup devtools by default', () => {
      const envCopy = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const setupDevtoolsMock = setupDevtools as Mock
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock)
      process.env.NODE_ENV = envCopy

      expect(setupDevtoolsMock).toHaveBeenCalledTimes(0)
    })

    testIf(isVue3)('should setup devtools', () => {
      const envCopy = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const setupDevtoolsMock = setupDevtools as Mock
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock, { enableDevtoolsV6Plugin: true })
      process.env.NODE_ENV = envCopy

      expect(setupDevtoolsMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('when app unmounts', () => {
    test('should call unmount on each client when onUnmount is missing', () => {
      const appMock = getAppMock()
      const customClient = {
        mount: vi.fn(),
        unmount: vi.fn(),
      } as unknown as QueryClient
      const originalUnmount = appMock.unmount
      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
      })

      appMock.unmount()

      expect(appMock.unmount).not.toEqual(originalUnmount)
      expect(customClient.unmount).toHaveBeenCalledTimes(1)
      expect(originalUnmount).toHaveBeenCalledTimes(1)
    })

    test('should call onUnmount if present', () => {
      const appMock = getAppMock(true)
      const customClient = {
        mount: vi.fn(),
        unmount: vi.fn(),
      } as unknown as QueryClient
      const originalUnmount = appMock.unmount
      VueQueryPlugin.install(appMock, { queryClient: customClient })

      appMock._unmount()

      expect(appMock.unmount).toEqual(originalUnmount)
      expect(customClient.unmount).toHaveBeenCalledTimes(1)
    })
  })

  describe('when called without additional options', () => {
    testIf(isVue2)('should provide a client with default clientKey', () => {
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock)

      appMock._mixin.beforeCreate?.call(appMock)

      expect(appMock._provided).toMatchObject({
        VUE_QUERY_CLIENT: expect.any(QueryClient),
      })
    })

    testIf(isVue3)('should provide a client with default clientKey', () => {
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock)

      expect(appMock.provide).toHaveBeenCalledWith(
        VUE_QUERY_CLIENT,
        expect.any(QueryClient),
      )
    })
  })

  describe('when called with custom clientKey', () => {
    testIf(isVue2)('should provide a client with customized clientKey', () => {
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock, { queryClientKey: 'CUSTOM' })

      appMock._mixin.beforeCreate?.call(appMock)

      expect(appMock._provided).toMatchObject({
        [VUE_QUERY_CLIENT + ':CUSTOM']: expect.any(QueryClient),
      })
    })

    testIf(isVue3)('should provide a client with customized clientKey', () => {
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock, { queryClientKey: 'CUSTOM' })

      expect(appMock.provide).toHaveBeenCalledWith(
        VUE_QUERY_CLIENT + ':CUSTOM',
        expect.any(QueryClient),
      )
    })
  })

  describe('when called with custom client', () => {
    testIf(isVue2)('should provide that custom client', () => {
      const appMock = getAppMock()
      const customClient = { mount: vi.fn() } as unknown as QueryClient
      VueQueryPlugin.install(appMock, { queryClient: customClient })

      appMock._mixin.beforeCreate?.call(appMock)

      expect(customClient.mount).toHaveBeenCalled()
      expect(appMock._provided).toMatchObject({
        VUE_QUERY_CLIENT: customClient,
      })
    })

    testIf(isVue3)('should provide that custom client', () => {
      const appMock = getAppMock()
      const customClient = { mount: vi.fn() } as unknown as QueryClient
      VueQueryPlugin.install(appMock, { queryClient: customClient })

      expect(customClient.mount).toHaveBeenCalled()
      expect(appMock.provide).toHaveBeenCalledWith(
        VUE_QUERY_CLIENT,
        customClient,
      )
    })
  })

  describe('when called with custom client config', () => {
    testIf(isVue2)(
      'should instantiate a client with the provided config',
      () => {
        const appMock = getAppMock()
        const config = {
          defaultOptions: { queries: { enabled: true } },
        }
        VueQueryPlugin.install(appMock, {
          queryClientConfig: config,
        })

        appMock._mixin.beforeCreate?.call(appMock)
        const client = appMock._provided.VUE_QUERY_CLIENT as QueryClient
        const defaultOptions = client.getDefaultOptions()

        expect(defaultOptions).toEqual(config.defaultOptions)
      },
    )

    testIf(isVue3)(
      'should instantiate a client with the provided config',
      () => {
        const appMock = getAppMock()
        const config = {
          defaultOptions: { queries: { enabled: true } },
        }
        VueQueryPlugin.install(appMock, {
          queryClientConfig: config,
        })

        const client = (appMock.provide as Mock).mock.calls[0][1]
        const defaultOptions = client.getDefaultOptions()

        expect(defaultOptions).toEqual(config.defaultOptions)
      },
    )
  })

  describe('when persister is provided', () => {
    test('should properly modify isRestoring flag on queryClient', async () => {
      const appMock = getAppMock()
      const customClient = {
        mount: vi.fn(),
        isRestoring: ref(false),
      } as unknown as QueryClient

      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
        clientPersister: () => [
          vi.fn(),
          new Promise((resolve) => {
            resolve()
          }),
        ],
      })

      expect(customClient.isRestoring.value).toBeTruthy()

      await flushPromises()

      expect(customClient.isRestoring.value).toBeFalsy()
    })

    test('should delay useQuery subscription and not call fetcher if data is not stale', async () => {
      const appMock = getAppMock()
      const customClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 60,
          },
        },
      })

      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
        clientPersister: (client) => [
          vi.fn(),
          new Promise((resolve) => {
            setTimeout(() => {
              client.setQueryData(['persist'], () => ({
                foo: 'bar',
              }))
              resolve()
            }, 0)
          }),
        ],
      })

      const fnSpy = vi.fn()

      const query = useQuery(
        {
          queryKey: ['persist'],
          queryFn: fnSpy,
        },
        customClient,
      )

      expect(customClient.isRestoring.value).toBeTruthy()
      expect(query.isFetching.value).toBeFalsy()
      expect(query.data.value).toStrictEqual(undefined)
      expect(fnSpy).toHaveBeenCalledTimes(0)

      await flushPromises()

      expect(customClient.isRestoring.value).toBeFalsy()
      expect(query.data.value).toStrictEqual({ foo: 'bar' })
      expect(fnSpy).toHaveBeenCalledTimes(0)
    })

    test('should delay useQueries subscription and not call fetcher if data is not stale', async () => {
      const appMock = getAppMock()
      const customClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 60,
          },
        },
      })

      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
        clientPersister: (client) => [
          vi.fn(),
          new Promise((resolve) => {
            setTimeout(() => {
              client.setQueryData(['persist1'], () => ({
                foo1: 'bar1',
              }))
              client.setQueryData(['persist2'], () => ({
                foo2: 'bar2',
              }))
              resolve()
            }, 0)
          }),
        ],
      })

      const fnSpy = vi.fn()

      const query = useQuery(
        {
          queryKey: ['persist1'],
          queryFn: fnSpy,
        },
        customClient,
      )

      const queries = useQueries(
        {
          queries: [
            {
              queryKey: ['persist2'],
              queryFn: fnSpy,
            },
          ],
        },
        customClient,
      )

      expect(customClient.isRestoring.value).toBeTruthy()

      expect(query.isFetching.value).toBeFalsy()
      expect(query.data.value).toStrictEqual(undefined)

      expect(queries.value[0].isFetching).toBeFalsy()
      expect(queries.value[0].data).toStrictEqual(undefined)
      expect(fnSpy).toHaveBeenCalledTimes(0)

      await flushPromises()

      expect(customClient.isRestoring.value).toBeFalsy()
      expect(query.data.value).toStrictEqual({ foo1: 'bar1' })
      expect(queries.value[0].data).toStrictEqual({ foo2: 'bar2' })
      expect(fnSpy).toHaveBeenCalledTimes(0)
    })
  })
})
