import {
  MutateOptions,
  MutationOptions,
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

export type MutationStatus = 'idle' | 'loading' | 'error' | 'success'

export type MutationFunction<TData = unknown, TVariables = unknown> = (
  variables: TVariables
) => Promise<TData>

export type MutateFunction<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown
> = (
  variables: TVariables,
  options?: MutateOptions<TData, TError, TVariables, TContext>
) => void

export type MutateAsyncFunction<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
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
  TVariables = unknown,
  TContext = unknown
> {
  data: TData | undefined
  error: TError | null
  isError: boolean
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  mutate: MutateFunction<TData, TError, TVariables, TContext>
  mutateAsync: MutateAsyncFunction<TData, TError, TVariables, TContext>
  reset: () => void
  status: MutationStatus
}
