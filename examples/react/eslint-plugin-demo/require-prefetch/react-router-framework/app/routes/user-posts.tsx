// ❌ fails: this route module has no `loader` or `clientLoader`, so the user's posts only start
// fetching once the component renders.
import { useSuspenseQuery } from '@tanstack/react-query'
import { userPostsOptions } from '../queries'
import type { Route } from './+types/user-posts'

export default function UserPosts({ params }: Route.ComponentProps) {
  // eslint-disable-next-line @tanstack/query-prefetch/require-prefetch -- The query 'userPostsOptions(params.userId)' used by 'useSuspenseQuery' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'.
  const { data: posts } = useSuspenseQuery(userPostsOptions(params.userId))

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
