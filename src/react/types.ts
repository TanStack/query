import {
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutationObserverResult,
  QueryObserverOptions,
  QueryObserverResult,
  QueryKey,
  MutationObserverOptions,
  MutateFunction,
} from '../core/types'

export interface UseBaseQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> extends QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > {}

export interface UseQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> extends UseBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  > {}

export interface UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> extends InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > {}

export type UseBaseQueryResult<
  TData = unknown,
  TError = unknown
> = QueryObserverResult<TData, TError>

export type UseQueryResult<
  TData = unknown,
  TError = unknown
> = UseBaseQueryResult<TData, TError>

export type UseInfiniteQueryResult<
  TData = unknown,
  TError = unknown
> = InfiniteQueryObserverResult<TData, TError>

export interface UseMutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> extends Omit<
    MutationObserverOptions<TData, TError, TVariables, TContext>,
    '_defaulted' | 'variables'
  > {}

export type UseMutateFunction<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> = (
  ...args: Parameters<MutateFunction<TData, TError, TVariables, TContext>>
) => void

export type UseMutateAsyncFunction<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> = MutateFunction<TData, TError, TVariables, TContext>

export type UseBaseMutationResult<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown
> = Override<
  MutationObserverResult<TData, TError, TVariables, TContext>,
  { mutate: UseMutateFunction<TData, TError, TVariables, TContext> }
> & { mutateAsync: UseMutateAsyncFunction<TData, TError, TVariables, TContext> }

export type UseMutationResult<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown
> = UseBaseMutationResult<TData, TError, TVariables, TContext>

type Override<A, B> = { [K in keyof A]: K extends keyof B ? B[K] : A[K] }
