import type {
  DefaultedQueryObserverOptions,
  QueryClient,
  QueryErrorBoundaryPolicy,
  QueryObserver,
  QueryObserverResult,
  QueryObserverResultReader,
} from '@tanstack/query-core-pluggable'
import type { Context } from 'react'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'

/** The observer chosen by a React option factory. Enumerable so descriptor spreads preserve it. */
export const observerKey = Symbol('queryObserver')

type Options = DefaultedQueryObserverOptions<any, any, any, any, any>
type Result = QueryObserverResult<any, any>

/** The optional behavior supplied by the error-boundary feature. */
export type QueryBoundaryPolicy = QueryErrorBoundaryPolicy<
  Context<QueryErrorResetBoundaryValue>,
  QueryErrorResetBoundaryValue
>

/** Render behavior selected by a single-query or parallel-query factory. */
export interface QueryRenderPolicy<TSuspense extends boolean = boolean> {
  /** Whether the observer uses Suspense defaults. */
  readonly suspense: TSuspense
  /** Adjusts the observer options before reading its snapshot. */
  prepare?: (options: Options) => void
  /** An optional policy for throwing errors during render. */
  errorBoundary?: QueryBoundaryPolicy
  /** May start a render-time fetch and read its promise with React.use. */
  readQuery?: (
    options: Options,
    reader: QueryObserverResultReader<Result>,
    observer: QueryObserver<any, any, any, any, any>,
    client: QueryClient,
    boundary: QueryErrorResetBoundaryValue,
  ) => void
}

/** A prepared descriptor selects its observer and its render behavior. */
export interface QueryDescriptor<TObserver> {
  /** The constructor to use for this observer. */
  readonly [observerKey]: TObserver
  /** The behavior selected by the option factory. */
  readonly renderPolicy: QueryRenderPolicy
}
