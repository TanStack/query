import type {
  DefaultError,
  QueryErrorBoundaryOption,
  QueryKey,
} from '@tanstack/query-core-pluggable'

/** The pluggable observer also accepts an adapter-supplied boundary policy. */
export type QueryBoundaryTuple = Exclude<
  QueryErrorBoundaryOption<unknown, DefaultError, unknown, QueryKey>,
  false
>
