import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isVue2, isVue3, ref } from 'vue-demi'
import { environmentManager } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient } from '../queryClient'
import { VueQueryPlugin } from '../vueQueryPlugin'
import { VUE_QUERY_CLIENT } from '../utils'
import { setupDevtools } from '../devtools/devtools'
import { useQuery } from '../useQuery'
import { useQueries } from '../useQueries'
import type { App, ComponentOptions } from 'vue'

vi.mock('../devtools/devtools')
vi.mock('../useQueryClient')
vi.mock('../useBaseQuery')

type UnmountCallback = () => void

interface TestApp extends App {
  onUnmount: UnmountCallback
  _unmount: UnmountCallback
  _mixin: ComponentOptions
  _provided: Record<string, any>
  $root: TestApp
}

const itIf = (condition: boolean) => (condition ? it : it.skip)

function getAppMock(withUnmountHook = false): TestApp {
  const mock = {
    provide: vi.fn(),
    unmount: vi.fn(),
    onUnmount: withUnmountHook
      ? vi.fn((u: UnmountCallback) => {
          mock._unmount = u
        })
      : undefined,
    mixin: (m: ComponentOptions) => {
      mock._mixin = m
    },
  } as unknown as TestApp

  return mock
}

describe('VueQueryPlugin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('devtools', () => {
    it('should NOT setup devtools', () => {
      const setupDevtoolsMock = vi.mocked(setupDevtools)
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock)
      expect(setupDevtoolsMock).toHaveBeenCalledTimes(0)
    })

    itIf(isVue2)('should NOT setup devtools by default', () => {
      const envCopy = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const setupDevtoolsMock = vi.mocked(setupDevtools)
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock)

      appMock.$root = appMock
      appMock._mixin.beforeCreate?.call(appMock)
      process.env.NODE_ENV = envCopy

      expect(setupDevtoolsMock).toHaveBeenCalledTimes(0)
    })

    itIf(isVue2)('should setup devtools', () => {
      const envCopy = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const setupDevtoolsMock = vi.mocked(setupDevtools)
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock, { enableDevtoolsV6Plugin: true })

      appMock.$root = appMock
      appMock._mixin.beforeCreate?.call(appMock)
      process.env.NODE_ENV = envCopy

      expect(setupDevtoolsMock).toHaveBeenCalledTimes(1)
    })

    itIf(isVue3)('should NOT setup devtools by default', () => {
      const envCopy = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const setupDevtoolsMock = vi.mocked(setupDevtools)
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock)
      process.env.NODE_ENV = envCopy

      expect(setupDevtoolsMock).toHaveBeenCalledTimes(0)
    })

    itIf(isVue3)('should setup devtools', () => {
      const envCopy = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const setupDevtoolsMock = vi.mocked(setupDevtools)
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock, { enableDevtoolsV6Plugin: true })
      process.env.NODE_ENV = envCopy

      expect(setupDevtoolsMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('when app unmounts', () => {
    it('should call unmount on each client when onUnmount is missing', () => {
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

    it('should call onUnmount if present', () => {
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
    itIf(isVue2)('should provide a client with default clientKey', () => {
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock)

      appMock._mixin.beforeCreate?.call(appMock)

      expect(appMock._provided).toMatchObject({
        VUE_QUERY_CLIENT: expect.any(QueryClient),
      })
    })

    itIf(isVue3)('should provide a client with default clientKey', () => {
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock)
      expect(appMock.provide).toHaveBeenCalledWith(
        VUE_QUERY_CLIENT,
        expect.any(QueryClient),
      )
    })
  })

  describe('when called with custom clientKey', () => {
    itIf(isVue2)('should provide a client with customized clientKey', () => {
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock, { queryClientKey: 'CUSTOM' })

      appMock._mixin.beforeCreate?.call(appMock)

      expect(appMock._provided).toMatchObject({
        [VUE_QUERY_CLIENT + ':CUSTOM']: expect.any(QueryClient),
      })
    })

    itIf(isVue3)('should provide a client with customized clientKey', () => {
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock, { queryClientKey: 'CUSTOM' })
      expect(appMock.provide).toHaveBeenCalledWith(
        VUE_QUERY_CLIENT + ':CUSTOM',
        expect.any(QueryClient),
      )
    })
  })

  describe('when called with custom client', () => {
    itIf(isVue2)('should provide that custom client', () => {
      const appMock = getAppMock()
      const customClient = { mount: vi.fn() } as unknown as QueryClient
      VueQueryPlugin.install(appMock, { queryClient: customClient })

      appMock._mixin.beforeCreate?.call(appMock)

      expect(customClient.mount).toHaveBeenCalled()
      expect(appMock._provided).toMatchObject({
        VUE_QUERY_CLIENT: customClient,
      })
    })

    itIf(isVue3)('should provide that custom client', () => {
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

  describe('when running on the server', () => {
    it('should not mount the client', ({ onTestFinished }) => {
      const isServerSpy = vi
        .spyOn(environmentManager, 'isServer')
        .mockReturnValue(true)
      onTestFinished(() => {
        isServerSpy.mockRestore()
      })

      const appMock = getAppMock()
      const customClient = new QueryClient()
      const mountSpy = vi.spyOn(customClient, 'mount')

      VueQueryPlugin.install(appMock, { queryClient: customClient })
      expect(mountSpy).not.toHaveBeenCalled()
    })
  })

  describe('when called with custom client config', () => {
    itIf(isVue2)('should instantiate a client with the provided config', () => {
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
    })

    itIf(isVue3)('should instantiate a client with the provided config', () => {
      const appMock = getAppMock()
      const config = {
        defaultOptions: { queries: { enabled: true } },
      }
      VueQueryPlugin.install(appMock, {
        queryClientConfig: config,
      })

      const client = vi.mocked(appMock.provide).mock
        .calls[0]?.[1] as QueryClient
      const defaultOptions = client.getDefaultOptions()

      expect(defaultOptions).toEqual(config.defaultOptions)
    })
  })

  describe('when persister is provided', () => {
    it('should properly modify isRestoring flag on queryClient', async () => {
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
      expect(customClient.isRestoring?.value).toBe(true)

      await vi.advanceTimersByTimeAsync(0)
      expect(customClient.isRestoring?.value).toBe(false)
    })

    it('should call clientPersisterOnSuccess with the client after restoring', async () => {
      const appMock = getAppMock()
      const customClient = new QueryClient()
      const clientPersisterOnSuccess = vi.fn()

      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
        clientPersister: () => [vi.fn(), sleep(10)],
        clientPersisterOnSuccess,
      })
      expect(clientPersisterOnSuccess).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(10)
      expect(clientPersisterOnSuccess).toHaveBeenCalledTimes(1)
      expect(clientPersisterOnSuccess).toHaveBeenCalledWith(customClient)
    })

    it('should call the unmount returned by clientPersister when the app unmounts', () => {
      const appMock = getAppMock(true)
      const customClient = new QueryClient()
      const persisterUnmount = vi.fn()

      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
        clientPersister: () => [persisterUnmount, sleep(10)],
      })
      expect(persisterUnmount).not.toHaveBeenCalled()

      appMock._unmount()
      expect(persisterUnmount).toHaveBeenCalledTimes(1)
    })

    it('should delay useQuery subscription and not call fetcher if data is not stale', async () => {
      const key = queryKey()
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
              client.setQueryData(key, () => ({
                foo: 'bar',
              }))
              resolve()
            }, 0)
          }),
        ],
      })

      const queryFn = vi.fn()

      const query = useQuery(
        {
          queryKey: key,
          queryFn,
        },
        customClient,
      )

      expect(customClient.isRestoring?.value).toBe(true)
      expect(query.isFetching.value).toBe(false)
      expect(query.data.value).toStrictEqual(undefined)
      expect(queryFn).toHaveBeenCalledTimes(0)

      await vi.advanceTimersByTimeAsync(0)
      expect(customClient.isRestoring?.value).toBe(false)
      expect(query.data.value).toStrictEqual({ foo: 'bar' })
      expect(queryFn).toHaveBeenCalledTimes(0)
    })

    it('should delay useQueries subscription and not call fetcher if data is not stale', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
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
              client.setQueryData(key1, () => ({
                foo1: 'bar1',
              }))
              client.setQueryData(key2, () => ({
                foo2: 'bar2',
              }))
              resolve()
            }, 0)
          }),
        ],
      })

      const queryFn = vi.fn()

      const query = useQuery(
        {
          queryKey: key1,
          queryFn,
        },
        customClient,
      )

      const queries = useQueries(
        {
          queries: [
            {
              queryKey: key2,
              queryFn,
            },
          ],
        },
        customClient,
      )

      expect(customClient.isRestoring?.value).toBe(true)

      expect(query.isFetching.value).toBe(false)
      expect(query.data.value).toStrictEqual(undefined)

      expect(queries.value[0].isFetching).toBe(false)
      expect(queries.value[0].data).toStrictEqual(undefined)
      expect(queryFn).toHaveBeenCalledTimes(0)

      await vi.advanceTimersByTimeAsync(0)
      expect(customClient.isRestoring?.value).toBe(false)
      expect(query.data.value).toStrictEqual({ foo1: 'bar1' })
      expect(queries.value[0].data).toStrictEqual({ foo2: 'bar2' })
      expect(queryFn).toHaveBeenCalledTimes(0)
    })
  })
})
