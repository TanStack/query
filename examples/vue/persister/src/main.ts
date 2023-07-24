import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import type { VueQueryPluginOptions } from '@tanstack/vue-query'

import App from './App.vue'

const vueQueryOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24,
        staleTime: 1000 * 60 * 60 * 24,
      },
    },
  },
  clientPersister: (queryClient) => {
    return persistQueryClient({
      queryClient,
      persister: createSyncStoragePersister({ storage: localStorage }),
    })
  },
}

createApp(App).use(VueQueryPlugin, vueQueryOptions).mount('#app')
