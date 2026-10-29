// ❌ fails: the post is prefetched, but there's no <HydrationBoundary>, so the data never reaches
// <PostInfo /> on the client.
import { getQueryClient } from '../get-query-client'
import { postOptions } from '../queries'
import { PostInfo } from '../components/post-info'

export default async function DraftsPage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(postOptions('latest-draft'))
  // eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'postOptions(id)' used by 'useSuspenseQuery' in '../components/post-info.tsx' is prefetched in this page, but the component isn't rendered inside a '<HydrationBoundary state={dehydrate(queryClient)}>', so the prefetched data doesn't reach the client.
  return <PostInfo id="latest-draft" />
}

export const getConfig = async () => ({ render: 'dynamic' }) as const
