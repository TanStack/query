import { noop } from '@tanstack/svelte-query'
import type { PageLoad } from './$types'
import { api } from '$lib/api'

export const load: PageLoad = async ({ parent, fetch, params }) => {
  const { queryClient } = await parent()

  const postId = parseInt(params.postId)

  await queryClient
    .query({
      queryKey: ['post', postId],
      queryFn: () => api(fetch).getPostById(postId),
    })
    .catch(noop)

  return { postId }
}
