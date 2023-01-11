import type {
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutationObserverResult,
  QueryObserverOptions,
  QueryObserverResult,
  QueryKey,
  MutationObserverOptions,
  MutateFunction,
  DefinedQueryObserverResult,
} from '@tanstack/query-core'
import type { QueryClient } from '@tanstack/query-core'
import type { Readable } from 'svelte/store'

export interface ContextOptions {
  /**
   * Use this to pass your Svelte Query context. Otherwise, `defaultContext` will be used.
   */
  context?: QueryClient | undefined
}

export interface CreateBaseQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends ContextOptions,
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> {}

export interface CreateQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends CreateBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  > {}

export interface CreateInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > {}

export type CreateInfiniteQueryResult<
  TData = unknown,
  TError = unknown,
> = Readable<InfiniteQueryObserverResult<TData, TError>>

export interface CreateInfiniteQueryStoreResult<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
> extends Readable<CreateInfiniteQueryResult<TData, TError>> {}

export type CreateBaseQueryResult<
  TData = unknown,
  TError = unknown,
> = QueryObserverResult<TData, TError>

export type CreateQueryResult<
  TData = unknown,
  TError = unknown,
> = CreateBaseQueryResult<TData, TError>

export interface CreateQueryStoreResult<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
> extends Readable<CreateQueryResult<TData, TError>> {}

export type DefinedCreateBaseQueryResult<
  TData = unknown,
  TError = unknown,
> = Readable<DefinedQueryObserverResult<TData, TError>>

export type DefinedCreateQueryResult<
  TData = unknown,
  TError = unknown,
> = DefinedCreateBaseQueryResult<TData, TError>

export interface CreateMutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> extends ContextOptions,
    Omit<
      MutationObserverOptions<TData, TError, TVariables, TContext>,
      '_defaulted' | 'variables'
    > {}

export type UseMutateFunction<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> = (
  ...args: Parameters<MutateFunction<TData, TError, TVariables, TContext>>
) => void

export type UseMutateAsyncFunction<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> = MutateFunction<TData, TError, TVariables, TContext>

export type UseBaseMutationResult<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TContext>,
  { mutate: UseMutateFunction<TData, TError, TVariables, TContext> }
> & { mutateAsync: UseMutateAsyncFunction<TData, TError, TVariables, TContext> }

export type CreateMutationResult<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
> = UseBaseMutationResult<TData, TError, TVariables, TContext>

export interface MutationStoreResult<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
> extends Readable<CreateMutationResult<TData, TError, TVariables, TContext>> {}

type Override<A, B> = { [K in keyof A]: K extends keyof B ? B[K] : A[K] }
