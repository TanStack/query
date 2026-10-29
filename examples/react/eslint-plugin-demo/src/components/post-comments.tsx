import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { commentsOptions } from '../queries'

// Components in other files read route values through getRouteApi. The rule
// follows them from the route that renders them.
const routeApi = getRouteApi('/posts/$postId')

export function PostComments() {
  const { postId } = routeApi.useParams()
  const { data } = useSuspenseQuery(commentsOptions(postId))
  return data.length
}
