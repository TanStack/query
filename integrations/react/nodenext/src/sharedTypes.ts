import { QueryClient as CoreClient } from '@tanstack/query-core'
import { QueryClient, queryOptions } from '@tanstack/react-query-no-core'
import { QueryClient as PluggableClient } from '@tanstack/react-query-no-core-pluggable'
import type { QueryMeta as CoreMeta } from '@tanstack/query-core'
import type { QueryMeta } from '@tanstack/query-types'
import type { QueryMeta as DirectMeta } from '@tanstack/react-query-no-core'
import type { QueryMeta as PluggableMeta } from '@tanstack/react-query-no-core-pluggable'

type BookMeta = { shelf: string }

declare module '@tanstack/query-types' {
  interface Register {
    queryMeta: BookMeta
  }
}

type Assert<Matches extends true> = Matches
type Same<A, B> = [A, B] extends [B, A] ? true : false

// Consumers can augment the shared Register once for each runtime.
export type SharedMetadata = [
  Assert<Same<QueryMeta, BookMeta>>,
  Assert<Same<CoreMeta, BookMeta>>,
  Assert<Same<DirectMeta, BookMeta>>,
  Assert<Same<PluggableMeta, BookMeta>>,
]

const book = queryOptions({ queryKey: ['book'], queryFn: () => 'Dune' })

// The unique symbols on a tagged key carry its data type across packages.
export const fromCore: string | undefined = new CoreClient().getQueryData(
  book.queryKey,
)
export const fromDirect: string | undefined = new QueryClient().getQueryData(
  book.queryKey,
)
export const fromPluggable: string | undefined =
  new PluggableClient().getQueryData(book.queryKey)
