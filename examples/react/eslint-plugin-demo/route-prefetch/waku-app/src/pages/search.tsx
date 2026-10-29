// ✅ passes: the page prefetches with its `query` prop and <SearchResults /> reads the same value
// from `useRouter().query` on the client.
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../get-query-client'
import { searchOptions } from '../queries'
import { SearchResults } from '../components/search-results'
import type { PageProps } from 'waku/router'

export default async function SearchPage({ query }: PageProps<'/search'>) {
  const queryClient = getQueryClient()
  void queryClient.query(searchOptions(query))
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchResults />
    </HydrationBoundary>
  )
}

// `query` is only known per request, so the page must render dynamically.
export const getConfig = async () => ({ render: 'dynamic' }) as const
