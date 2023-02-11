import type { PageLoad } from './$types'

export const load: PageLoad = async ({ params }) => {
  const postId = parseInt(params.postId)
  return { postId }
}
