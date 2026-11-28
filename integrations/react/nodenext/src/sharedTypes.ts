import { QueryClient, getQueryData, query } from '@tanstack/query-core'
import {
  infiniteQuery,
  infiniteQueryOptions,
  isSuccess,
  queryOptions,
  skipToken,
  suspenseInfiniteQueryOptions,
  suspenseQueryOptions,
  useQuery,
} from '@tanstack/react-query'
import type { QueryMeta } from '@tanstack/react-query'

declare module '@tanstack/query-core' {
  interface Register {
    queryMeta: { shelf: 'books' }
  }
}

type Assert<Matches extends true> = Matches
type Same<A, B> = [A, B] extends [B, A] ? true : false

export type AdapterMetadata = Assert<Same<QueryMeta, { shelf: 'books' }>>

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
export const cachedTitle: string | undefined = getQueryData(
  new QueryClient(),
  book.queryKey,
)

export function useFirstBookPage() {
  const feed = useQuery(paged)
  if (isSuccess(feed)) {
    const cursor: number | undefined = feed.data.pageParams[0]
    return { cursor, first: feed.data.pages[0] }
  }
}

export function readBook(client: QueryClient): Promise<string> {
  return query(client, book)
}

export async function readPageCursors(client: QueryClient): Promise<number[]> {
  const data = await infiniteQuery(client, paged)
  return data.pageParams
}
