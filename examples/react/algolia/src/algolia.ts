import { searchClient } from '@algolia/client-search'
import type { Hit } from '@algolia/client-search'

// From Algolia example
// https://github.com/algolia/react-instantsearch
const ALGOLIA_APP_ID = 'latency'
const ALGOLIA_SEARCH_API_KEY = '6be0576ff61c053d5f9a3225e2a90f76'

type SearchOptions = {
  indexName: string
  query: string
  pageParam: number
  hitsPerPage: number
}

export async function search<TData>({
  indexName,
  query,
  pageParam,
  hitsPerPage = 10,
}: SearchOptions): Promise<{
  hits: Array<Hit<TData>>
  nextPage: number | undefined
}> {
  const client = searchClient(ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY)

  console.log('algolia:search', { indexName, query, pageParam, hitsPerPage })

  const { hits, page, nbPages } = await client.searchSingleIndex<TData>({
    indexName,
    searchParams: { query, page: pageParam, hitsPerPage },
  })

  const nextPage = page + 1 < nbPages ? page + 1 : undefined

  return { hits, nextPage }
}
