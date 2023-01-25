import { getPostById } from '$lib/data'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params }) => {
  const { queryClient } = await parent()

  const postId = parseInt(params.postId)

  await queryClient.prefetchQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId),
  })

  return { postId }
}
