import { api } from '$lib/api'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, fetch, params }) => {
  const { queryClient } = await parent()

  const postId = parseInt(params.postId)

  await queryClient.prefetchQuery({
    queryKey: ['post', postId],
    queryFn: () => api(fetch).getPostById(postId),
  })

  return { postId }
}
