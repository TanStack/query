// ✅ passes: a nested async server component inside <Suspense> prefetches and dehydrates its own query (streaming)
import { Suspense } from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../get-query-client'
import { feedOptions } from '../queries'
import { FeedList } from './feed-list'

export default function FeedPage() {
  return (
    <main>
      <h1>Feed</h1>
      <Suspense fallback={<p>Loading feed...</p>}>
        <Feed />
      </Suspense>
    </main>
  )
}

async function Feed() {
  const queryClient = getQueryClient()
  await queryClient.prefetchInfiniteQuery(feedOptions)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FeedList />
    </HydrationBoundary>
  )
}
