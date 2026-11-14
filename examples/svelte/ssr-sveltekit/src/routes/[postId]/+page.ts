import { noop } from '@tanstack/svelte-query'
import { postsQueries } from '$lib/services/posts/queries'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, fetch, params }) => {
  const { queryClient } = await parent()

  const postId = parseInt(params.postId)

  await queryClient.query(postsQueries.detail(postId, fetch)).catch(noop)

  return { postId }
}
