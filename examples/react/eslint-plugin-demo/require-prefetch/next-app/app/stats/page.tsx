// ✅ passes: the page and the client component pass inline options with the same queryKey, so the
// prefetched query is the one the component reads.
// The client's inline `useQuery` options also trigger the separate prefer-query-options rule (the
// server's `prefetchQuery` call doesn't), so it's disabled on that one line in ./stats-panel.tsx to
// show that require-prefetch matches inline options too. In real code, sharing a
// queryOptions() result avoids both the duplicated queryKey and the disable.
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../get-query-client'
import { getStats } from './get-stats'
import { StatsPanel } from './stats-panel'

export default function StatsPage() {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery({ queryKey: ['stats'], queryFn: getStats })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StatsPanel />
    </HydrationBoundary>
  )
}
