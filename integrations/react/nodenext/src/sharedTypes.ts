import { QueryClient as CoreClient } from '@tanstack/query-core'
import {
  QueryClient,
  getQueryData,
  queryOptions,
} from '@tanstack/react-query-pluggable'
import type { QueryMeta as CoreMeta } from '@tanstack/query-core'
import type { QueryMeta as PluggableMeta } from '@tanstack/react-query-pluggable'

type BookMeta = { shelf: string }

declare module '@tanstack/query-core' {
  interface Register {
    queryMeta: BookMeta
  }
}

type Assert<Matches extends true> = Matches
type Same<A, B> = [A, B] extends [B, A] ? true : false

export type SharedMetadata = [
  Assert<Same<CoreMeta, BookMeta>>,
  Assert<Same<PluggableMeta, BookMeta>>,
]

const book = queryOptions({ queryKey: ['book'], queryFn: () => 'Dune' })

// Both clients infer the data type from the adapter's tagged key.
export const fromCore: string | undefined = new CoreClient().getQueryData(
  book.queryKey,
)
export const fromPluggable: string | undefined = getQueryData(
  new QueryClient(),
  book.queryKey,
)
