export type SearchOptions = {
  indexName: string
  query: string
  pageParam: number
  hitsPerPage: number
}

export type SearchResponse<TData> = {
  hits: Array<TData & { objectID: string }>
  nbPages: number
}
