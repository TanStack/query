import { createRouter } from '@tanstack/vue-router'
import { queryClient } from './queryClient'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/vue-router' {
  interface Register {
    router: typeof router
  }
}
