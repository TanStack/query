import { onlineManager } from '@tanstack/svelte-query'
import type { PageLoad } from './$types'
import { queryClient } from '$lib/queryClient'
import { moviesQueries } from '$lib/services/movies/queries'

export const load: PageLoad = async ({ parent, params: { movieId } }) => {
  await parent()
  if (
    !queryClient.getQueryData(moviesQueries.detail(movieId).queryKey) &&
    // do not load if we are offline because it returns a promise that is pending until we go online again
    // we just let the page component handle it
    onlineManager.isOnline()
  ) {
    await queryClient.query(moviesQueries.detail(movieId))
  }
  return { movieId }
}
