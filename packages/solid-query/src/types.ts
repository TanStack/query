/* istanbul ignore file */

import type { Context } from 'solid-js'
import type {
  QueryClient,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  MutateFunction,
  MutationObserverOptions,
  MutationObserverResult,
  DefinedQueryObserverResult,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  WithRequired,
} from '@tanstack/query-core'

export interface ContextOptions {
  /**
   * Use this to pass your Solid Query context. Otherwise, `defaultContext` will be used.
   */
  context?: Context<QueryClient | undefined>
}

export type FunctionedParams<T> = () => T

export interface CreateBaseQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends ContextOptions,
    WithRequired<
      QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
      'queryKey'
    > {}

export interface SolidQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends WithRequired<
    CreateBaseQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey
    >,
    'queryKey'
  > {}

export type CreateQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = FunctionedParams<SolidQueryOptions<TQueryFnData, TError, TData, TQueryKey>>

/* --- Create Query and Create Base Query  Types --- */

export type CreateBaseQueryResult<
  TData = unknown,
  TError = unknown,
> = QueryObserverResult<TData, TError>

export type CreateQueryResult<
  TData = unknown,
  TError = unknown,
> = CreateBaseQueryResult<TData, TError>

export type DefinedCreateBaseQueryResult<
  TData = unknown,
  TError = unknown,
> = DefinedQueryObserverResult<TData, TError>

export type DefinedCreateQueryResult<
  TData = unknown,
  TError = unknown,
> = DefinedCreateBaseQueryResult<TData, TError>

/* --- Create Infinite Queries Types --- */
export interface SolidInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends ContextOptions,
    Omit<
      InfiniteQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey
      >,
      'queryKey'
    > {
  queryKey: TQueryKey
}

export type CreateInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = FunctionedParams<
  SolidInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  >
>

export type CreateInfiniteQueryResult<
  TData = unknown,
  TError = unknown,
> = InfiniteQueryObserverResult<TData, TError>

/* --- Create Mutation Types --- */
export interface SolidMutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> extends ContextOptions,
    Omit<
      MutationObserverOptions<TData, TError, TVariables, TContext>,
      '_defaulted' | 'variables'
    > {}

export type CreateMutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> = FunctionedParams<SolidMutationOptions<TData, TError, TVariables, TContext>>

export type CreateMutateFunction<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> = (
  ...args: Parameters<MutateFunction<TData, TError, TVariables, TContext>>
) => void

export type CreateMutateAsyncFunction<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> = MutateFunction<TData, TError, TVariables, TContext>

export type CreateBaseMutationResult<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TContext>,
  { mutate: CreateMutateFunction<TData, TError, TVariables, TContext> }
> & {
  mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TContext>
}

export type CreateMutationResult<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
> = CreateBaseMutationResult<TData, TError, TVariables, TContext>

type Override<A, B> = { [K in keyof A]: K extends keyof B ? B[K] : A[K] }
