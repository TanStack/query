// ❌ fails: the `clientLoader` prefetches the author, but `AuthorPosts`, in another file, also
// queries the author's posts, which nothing prefetches. The rule reports the `<AuthorPosts>` element
// that leads to the query.
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient, userOptions } from '../queries'
import { AuthorPosts } from '../components/author-posts'
import type { Route } from './+types/author'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  await queryClient.ensureQueryData(userOptions(params.userId))
}

export default function Author({ params }: Route.ComponentProps) {
  const { data: author } = useSuspenseQuery(userOptions(params.userId))

  return (
    <main>
      <h1>{author.name}</h1>
      {/* eslint-disable-next-line @tanstack/query-prefetch/require-prefetch -- The query 'userPostsOptions(authorId)' used by 'useSuspenseQuery' in '../components/author-posts.tsx' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'. */}
      <AuthorPosts authorId={params.userId} />
    </main>
  )
}
