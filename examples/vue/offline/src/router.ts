import { createRouter, createWebHistory } from 'vue-router'
import { noop, onlineManager } from '@tanstack/vue-query'
import { queryClient } from './queryClient'
import { moviesQueries } from './services/movies/queries'
import List from './routes/List.vue'
import Detail from './routes/Detail.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: List },
    {
      path: '/:movieId',
      component: Detail,
      props: true,
      beforeEnter: async (to) => {
        const { queryKey } = moviesQueries.detail(String(to.params.movieId))
        if (
          !queryClient.getQueryData(queryKey) &&
          // do not load if we are offline or hydrating because it returns a promise that is pending until we go online again
          // we just let the Detail component handle it
          onlineManager.isOnline() &&
          !queryClient.isRestoring?.value
        ) {
          await queryClient
            .query(moviesQueries.detail(String(to.params.movieId)))
            .catch(noop)
        }
      },
    },
  ],
})
