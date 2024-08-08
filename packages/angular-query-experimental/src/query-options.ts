import type {
  DataTag,
  DefaultError,
  InitialDataFunction,
  QueryKey,
} from '@tanstack/query-core'
import type { CreateQueryOptions, NonUndefinedGuard } from './types'

/**
 * @public
 */
export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData?: undefined | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
}

/**
 * @public
 */
export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
}

/**
 * Allows to share and re-use query options in a type-safe way.
 *
 * The `queryKey` will be tagged with the type from `queryFn`.
 *
 * **Example**
 *
 * ```ts
 *  const { queryKey } = queryOptions({
 *     queryKey: ['key'],
 *     queryFn: () => Promise.resolve(5),
 *     //  ^?  Promise<number>
 *   })
 *
 *   const queryClient = new QueryClient()
 *   const data = queryClient.getQueryData(queryKey)
 *   //    ^?  number | undefined
 * ```
 * @param options - The query options to tag with the type from `queryFn`.
 * @returns The tagged query options.
 * @public
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData>
}

/**
 * Allows to share and re-use query options in a type-safe way.
 *
 * The `queryKey` will be tagged with the type from `queryFn`.
 *
 * **Example**
 *
 * ```ts
 *  const { queryKey } = queryOptions({
 *     queryKey: ['key'],
 *     queryFn: () => Promise.resolve(5),
 *     //  ^?  Promise<number>
 *   })
 *
 *   const queryClient = new QueryClient()
 *   const data = queryClient.getQueryData(queryKey)
 *   //    ^?  number | undefined
 * ```
 * @param options - The query options to tag with the type from `queryFn`.
 * @returns The tagged query options.
 * @public
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData>
}

/**
 * Allows to share and re-use query options in a type-safe way.
 *
 * The `queryKey` will be tagged with the type from `queryFn`.
 *
 * **Example**
 *
 * ```ts
 *  const { queryKey } = queryOptions({
 *     queryKey: ['key'],
 *     queryFn: () => Promise.resolve(5),
 *     //  ^?  Promise<number>
 *   })
 *
 *   const queryClient = new QueryClient()
 *   const data = queryClient.getQueryData(queryKey)
 *   //    ^?  number | undefined
 * ```
 * @param options - The query options to tag with the type from `queryFn`.
 * @returns The tagged query options.
 * @public
 */
export function queryOptions(options: unknown) {
  return options
}
