import type { Hit } from '@algolia/client-search'

export type SearchOptions = {
  indexName: string
  query: string
  pageParam: number
  hitsPerPage: number
}

export type SearchResponse<TData> = {
  hits: Array<Hit<TData>>
  nbPages: number
}
