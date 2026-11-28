import {
  getQueryData,
  noop,
  onlineManager,
  query,
} from '@tanstack/svelte-query'
import { queryClient } from '$lib/queryClient'
import { moviesQueries } from '$lib/services/movies/queries'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params: { movieId } }) => {
  await parent()
  if (
    !getQueryData(queryClient, moviesQueries.detail(movieId).queryKey) &&
    // do not load if we are offline because it returns a promise that is pending until we go online again
    // we just let the page component handle it
    onlineManager.isOnline()
  ) {
    await query(queryClient, moviesQueries.detail(movieId)).catch(noop)
  }
  return { movieId }
}
