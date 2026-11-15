import {
  QueryClient,
  VueQueryPlugin,
  dehydrate,
  hydrate,
} from '@tanstack/vue-query'
import type { DehydratedState } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query')

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  })

  nuxt.vueApp.use(VueQueryPlugin, { queryClient })

  if (import.meta.server) {
    nuxt.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient)
    })
  }

  if (import.meta.client) {
    nuxt.hooks.hook('app:created', () => {
      if (vueQueryState.value) {
        hydrate(queryClient, vueQueryState.value)
      }
    })
  }
})
