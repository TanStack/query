import { noop } from '@tanstack/svelte-query'
import { postsQueries } from '$lib/services/posts/queries'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, fetch }) => {
  const { queryClient } = await parent()

  await queryClient.query(postsQueries.list(10, fetch)).catch(noop)
}
