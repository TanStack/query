import {
  MutateOptions,
  QueryObserverOptions,
  QueryObserverResult,
} from '../core/types'

export interface UseQueryOptions<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData
> extends QueryObserverOptions<TData, TError, TQueryFnData, TQueryData> {}

export interface UseQueryResult<TData = unknown, TError = unknown>
  extends QueryObserverResult<TData, TError> {}

export interface UseInfiniteQueryOptions<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData[]
> extends QueryObserverOptions<TData[], TError, TQueryFnData, TQueryData> {}

export interface UseInfiniteQueryResult<TData = unknown, TError = unknown>
  extends QueryObserverResult<TData[], TError> {}

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
) => Promise<TData | undefined>

export type UseMutationResultPair<TData, TError, TVariables, TContext> = [
  MutateFunction<TData, TError, TVariables, TContext>,
  UseMutationResult<TData, TError>
]

export interface UseMutationResult<TData = unknown, TError = unknown> {
  status: MutationStatus
  data: TData | undefined
  error: TError | null
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  reset: () => void
}
