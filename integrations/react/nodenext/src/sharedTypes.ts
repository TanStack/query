import { QueryClient as StockClient } from '@tanstack/query-core'
import { QueryClient, getQueryData } from '@tanstack/query-core-pluggable'
import { queryOptions as stockOptions } from '@tanstack/react-query'
import {
  infiniteQueryOptions,
  queryOptions,
  skipToken,
  suspenseInfiniteQueryOptions,
  suspenseQueryOptions,
} from '@tanstack/react-query-pluggable'
import type { QueryMeta as StockMeta } from '@tanstack/react-query'
import type { QueryMeta as PluggableMeta } from '@tanstack/react-query-pluggable'

declare module '@tanstack/query-core' {
  interface Register {
    queryMeta: { shelf: 'stock' }
  }
}
declare module '@tanstack/query-core-pluggable' {
  interface Register {
    queryMeta: { shelf: 'pluggable' }
  }
}

type Assert<Matches extends true> = Matches
type Same<A, B> = [A, B] extends [B, A] ? true : false

export type AdapterMetadata = [
  Assert<Same<StockMeta, { shelf: 'stock' }>>,
  Assert<Same<PluggableMeta, { shelf: 'pluggable' }>>,
]

const options = { queryKey: ['book'], queryFn: () => 'Dune' }
export const book = queryOptions(options)
export const cachedBook: typeof book = { ...book, staleTime: 30_000 }
const pageOptions = {
  queryKey: ['books', 'pages'],
  initialPageParam: 1,
  queryFn: ({ pageParam }: { pageParam: number }) => ({
    page: pageParam,
    title: 'Dune',
  }),
  getNextPageParam: (lastPage: { page: number }) => lastPage.page + 1,
}
export const paged = infiniteQueryOptions(pageOptions)
export const suspendedBook = suspenseQueryOptions(options)
export const suspendedPages = suspenseInfiniteQueryOptions(pageOptions)
export function optionalBook(enabled: boolean) {
  return suspenseQueryOptions({
    ...options,
    queryFn: enabled ? options.queryFn : skipToken,
  })
}
export function optionalPages(enabled: boolean) {
  return suspenseInfiniteQueryOptions({
    ...pageOptions,
    queryFn: enabled ? pageOptions.queryFn : skipToken,
  })
}
export const fromStock: string | undefined = new StockClient().getQueryData(
  stockOptions(options).queryKey,
)
export const fromPluggable: string | undefined = getQueryData(
  new QueryClient(),
  book.queryKey,
)
