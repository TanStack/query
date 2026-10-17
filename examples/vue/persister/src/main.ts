import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import type { VueQueryPluginOptions } from '@tanstack/vue-query'

const vueQueryOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24,
        // staleTime: 1000 * 10,
      },
    },
  },
}

createApp(App).use(VueQueryPlugin, vueQueryOptions).mount('#app')
