import type {
  DataTag,
  DefaultError,
  InitialDataFunction,
  NonUndefinedGuard,
  OmitKeyof,
  QueryFunction,
  QueryKey,
  SkipToken,
} from '@tanstack/query-core'
import type { CreateQueryOptions } from './types'

export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
    | NonUndefinedGuard<TQueryFnData>
}

export type UnusedSkipTokenOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryFn'
> & {
  queryFn?: Exclude<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>['queryFn'],
    SkipToken | undefined
  >
}

export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<
  CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryFn'
> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
  queryFn?: QueryFunction<TQueryFnData, TQueryKey>
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
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
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
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey>,
): UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
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
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
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
 */
export function queryOptions(options: unknown) {
  return options
}
