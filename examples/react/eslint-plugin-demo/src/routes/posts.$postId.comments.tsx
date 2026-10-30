import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { commentsOptions } from '../queries'

// ❌ fails: the route has no loader, so the comments only start fetching after
// the component renders
export const Route = createFileRoute('/posts/$postId/comments')({
  component: Comments,
})

function Comments() {
  const { postId } = Route.useParams()
  // eslint-disable-next-line @tanstack/query-prefetch/require-prefetch -- The query 'commentsOptions(postId)' used by 'useSuspenseQuery' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'.
  const { data } = useSuspenseQuery(commentsOptions(postId))
  return data.length
}
