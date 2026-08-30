import { skipToken } from '@tanstack/query-core'
import type {
  DefaultError,
  QueryClient,
  QueryFunction,
  ThrowOnError,
} from '@tanstack/query-core'

import { defaultThrowOnError } from './suspense'
import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from './types'
import { useQueries } from './useQueries'

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20

// Widen the type of the symbol to enable type inference even if skipToken is not immutable.
type SkipTokenForUseQueries = symbol

type GetUseSuspenseQueryOptions<T> =
  // Part 1: responsible for applying explicit type parameter to function arguments, if object { queryFnData: TQueryFnData, error: TError, data: TData }
  T extends {
    queryFnData: infer TQueryFnData
    error?: infer TError
    data: infer TData
  }
    ? UseSuspenseQueryOptions<TQueryFnData, TError, TData>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
      ? UseSuspenseQueryOptions<TQueryFnData, TError>
      : T extends { data: infer TData; error?: infer TError }
        ? UseSuspenseQueryOptions<unknown, TError, TData>
        : // Part 2: responsible for applying explicit type parameter to function arguments, if tuple [TQueryFnData, TError, TData]
          T extends [infer TQueryFnData, infer TError, infer TData]
          ? UseSuspenseQueryOptions<TQueryFnData, TError, TData>
          : T extends [infer TQueryFnData, infer TError]
            ? UseSuspenseQueryOptions<TQueryFnData, TError>
            : T extends [infer TQueryFnData]
              ? UseSuspenseQueryOptions<TQueryFnData>
              : // Part 3: responsible for inferring and enforcing type if no explicit parameter was provided
                T extends {
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, infer TQueryKey>
                      | SkipTokenForUseQueries
                    select?: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? UseSuspenseQueryOptions<
                    TQueryFnData,
                    TError,
                    TData,
                    TQueryKey
                  >
                : T extends {
                      queryFn?:
                        | QueryFunction<infer TQueryFnData, infer TQueryKey>
                        | SkipTokenForUseQueries
                      throwOnError?: ThrowOnError<any, infer TError, any, any>
                    }
                  ? UseSuspenseQueryOptions<
                      TQueryFnData,
                      TError,
                      TQueryFnData,
                      TQueryKey
                    >
                  : // Fallback
                    UseSuspenseQueryOptions

type GetUseSuspenseQueryResult<T> =
  // Part 1: responsible for mapping explicit type parameter to function result, if object
  T extends { queryFnData: any; error?: infer TError; data: infer TData }
    ? UseSuspenseQueryResult<TData, TError>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
      ? UseSuspenseQueryResult<TQueryFnData, TError>
      : T extends { data: infer TData; error?: infer TError }
        ? UseSuspenseQueryResult<TData, TError>
        : // Part 2: responsible for mapping explicit type parameter to function result, if tuple
          T extends [any, infer TError, infer TData]
          ? UseSuspenseQueryResult<TData, TError>
          : T extends [infer TQueryFnData, infer TError]
            ? UseSuspenseQueryResult<TQueryFnData, TError>
            : T extends [infer TQueryFnData]
              ? UseSuspenseQueryResult<TQueryFnData>
              : // Part 3: responsible for mapping inferred type to results, if no explicit parameter was provided
                T extends {
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, any>
                      | SkipTokenForUseQueries
                    select?: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? UseSuspenseQueryResult<
                    unknown extends TData ? TQueryFnData : TData,
                    unknown extends TError ? DefaultError : TError
                  >
                : T extends {
                      queryFn?:
                        | QueryFunction<infer TQueryFnData, any>
                        | SkipTokenForUseQueries
                      throwOnError?: ThrowOnError<any, infer TError, any, any>
                    }
                  ? UseSuspenseQueryResult<
                      TQueryFnData,
                      unknown extends TError ? DefaultError : TError
                    >
                  : // Fallback
                    UseSuspenseQueryResult

/**
 * The `queries` array accepted by `useSuspenseQueries`. Recursively unwraps each tuple element so every
 * entry's `queryFn`/`select` are inferred individually, up to 20 elements. An opaque array (e.g. `unknown[]`)
 * is returned as-is; a non-tuple array of a known element type, or a tuple past 20 elements, falls back to a
 * single homogeneous {@link UseSuspenseQueryOptions} type.
 *
 * @template T - The type of the `queries` array as written at the call site.
 * @template TResults - The internal accumulator that this type builds during recursion. It is not meant
 * to be set explicitly.
 * @template TDepth - The internal recursion-depth counter, checked against the 20-element limit. It is not
 * meant to be set explicitly.
 */
export type SuspenseQueriesOptions<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseSuspenseQueryOptions>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetUseSuspenseQueryOptions<Head>]
      : T extends [infer Head, ...infer Tails]
        ? SuspenseQueriesOptions<
            [...Tails],
            [...TResults, GetUseSuspenseQueryOptions<Head>],
            [...TDepth, 1]
          >
        : Array<unknown> extends T
          ? T
          : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogeneous type!
            // use this to infer the param types in the case of Array.map() argument
            T extends Array<
                UseSuspenseQueryOptions<
                  infer TQueryFnData,
                  infer TError,
                  infer TData,
                  infer TQueryKey
                >
              >
            ? Array<
                UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
              >
            : // Fallback
              Array<UseSuspenseQueryOptions>

/**
 * The result type returned by `useSuspenseQueries`, when no `combine` is provided. Mirrors
 * {@link SuspenseQueriesOptions}: each tuple element's result type is inferred individually, up to 20 elements.
 * A non-tuple array is mapped per-element instead, still inferring each entry individually; only past 20
 * elements does this fall back to a single homogeneous {@link UseSuspenseQueryResult} type.
 *
 * @template T - The type of the `queries` array, as inferred by {@link SuspenseQueriesOptions}.
 * @template TResults - The internal accumulator that this type builds during recursion. It is not meant
 * to be set explicitly.
 * @template TDepth - The internal recursion-depth counter, checked against the 20-element limit. It is not
 * meant to be set explicitly.
 */
export type SuspenseQueriesResults<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseSuspenseQueryResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetUseSuspenseQueryResult<Head>]
      : T extends [infer Head, ...infer Tails]
        ? SuspenseQueriesResults<
            [...Tails],
            [...TResults, GetUseSuspenseQueryResult<Head>],
            [...TDepth, 1]
          >
        : { [K in keyof T]: GetUseSuspenseQueryResult<T[K]> }

