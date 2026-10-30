// ❌ fails: the page prefetches, but never wraps the client component in <HydrationBoundary>, so the data stays on the server
import { getQueryClient } from '../../get-query-client'
import { postOptions } from '../../queries'
import { TaggedPost } from './tagged-post'

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag } = await params
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(postOptions(tag))

  // eslint-disable-next-line @tanstack/query-prefetch/require-prefetch -- The query 'postOptions(tag)' used by 'useSuspenseQuery' in './tagged-post.tsx' is prefetched in this page, but the component isn't rendered inside a '<HydrationBoundary state={dehydrate(queryClient)}>', so the prefetched data doesn't reach the client.
  return <TaggedPost tag={tag} />
}
