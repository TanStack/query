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

export type MutationFunction<TData, TVariables = unknown> = (
  variables: TVariables
) => Promise<TData>

export type MutateFunction<
  TData,
  TError = unknown,
  TVariables = unknown,
  TSnapshot = unknown
> = (
  variables: TVariables,
  options?: MutateOptions<TData, TError, TVariables, TSnapshot>
) => Promise<TData | undefined>

export type UseMutationResultPair<TData, TError, TVariables, TSnapshot> = [
  MutateFunction<TData, TError, TVariables, TSnapshot>,
  UseMutationResult<TData, TError>
]

export interface UseMutationResult<TData, TError = unknown> {
  status: MutationStatus
  data: TData | undefined
  error: TError | null
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  reset: () => void
}
