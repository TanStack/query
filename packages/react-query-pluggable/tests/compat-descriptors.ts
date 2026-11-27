import type {
  DefaultError,
  QueryErrorBoundaryOption,
  QueryKey,
} from '@tanstack/query-core-pluggable'

/** Pluggable factories attach an observer to a new descriptor. */
export const reusesQueryOptions = false
/** The paired descriptor preserves the inferred numeric page parameter. */
export type NumericPageParam = number

/** Pluggable results expose the direction used by the public page helpers. */
export type PageDirectionResultKeys = 'fetchDirection'
/** A caller can explicitly fetch a page before the cache contains any data. */
export type PageFailureDuringLoad = boolean
/** A full refetch has no page direction. */
export type PageFailureDuringFullRefetch = false

/** The pluggable observer also accepts an adapter-supplied boundary policy. */
export type QueryBoundaryTuple = Exclude<
  QueryErrorBoundaryOption<unknown, DefaultError, unknown, QueryKey>,
  false
>
