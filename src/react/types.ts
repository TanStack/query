import {
  MutateOptions,
  MutationOptions,
  MutationStatus,
  QueryObserverOptions,
  QueryObserverResult,
} from '../core/types'

export interface UseBaseQueryOptions<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData
> extends QueryObserverOptions<TData, TError, TQueryFnData, TQueryData> {}

export interface UseQueryOptions<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
> extends UseBaseQueryOptions<TData, TError, TQueryFnData> {}

export interface UseInfiniteQueryOptions<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
> extends UseBaseQueryOptions<TData[], TError, TQueryFnData, TQueryFnData[]> {}

export interface UseBaseQueryResult<TData = unknown, TError = unknown>
  extends QueryObserverResult<TData, TError> {}

export interface UseQueryResult<TData = unknown, TError = unknown>
  extends UseBaseQueryResult<TData, TError> {}

export interface UseInfiniteQueryResult<TData = unknown, TError = unknown>
  extends UseBaseQueryResult<TData[], TError> {}

export type UseMutateFunction<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> = (
  variables: TVariables,
  options?: MutateOptions<TData, TError, TVariables, TContext>
) => void

export type UseMutateAsyncFunction<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> = (
  variables: TVariables,
  options?: MutateOptions<TData, TError, TVariables, TContext>
) => Promise<TData>

export interface UseMutationOptions<TData, TError, TVariables, TContext>
  extends MutationOptions<TData, TError, TVariables, TContext> {}

export interface UseMutationResult<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> {
  data: TData | undefined
  error: TError | null
  isError: boolean
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  mutate: UseMutateFunction<TData, TError, TVariables, TContext>
  mutateAsync: UseMutateAsyncFunction<TData, TError, TVariables, TContext>
  reset: () => void
  status: MutationStatus
}