/**
 * The options for `useSuspenseQueries` are the same as for `useQueries`, except that each `query` can't have
 * `throwOnError`, `enabled`, or `placeholderData`.
 *
 * @param options - The `queries` array to run in Suspense, and an optional `combine` function.
 * @param queryClient - Use this to provide a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns The same structure as `useQueries`, except that for each `query`, `data` is guaranteed to be
 * defined, `isPlaceholderData` is missing, and `status` is either `success` or `error` (with the derived
 * flags set accordingly).
 *
 * Caveat: the component will only re-mount after all queries have finished loading. Hence, if a query has gone
 * stale in the time it took for all the queries to complete, it will be fetched again at re-mount. To avoid
 * this, make sure to set a high enough `staleTime`. Cancellation does not work.
 *
 * @example
 * The query error is thrown if a fetch fails and no cached data exists yet, so an error boundary is
 * required around `<Suspense>`. A failed background refetch instead continues to render the cached data.
 * Use {@link QueryErrorResetBoundary} to let the user retry after such an error:
 * ```tsx
 * import { Suspense } from 'preact/compat'
 * import { useErrorBoundary } from 'preact/hooks'
 * import {
 *   QueryErrorResetBoundary,
 *   useSuspenseQueries,
 * } from '@tanstack/preact-query'
 * import type { ComponentChildren } from 'preact'
 *
 * function Posts({ ids }: { ids: Array<number> }) {
 *   // Every result is guaranteed to be defined — no per-query `isPending` check needed.
 *   const postQueries = useSuspenseQueries({
 *     queries: ids.map((id) => ({
 *       queryKey: ['post', id],
 *       queryFn: () => fetchPost(id),
 *     })),
 *   })
 *
 *   return (
 *     <ul>
 *       {postQueries.map((query) => (
 *         <li key={query.data.id}>{query.data.title}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 *
 * function App() {
 *   return (
 *     <QueryErrorResetBoundary>
 *       {({ reset }) => (
 *         <ErrorBoundary
 *           onReset={reset}
 *           fallbackRender={({ resetErrorBoundary }) => (
 *             <div>
 *               There was an error!
 *               <button onClick={() => resetErrorBoundary()}>Try again</button>
 *             </div>
 *           )}
 *         >
 *           <Suspense fallback={<h1>Loading posts...</h1>}>
 *             <Posts ids={[1, 2, 3]} />
 *           </Suspense>
 *         </ErrorBoundary>
 *       )}
 *     </QueryErrorResetBoundary>
 *   )
 * }
 *
 * function ErrorBoundary({
 *   children,
 *   onReset,
 *   fallbackRender,
 * }: {
 *   children: ComponentChildren
 *   onReset: () => void
 *   fallbackRender: (props: {
 *     error: Error
 *     resetErrorBoundary: () => void
 *   }) => ComponentChildren
 * }) {
 *   const [error, resetErrorBoundary] = useErrorBoundary(() => onReset())
 *
 *   if (error) return fallbackRender({ error, resetErrorBoundary })
 *
 *   return children
 * }
 * ```
 *
 * @example
 * Several different queries — use `useSuspenseQueries` instead of multiple `useSuspenseQuery` calls, so
 * they fetch in parallel rather than suspending one after another:
 * ```tsx
 * import { Suspense } from 'preact/compat'
 * import { useErrorBoundary } from 'preact/hooks'
 * import {
 *   QueryErrorResetBoundary,
 *   useSuspenseQueries,
 * } from '@tanstack/preact-query'
 * import type { ComponentChildren } from 'preact'
 *
 * function Dashboard() {
 *   const [usersQuery, teamsQuery, projectsQuery] = useSuspenseQueries({
 *     queries: [
 *       { queryKey: ['users'], queryFn: fetchUsers },
 *       { queryKey: ['teams'], queryFn: fetchTeams },
 *       { queryKey: ['projects'], queryFn: fetchProjects },
 *     ],
 *   })
 *
 *   return (
 *     <div>
 *       <UserList users={usersQuery.data} />
 *       <TeamList teams={teamsQuery.data} />
 *       <ProjectList projects={projectsQuery.data} />
 *     </div>
 *   )
 * }
 *
 * function App() {
 *   return (
 *     <QueryErrorResetBoundary>
 *       {({ reset }) => (
 *         <ErrorBoundary
 *           onReset={reset}
 *           fallbackRender={({ resetErrorBoundary }) => (
 *             <div>
 *               There was an error!
 *               <button onClick={() => resetErrorBoundary()}>Try again</button>
 *             </div>
 *           )}
 *         >
 *           <Suspense fallback={<h1>Loading dashboard...</h1>}>
 *             <Dashboard />
 *           </Suspense>
 *         </ErrorBoundary>
 *       )}
 *     </QueryErrorResetBoundary>
 *   )
 * }
 *
 * function ErrorBoundary({
 *   children,
 *   onReset,
 *   fallbackRender,
 * }: {
 *   children: ComponentChildren
 *   onReset: () => void
 *   fallbackRender: (props: {
 *     error: Error
 *     resetErrorBoundary: () => void
 *   }) => ComponentChildren
 * }) {
 *   const [error, resetErrorBoundary] = useErrorBoundary(() => onReset())
 *
 *   if (error) return fallbackRender({ error, resetErrorBoundary })
 *
 *   return children
 * }
 * ```
 *
 * @example
 * `combine`s the results into a single boolean, so `Refresh` only re-renders when that boolean changes,
 * not on every individual query update. This overload is the only one that accepts `combine`:
 * ```tsx
 * import { Suspense } from 'preact/compat'
 * import { useErrorBoundary } from 'preact/hooks'
 * import {
 *   QueryErrorResetBoundary,
 *   useSuspenseQueries,
 * } from '@tanstack/preact-query'
 * import type { ComponentChildren } from 'preact'
 *
 * function Refresh() {
 *   const anyFetching = useSuspenseQueries({
 *     queries: [
 *       { queryKey: ['users'], queryFn: fetchUsers },
 *       { queryKey: ['teams'], queryFn: fetchTeams },
 *     ],
 *     combine: (results) => results.some((result) => result.isFetching),
 *   })
 *
 *   return anyFetching ? <span>Refreshing…</span> : null
 * }
 *
 * function App() {
 *   return (
 *     <QueryErrorResetBoundary>
 *       {({ reset }) => (
 *         <ErrorBoundary
 *           onReset={reset}
 *           fallbackRender={({ resetErrorBoundary }) => (
 *             <div>
 *               There was an error!
 *               <button onClick={() => resetErrorBoundary()}>Try again</button>
 *             </div>
 *           )}
 *         >
 *           <Suspense fallback={<h1>Loading dashboard...</h1>}>
 *             <Refresh />
 *           </Suspense>
 *         </ErrorBoundary>
 *       )}
 *     </QueryErrorResetBoundary>
 *   )
 * }
 *
 * function ErrorBoundary({
 *   children,
 *   onReset,
 *   fallbackRender,
 * }: {
 *   children: ComponentChildren
 *   onReset: () => void
 *   fallbackRender: (props: {
 *     error: Error
 *     resetErrorBoundary: () => void
 *   }) => ComponentChildren
 * }) {
 *   const [error, resetErrorBoundary] = useErrorBoundary(() => onReset())
 *
 *   if (error) return fallbackRender({ error, resetErrorBoundary })
 *
 *   return children
 * }
 * ```
 */
