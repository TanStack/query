import type {
  DefaultError,
  QueryErrorBoundaryOption,
  QueryKey,
} from '@tanstack/query-core'

/** The boundary rule an adapter can attach to observer options. */
export type QueryBoundaryTuple = Exclude<
  QueryErrorBoundaryOption<unknown, DefaultError, unknown, QueryKey>,
  false
>
