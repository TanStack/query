import type {
  DefaultedQueryObserverOptions,
  Query,
  QueryClient,
  QueryObserver,
  QueryObserverResult,
  QueryObserverResultReader,
} from '@tanstack/query-core-pluggable'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'

/** The observer chosen by a React option factory. Enumerable so descriptor spreads preserve it. */
export const observerKey = Symbol('queryObserver')

type Options = DefaultedQueryObserverOptions<any, any, any, any, any>
type Result = QueryObserverResult<any, any>
type CachedQuery = Query<any, any, any, any>

/** Render behavior selected by a single-query or parallel-query factory. */
export interface QueryRenderPolicy<TSuspense extends boolean = boolean> {
  /** Whether the observer uses Suspense defaults. */
  readonly suspense: TSuspense
  /** Adjusts the observer options before reading its snapshot. */
  prepare: (
    options: Options,
    boundary: QueryErrorResetBoundaryValue,
    query: CachedQuery | undefined,
  ) => void
  /** Checks whether a settled error belongs to the nearest error boundary. */
  shouldThrow: (result: Result, options: Options, query: CachedQuery) => boolean
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