export function useSuspenseQueries<
  T extends Array<any>,
  TCombinedResult = SuspenseQueriesResults<T>,
>(
  options: {
    /**
     * An array with query option objects identical to `useSuspenseQuery`.
     */
    queries:
      | readonly [...SuspenseQueriesOptions<T>]
      | readonly [...{ [K in keyof T]: GetUseSuspenseQueryOptions<T[K]> }]
    /**
     * Use this to combine the results of the queries into a single value. The result will be structurally
     * shared to be as referentially stable as possible.
     */
    combine?: (result: SuspenseQueriesResults<T>) => TCombinedResult
  },
  queryClient?: QueryClient,
): TCombinedResult

/**
 * The options for `useSuspenseQueries` are the same as for `useQueries`, except that each `query` can't have
 * `throwOnError`, `enabled`, or `placeholderData`.
 *
 * @param options - The `queries` array to run in Suspense, and an optional `combine` function.
 * @param queryClient - Use this to provide a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns The same structure as `useQueries`, except that for each `query`, `data` is guaranteed to be
 * defined, `isPlaceholderData` is missing, and `status` is either `success` or `error` (with the derived
 * flags set accordingly).
 *
 * Caveat: the component will only re-mount after all queries have finished loading. Hence, if a query has gone
 * stale in the time it took for all the queries to complete, it will be fetched again at re-mount. To avoid
 * this, make sure to set a high enough `staleTime`. Cancellation does not work.
 *
 * @example
 * The query error is thrown if a fetch fails and no cached data exists yet, so an error boundary is
 * required around `<Suspense>`. A failed background refetch instead continues to render the cached data.
 * Use {@link QueryErrorResetBoundary} to let the user retry after such an error:
 * ```tsx
 * import { Suspense } from 'preact/compat'
 * import { useErrorBoundary } from 'preact/hooks'
 * import {
 *   QueryErrorResetBoundary,
 *   useSuspenseQueries,
 * } from '@tanstack/preact-query'
 * import type { ComponentChildren } from 'preact'
 *
 * function Posts({ ids }: { ids: Array<number> }) {
 *   // Every result is guaranteed to be defined — no per-query `isPending` check needed.
 *   const postQueries = useSuspenseQueries({
 *     queries: ids.map((id) => ({
 *       queryKey: ['post', id],
 *       queryFn: () => fetchPost(id),
 *     })),
 *   })
 *
 *   return (
 *     <ul>
 *       {postQueries.map((query) => (
 *         <li key={query.data.id}>{query.data.title}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 *
 * function App() {
 *   return (
 *     <QueryErrorResetBoundary>
 *       {({ reset }) => (
 *         <ErrorBoundary
 *           onReset={reset}
 *           fallbackRender={({ resetErrorBoundary }) => (
 *             <div>
 *               There was an error!
 *               <button onClick={() => resetErrorBoundary()}>Try again</button>
 *             </div>
 *           )}
 *         >
 *           <Suspense fallback={<h1>Loading posts...</h1>}>
 *             <Posts ids={[1, 2, 3]} />
 *           </Suspense>
 *         </ErrorBoundary>
 *       )}
 *     </QueryErrorResetBoundary>
 *   )
 * }
 *
 * function ErrorBoundary({
 *   children,
 *   onReset,
 *   fallbackRender,
 * }: {
 *   children: ComponentChildren
 *   onReset: () => void
 *   fallbackRender: (props: {
 *     error: Error
 *     resetErrorBoundary: () => void
 *   }) => ComponentChildren
 * }) {
 *   const [error, resetErrorBoundary] = useErrorBoundary(() => onReset())
 *
 *   if (error) return fallbackRender({ error, resetErrorBoundary })
 *
 *   return children
 * }
 * ```
 *
 * @example
 * Several different queries — use `useSuspenseQueries` instead of multiple `useSuspenseQuery` calls, so
 * they fetch in parallel rather than suspending one after another:
 * ```tsx
 * import { Suspense } from 'preact/compat'
 * import { useErrorBoundary } from 'preact/hooks'
 * import {
 *   QueryErrorResetBoundary,
 *   useSuspenseQueries,
 * } from '@tanstack/preact-query'
 * import type { ComponentChildren } from 'preact'
 *
 * function Dashboard() {
 *   const [usersQuery, teamsQuery, projectsQuery] = useSuspenseQueries({
 *     queries: [
 *       { queryKey: ['users'], queryFn: fetchUsers },
 *       { queryKey: ['teams'], queryFn: fetchTeams },
 *       { queryKey: ['projects'], queryFn: fetchProjects },
 *     ],
 *   })
 *
 *   return (
 *     <div>
 *       <UserList users={usersQuery.data} />
 *       <TeamList teams={teamsQuery.data} />
 *       <ProjectList projects={projectsQuery.data} />
 *     </div>
 *   )
 * }
 *
 * function App() {
 *   return (
 *     <QueryErrorResetBoundary>
 *       {({ reset }) => (
 *         <ErrorBoundary
 *           onReset={reset}
 *           fallbackRender={({ resetErrorBoundary }) => (
 *             <div>
 *               There was an error!
 *               <button onClick={() => resetErrorBoundary()}>Try again</button>
 *             </div>
 *           )}
 *         >
 *           <Suspense fallback={<h1>Loading dashboard...</h1>}>
 *             <Dashboard />
 *           </Suspense>
 *         </ErrorBoundary>
 *       )}
 *     </QueryErrorResetBoundary>
 *   )
 * }
 *
 * function ErrorBoundary({
 *   children,
 *   onReset,
 *   fallbackRender,
 * }: {
 *   children: ComponentChildren
 *   onReset: () => void
 *   fallbackRender: (props: {
 *     error: Error
 *     resetErrorBoundary: () => void
 *   }) => ComponentChildren
 * }) {
 *   const [error, resetErrorBoundary] = useErrorBoundary(() => onReset())
 *
 *   if (error) return fallbackRender({ error, resetErrorBoundary })
 *
 *   return children
 * }
 * ```
 */
export function useSuspenseQueries<
  T extends Array<any>,
  TCombinedResult = SuspenseQueriesResults<T>,
>(
  options: {
    /**
     * An array with query option objects identical to `useSuspenseQuery`.
     */
    queries: readonly [...SuspenseQueriesOptions<T>]
    /**
     * Use this to combine the results of the queries into a single value. The result will be structurally
     * shared to be as referentially stable as possible.
     */
    combine?: (result: SuspenseQueriesResults<T>) => TCombinedResult
  },
  queryClient?: QueryClient,
): TCombinedResult

export function useSuspenseQueries(options: any, queryClient?: QueryClient) {
  return useQueries(
    {
      ...options,
      queries: options.queries.map((query: any) => {
        if (process.env.NODE_ENV !== 'production') {
          if (query.queryFn === skipToken) {
            console.error('skipToken is not allowed for useSuspenseQueries')
          }
        }

        return {
          ...query,
          suspense: true,
          throwOnError: defaultThrowOnError,
          enabled: true,
          placeholderData: undefined,
        }
      }),
    },
    queryClient,
  )
}
