import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import type { VueQueryPluginOptions } from '@tanstack/vue-query'

const vueQueryOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        gcTime: 24 * 60 * 60 * 1000,
      },
    },
  },
}

createApp(App).use(VueQueryPlugin, vueQueryOptions).mount('#app')
