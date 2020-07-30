import { Query, FetchMoreOptions } from './query'

export type QueryKeyObject =
  | object
  | { [key: string]: QueryKey }
  | { [key: number]: QueryKey }

export type QueryKeyPrimitive = string | boolean | number | null | undefined

export type QueryKeyWithoutObjectAndArray = QueryKeyPrimitive

export type QueryKeyWithoutObject =
  | QueryKeyWithoutObjectAndArray
  | readonly QueryKey[]

export type QueryKeyWithoutArray =
  | QueryKeyWithoutObjectAndArray
  | QueryKeyObject

export type QueryKey = QueryKeyWithoutObject | QueryKeyObject

export type ArrayQueryKey = QueryKey[]

export type QueryFunction<TResult> = (
  ...args: any[]
) => TResult | Promise<TResult>

// The tuple variants are only to infer types in the public API
export type TupleQueryKey = readonly [QueryKey, ...QueryKey[]]

export type TupleQueryFunction<TResult, TKey extends TupleQueryKey> = (
  ...args: TKey
) => TResult | Promise<TResult>

export type InitialDataFunction<TResult> = () => TResult | undefined

export type InitialStaleFunction = () => boolean

export type QueryKeySerializerFunction = (
  queryKey: QueryKey
) => [string, QueryKey[]]

export interface BaseQueryConfig<TResult, TError = unknown> {
  /**
   * Set this to `false` to disable automatic refetching when the query mounts or changes query keys.
   * To refetch the query, use the `refetch` method returned from the `useQuery` instance.
   */
  enabled?: boolean | unknown
  /**
   * If `false`, failed queries will not retry by default.
   * If `true`, failed queries will retry infinitely., failureCount: num
   * If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number.
   * If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false.
   */
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean)
  retryDelay?: number | ((retryAttempt: number) => number)
  staleTime?: number
  cacheTime?: number
  refetchInterval?: false | number
  refetchIntervalInBackground?: boolean
  refetchOnWindowFocus?: boolean
  refetchOnMount?: boolean
  onSuccess?: (data: TResult) => void
  onError?: (err: TError) => void
  onSettled?: (data: TResult | undefined, error: TError | null) => void
  isDataEqual?: (oldData: unknown, newData: unknown) => boolean
  useErrorBoundary?: boolean
  queryFn?: QueryFunction<TResult>
  queryKeySerializerFn?: QueryKeySerializerFunction
  queryFnParamsFilter?: (args: ArrayQueryKey) => ArrayQueryKey
  suspense?: boolean
  initialData?: TResult | InitialDataFunction<TResult>
  initialStale?: boolean | InitialStaleFunction
  infinite?: true
}

export interface QueryConfig<TResult, TError = unknown>
  extends BaseQueryConfig<TResult, TError> {}

export interface PaginatedQueryConfig<TResult, TError = unknown>
  extends BaseQueryConfig<TResult, TError> {}

export interface InfiniteQueryConfig<TResult, TError = unknown>
  extends BaseQueryConfig<TResult[], TError> {
  getFetchMore: (lastPage: TResult, allPages: TResult[]) => unknown
}

export type IsFetchingMoreValue = 'previous' | 'next' | false

export enum QueryStatus {
  Idle = 'idle',
  Loading = 'loading',
  Error = 'error',
  Success = 'success',
}

export interface QueryResultBase<TResult, TError = unknown> {
  status: QueryStatus
  error: TError | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  isFetching: boolean
  isStale: boolean
  failureCount: number
  query: Query<TResult, TError>
  updatedAt: number
  refetch: () => Promise<void>
  clear: () => void
}

export interface QueryResult<TResult, TError = unknown>
  extends QueryResultBase<TResult, TError> {
  data: TResult | undefined
}

export interface PaginatedQueryResult<TResult, TError = unknown>
  extends QueryResultBase<TResult, TError> {
  resolvedData: TResult | undefined
  latestData: TResult | undefined
}

export interface InfiniteQueryResult<TResult, TError = unknown>
  extends QueryResultBase<TResult[], TError> {
  data: TResult[] | undefined
  isFetchingMore?: IsFetchingMoreValue
  canFetchMore: boolean | undefined
  fetchMore: (
    fetchMoreVariable?: unknown,
    options?: FetchMoreOptions
  ) => Promise<TResult[] | undefined> | undefined
}

export interface MutateConfig<
  TResult,
  TError = unknown,
  TVariables = unknown,
  TSnapshot = unknown
> {
  onSuccess?: (data: TResult, variables: TVariables) => Promise<void> | void
  onError?: (
    error: TError,
    variables: TVariables,
    snapshotValue: TSnapshot
  ) => Promise<void> | void
  onSettled?: (
    data: undefined | TResult,
    error: TError | null,
    variables: TVariables,
    snapshotValue?: TSnapshot
  ) => Promise<void> | void
  throwOnError?: boolean
}

export interface MutationConfig<
  TResult,
  TError = unknown,
  TVariables = unknown,
  TSnapshot = unknown
> extends MutateConfig<TResult, TError, TVariables, TSnapshot> {
  onMutate?: (variables: TVariables) => Promise<TSnapshot> | TSnapshot
  useErrorBoundary?: boolean
  suspense?: boolean
}

export type MutationFunction<TResult, TVariables = unknown> = (
  variables: TVariables
) => Promise<TResult>

export type MutateFunction<
  TResult,
  TError = unknown,
  TVariables = unknown,
  TSnapshot = unknown
> = (
  variables?: TVariables,
  config?: MutateConfig<TResult, TError, TVariables, TSnapshot>
) => Promise<TResult | undefined>

export type MutationResultPair<TResult, TError, TVariables, TSnapshot> = [
  MutateFunction<TResult, TError, TVariables, TSnapshot>,
  MutationResult<TResult, TError>
]

export interface MutationResult<TResult, TError = unknown> {
  status: QueryStatus
  data: TResult | undefined
  error: TError | null
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  reset: () => void
}

export interface ReactQueryConfig<TResult = unknown, TError = unknown> {
  queries?: ReactQueryQueriesConfig<TResult, TError>
  shared?: ReactQuerySharedConfig
  mutations?: ReactQueryMutationsConfig<TResult, TError>
}

export interface ReactQuerySharedConfig {
  suspense?: boolean
}

export interface ReactQueryQueriesConfig<TResult, TError>
  extends BaseQueryConfig<TResult, TError> {}

export interface ReactQueryMutationsConfig<
  TResult,
  TError = unknown,
  TVariables = unknown,
  TSnapshot = unknown
> extends MutationConfig<TResult, TError, TVariables, TSnapshot> {}
