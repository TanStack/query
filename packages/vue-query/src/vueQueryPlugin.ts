import { isVue2 } from 'vue-demi'
import { isServer } from '@tanstack/query-core'

import { QueryClient } from './queryClient'
import { getClientKey } from './utils'
import { setupDevtools } from './devtools/devtools'
import type { QueryClientConfig } from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'

declare global {
  interface Window {
    __VUE_QUERY_CONTEXT__?: QueryClient
  }
}

type ClientPersister = (client: QueryClient) => [() => void, Promise<void>]

interface CommonOptions {
  queryClientKey?: string
  contextSharing?: boolean
  clientPersister?: ClientPersister
}

interface ConfigOptions extends CommonOptions {
  queryClientConfig?: MaybeRefDeep<QueryClientConfig>
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
      if (options.contextSharing && typeof window !== 'undefined') {
        if (!window.__VUE_QUERY_CONTEXT__) {
          const clientConfig =
            'queryClientConfig' in options
              ? options.queryClientConfig
              : undefined
          client = new QueryClient(clientConfig)
          window.__VUE_QUERY_CONTEXT__ = client
        } else {
          client = window.__VUE_QUERY_CONTEXT__
        }
      } else {
        const clientConfig =
          'queryClientConfig' in options ? options.queryClientConfig : undefined
        client = new QueryClient(clientConfig)
      }
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
      })
    }

    if (process.env.NODE_ENV !== 'production' && options.contextSharing) {
      client
        .getLogger()
        .error(
          `The contextSharing option has been deprecated and will be removed in the next major version`,
        )
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

    /* istanbul ignore next */
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
            if (this === this.$root) {
              setupDevtools(this, client)
            }
          }
        },
      })
    } else {
      app.provide(clientKey, client)

      if (process.env.NODE_ENV === 'development') {
        setupDevtools(app, client)
      }
    }
  },
}
