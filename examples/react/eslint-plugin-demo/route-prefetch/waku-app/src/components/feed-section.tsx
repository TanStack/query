// ✅ passes: a nested async server component prefetches its own query and dehydrates it around
// the client component that reads it, so the page that renders it doesn't have to.
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../get-query-client'
import { feedOptions } from '../queries'
import { FeedList } from './feed-list'

export async function FeedSection() {
  const queryClient = getQueryClient()
  await queryClient.prefetchInfiniteQuery(feedOptions)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FeedList />
    </HydrationBoundary>
  )
}
