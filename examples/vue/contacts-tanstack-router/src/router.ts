import { h } from 'vue'
import { createRouter } from '@tanstack/vue-router'
import ErrorPage from './ErrorPage.vue'
import { queryClient } from './queryClient'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: ErrorPage,
  defaultNotFoundComponent: () =>
    h(ErrorPage, { error: new Error('Not Found') }),
})

declare module '@tanstack/vue-router' {
  interface Register {
    router: typeof router
  }
}
