import * as core from '@tanstack/query-core'
import {
  environmentManager,
  getDefaultOptions,
  isFetching,
} from '@tanstack/query-core'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setupDevtools } from '../devtools/devtools'
import { QueryClient, setQueryData } from '../queryClient'
import { useQueries } from '../useQueries'
import { useQuery } from '../useQuery'
import { VUE_QUERY_CLIENT } from '../utils'
import { VueQueryPlugin } from '../vueQueryPlugin'
import type { App } from 'vue'

vi.mock(import('../devtools/devtools'))
vi.mock(import('../useQueryClient'))
vi.mock(import('../useBaseQuery'))

type UnmountCallback = () => void

interface TestApp extends App {
  onUnmount: UnmountCallback
  _unmount: UnmountCallback
}

function getAppMock(withUnmountHook = false): TestApp {
  const mock = {
    provide: vi.fn<TestApp['provide']>(),
    unmount: vi.fn<TestApp['unmount']>(),
    onUnmount: withUnmountHook
      ? vi.fn<(u: UnmountCallback) => void>((u: UnmountCallback) => {
          mock._unmount = u
        })
      : undefined,
  } as unknown as TestApp

  return mock
}

describe('VueQueryPlugin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(core, 'mountQueryClient')
    vi.spyOn(core, 'unmountQueryClient')
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

    it('should NOT setup devtools by default in Vue 3', () => {
      const envCopy = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const setupDevtoolsMock = vi.mocked(setupDevtools)
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock)
      process.env.NODE_ENV = envCopy

      expect(setupDevtoolsMock).toHaveBeenCalledTimes(0)
    })

    it('should setup devtools in Vue 3', () => {
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
      const customClient = new QueryClient()
      const originalUnmount = appMock.unmount
      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
      })

      appMock.unmount()

      expect(appMock.unmount).not.toStrictEqual(originalUnmount)
      expect(core.unmountQueryClient).toHaveBeenCalledExactlyOnceWith(
        customClient,
      )
      expect(originalUnmount).toHaveBeenCalledTimes(1)
    })

    it('should call onUnmount if present', () => {
      const appMock = getAppMock(true)
      const customClient = new QueryClient()
      const originalUnmount = appMock.unmount
      VueQueryPlugin.install(appMock, { queryClient: customClient })

      appMock._unmount()

      expect(appMock.unmount).toStrictEqual(originalUnmount)
      expect(core.unmountQueryClient).toHaveBeenCalledExactlyOnceWith(
        customClient,
      )
    })
  })

  describe('when called without additional options', () => {
    it('should provide a client with default clientKey in Vue 3', () => {
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock)

      expect(appMock.provide).toHaveBeenCalledWith(
        VUE_QUERY_CLIENT,
        expect.any(QueryClient),
      )
    })
  })

  describe('when called with custom clientKey', () => {
    it('should provide a client with customized clientKey in Vue 3', () => {
      const appMock = getAppMock()
      VueQueryPlugin.install(appMock, { queryClientKey: 'CUSTOM' })

      expect(appMock.provide).toHaveBeenCalledWith(
        VUE_QUERY_CLIENT + ':CUSTOM',
        expect.any(QueryClient),
      )
    })
  })

  describe('when called with custom client', () => {
    it('should provide that custom client in Vue 3', () => {
      const appMock = getAppMock()
      const customClient = new QueryClient()
      VueQueryPlugin.install(appMock, { queryClient: customClient })

      expect(core.mountQueryClient).toHaveBeenCalledWith(customClient)
      expect(appMock.provide).toHaveBeenCalledWith(
        VUE_QUERY_CLIENT,
        customClient,
      )
    })
  })

  describe('when running on the server', () => {
    it('should not mount the client', () => {
      vi.spyOn(environmentManager, 'isServer').mockReturnValue(true)

      const appMock = getAppMock()
      const customClient = new QueryClient()
      const mountSpy = vi.spyOn(core, 'mountQueryClient')

      VueQueryPlugin.install(appMock, { queryClient: customClient })

      expect(mountSpy).not.toHaveBeenCalled()
    })
  })

  describe('when called with custom client config', () => {
    it('should instantiate a client with the provided config in Vue 3', () => {
      const appMock = getAppMock()
      const config = {
        defaultOptions: { queries: { enabled: true } },
      }
      VueQueryPlugin.install(appMock, {
        queryClientConfig: config,
      })

      const client = vi.mocked(appMock.provide).mock
        .calls[0]?.[1] as QueryClient
      const defaultOptions = getDefaultOptions(client)

      expect(defaultOptions).toStrictEqual(config.defaultOptions)
    })
  })

  describe('when persister is provided', () => {
    it('should properly modify isRestoring flag on queryClient', async () => {
      const appMock = getAppMock()
      const customClient = new QueryClient()

      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
        clientPersister: () => [
          vi.fn<() => void>(),
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
      const clientPersisterOnSuccess = vi.fn<(client: QueryClient) => void>()

      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
        clientPersister: () => [vi.fn<() => void>(), sleep(10)],
        clientPersisterOnSuccess,
      })

      expect(clientPersisterOnSuccess).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(10)
      expect(clientPersisterOnSuccess).toHaveBeenCalledTimes(1)
      expect(clientPersisterOnSuccess).toHaveBeenCalledWith(customClient)
    })

    it('should reset isRestoring and not call clientPersisterOnSuccess when restoring fails', async () => {
      const key = createKey()
      const appMock = getAppMock()
      const customClient = new QueryClient()
      const clientPersisterOnSuccess = vi.fn<(client: QueryClient) => void>()

      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
        clientPersister: () => [
          vi.fn<() => void>(),
          Promise.reject(new Error('Error restoring client')),
        ],
        clientPersisterOnSuccess,
      })

      const queryFn = vi.fn<() => string>(() => 'data')
      useQuery({ queryKey: key, queryFn }, customClient)

      expect(customClient.isRestoring?.value).toBe(true)
      expect(queryFn).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(0)
      expect(customClient.isRestoring?.value).toBe(false)
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(clientPersisterOnSuccess).not.toHaveBeenCalled()
    })

    it('should call the unmount returned by clientPersister when the app unmounts', () => {
      const appMock = getAppMock(true)
      const customClient = new QueryClient()
      const persisterUnmount = vi.fn<() => void>()

      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
        clientPersister: () => [persisterUnmount, sleep(10)],
      })

      expect(persisterUnmount).not.toHaveBeenCalled()

      appMock._unmount()

      expect(persisterUnmount).toHaveBeenCalledTimes(1)
    })

    it('should delay useQuery subscription and not call fetcher if data is not stale', async () => {
      const key = createKey()
      const appMock = getAppMock()
      const customClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 60 * 1000,
          },
        },
      })

      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
        clientPersister: (client) => [
          vi.fn<() => void>(),
          new Promise((resolve) => {
            setTimeout(() => {
              setQueryData(client, key, () => ({
                foo: 'bar',
              }))
              resolve()
            }, 0)
          }),
        ],
      })

      const queryFn = vi.fn<() => { foo: string }>()

      const query = useQuery(
        {
          queryKey: key,
          queryFn,
        },
        customClient,
      )

      expect(customClient.isRestoring?.value).toBe(true)
      expect(isFetching(query.state)).toBe(false)
      expect(query.data.value).toBeUndefined()
      expect(queryFn).toHaveBeenCalledTimes(0)
      await vi.advanceTimersByTimeAsync(0)
      expect(customClient.isRestoring?.value).toBe(false)
      expect(query.data.value).toStrictEqual({ foo: 'bar' })
      expect(queryFn).toHaveBeenCalledTimes(0)
    })

    it('should delay useQueries subscription and not call fetcher if data is not stale', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const appMock = getAppMock()
      const customClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 60 * 1000,
          },
        },
      })

      VueQueryPlugin.install(appMock, {
        queryClient: customClient,
        clientPersister: (client) => [
          vi.fn<() => void>(),
          new Promise((resolve) => {
            setTimeout(() => {
              setQueryData(client, key1, () => ({
                foo1: 'bar1',
              }))
              setQueryData(client, key2, () => ({
                foo2: 'bar2',
              }))
              resolve()
            }, 0)
          }),
        ],
      })

      const queryFn = vi.fn<() => Record<string, string>>()

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

      expect(isFetching(query.state)).toBe(false)
      expect(query.data.value).toBeUndefined()

      expect(isFetching(queries.value[0])).toBe(false)
      expect(queries.value[0].data).toBeUndefined()
      expect(queryFn).toHaveBeenCalledTimes(0)
      await vi.advanceTimersByTimeAsync(0)
      expect(customClient.isRestoring?.value).toBe(false)
      expect(query.data.value).toStrictEqual({ foo1: 'bar1' })
      expect(queries.value[0].data).toStrictEqual({ foo2: 'bar2' })
      expect(queryFn).toHaveBeenCalledTimes(0)
    })
  })
})
