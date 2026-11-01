import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
  const postId = parseInt(params.postId)
  return { postId }
}
