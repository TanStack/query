// ❌ fails: the page prefetches with searchParams.q (undefined when missing) but the client reads useSearchParams().get('q') (null when missing)
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../get-query-client'
import { searchOptions } from '../queries'
import { SearchResults } from './search-results'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(searchOptions(q))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'searchOptions(searchParams.get('q'))' used by 'useQuery' in './search-results.tsx' reads a search param with 'useSearchParams()', which gives 'null' for a missing param, while this page prefetches it with the param from 'searchParams', which gives 'undefined', so the queries can differ. Pass the param from this page as a prop instead. */}
      <SearchResults />
    </HydrationBoundary>
  )
}
