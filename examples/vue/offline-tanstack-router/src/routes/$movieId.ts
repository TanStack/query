import { noop, onlineManager } from '@tanstack/vue-query'
import { createFileRoute } from '@tanstack/vue-router'
import { moviesQueries } from '../services/movies/queries'

export const Route = createFileRoute('/$movieId')({
  loader: async ({ context: { queryClient }, params: { movieId } }) => {
    const { queryKey } = moviesQueries.detail(movieId)
    if (
      !queryClient.getQueryData(queryKey) &&
      // do not load if we are offline or hydrating because it returns a promise that is pending until we go online again
      // we just let the component handle it
      onlineManager.isOnline() &&
      !queryClient.isRestoring?.value
    ) {
      await queryClient.query(moviesQueries.detail(movieId)).catch(noop)
    }
  },
})
