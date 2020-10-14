import { RetryValue, RetryDelayValue } from '../core/retryer'
import {
  MutateOptions,
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

export interface UseMutationOptions<TData, TError, TVariables, TContext> {
  mutationKey?: string | unknown[]
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void
  retry?: RetryValue<TError>
  retryDelay?: RetryDelayValue
  useErrorBoundary?: boolean
}

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

export interface UseMutationResult<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown
> {
  context: TContext | undefined
  data: TData | undefined
  error: TError | null
  failureCount: number
  isPaused: boolean
  mutate: UseMutateFunction<TData, TError, TVariables, TContext>
  mutateAsync: UseMutateAsyncFunction<TData, TError, TVariables, TContext>
  reset: () => void
  status: MutationStatus
  variables: TVariables | undefined
}
