import { isVue2 } from 'vue-demi'
import { isServer } from '@tanstack/query-core'

import { QueryClient } from './queryClient'
import { getClientKey } from './utils'
import { setupDevtools } from './devtools/devtools'
import type { QueryClientConfig } from '@tanstack/query-core'

type ClientPersister = (client: QueryClient) => [() => void, Promise<void>]

interface CommonOptions {
  enableDevtoolsV6Plugin?: boolean
  queryClientKey?: string
  clientPersister?: ClientPersister
  clientPersisterOnSuccess?: (client: QueryClient) => void
}

interface ConfigOptions extends CommonOptions {
  queryClientConfig?: QueryClientConfig
}

interface ClientOptions extends CommonOptions {
  queryClient?: QueryClient
}

export type VueQueryPluginOptions = ConfigOptions | ClientOptions

export const VueQueryPlugin = {
  install: (app: any, options: VueQueryPluginOptions = {}) => {
    const clientKey = getClientKey(options.queryClientKey)
    let client: QueryClient

    if ('queryClient' in options && options.queryClient) {
      client = options.queryClient
    } else {
      const clientConfig =
        'queryClientConfig' in options ? options.queryClientConfig : undefined
      client = new QueryClient(clientConfig)
    }

    if (!isServer) {
      client.mount()
    }

    let persisterUnmount = () => {
      // noop
    }

    if (options.clientPersister) {
      client.isRestoring.value = true
      const [unmount, promise] = options.clientPersister(client)
      persisterUnmount = unmount
      promise.then(() => {
        client.isRestoring.value = false
        options.clientPersisterOnSuccess?.(client)
      })
    }

    const cleanup = () => {
      client.unmount()
      persisterUnmount()
    }

    if (app.onUnmount) {
      app.onUnmount(cleanup)
    } else {
      const originalUnmount = app.unmount
      app.unmount = function vueQueryUnmount() {
        cleanup()
        originalUnmount()
      }
    }

    if (isVue2) {
      app.mixin({
        beforeCreate() {
          // HACK: taken from provide(): https://github.com/vuejs/composition-api/blob/master/src/apis/inject.ts#L30
          if (!this._provided) {
            const provideCache = {}
            Object.defineProperty(this, '_provided', {
              get: () => provideCache,
              set: (v) => Object.assign(provideCache, v),
            })
          }

          this._provided[clientKey] = client

          if (process.env.NODE_ENV === 'development') {
            if (this === this.$root && options.enableDevtoolsV6Plugin) {
              setupDevtools(this, client)
            }
          }
        },
      })
    } else {
      app.provide(clientKey, client)

      if (process.env.NODE_ENV === 'development') {
        if (options.enableDevtoolsV6Plugin) {
          setupDevtools(app, client)
        }
      }
    }
  },
}
