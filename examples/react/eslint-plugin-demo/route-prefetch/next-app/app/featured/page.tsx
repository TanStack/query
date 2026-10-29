// ✅ passes: the page prefetches with the module constant FEATURED, and the client component gets the
// same value as the literal prop id="featured", so both build postOptions('featured')
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../get-query-client'
import { postOptions } from '../queries'
import { PostInfo } from '../posts/[id]/post-info'

const FEATURED = 'featured'

export default function FeaturedPage() {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(postOptions(FEATURED))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostInfo id="featured" />
    </HydrationBoundary>
  )
}
