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
  RegisteredError,
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
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends ContextOptions,
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> {}

export interface CreateBaseQueryResult<
  TData = unknown,
  TError = RegisteredError,
> extends Readable<QueryObserverResult<TData, TError>> {}

export interface CreateQueryOptions<
  TQueryFnData = unknown,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends CreateBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  > {}

export interface CreateQueryResult<TData = unknown, TError = RegisteredError>
  extends CreateBaseQueryResult<TData, TError> {}

export interface CreateInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  > {}

export type CreateInfiniteQueryResult<
  TData = unknown,
  TError = RegisteredError,
> = Readable<InfiniteQueryObserverResult<TData, TError>>

export type DefinedCreateBaseQueryResult<
  TData = unknown,
  TError = RegisteredError,
> = Readable<DefinedQueryObserverResult<TData, TError>>

export type DefinedCreateQueryResult<
  TData = unknown,
  TError = RegisteredError,
> = DefinedCreateBaseQueryResult<TData, TError>

export interface CreateMutationOptions<
  TData = unknown,
  TError = RegisteredError,
  TVariables = void,
  TContext = unknown,
> extends ContextOptions,
    Omit<
      MutationObserverOptions<TData, TError, TVariables, TContext>,
      '_defaulted' | 'variables'
    > {}

export type CreateMutateFunction<
  TData = unknown,
  TError = RegisteredError,
  TVariables = void,
  TContext = unknown,
> = (
  ...args: Parameters<MutateFunction<TData, TError, TVariables, TContext>>
) => void

export type CreateMutateAsyncFunction<
  TData = unknown,
  TError = RegisteredError,
  TVariables = void,
  TContext = unknown,
> = MutateFunction<TData, TError, TVariables, TContext>

export type CreateBaseMutationResult<
  TData = unknown,
  TError = RegisteredError,
  TVariables = unknown,
  TContext = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TContext>,
  { mutate: CreateMutateFunction<TData, TError, TVariables, TContext> }
> & {
  mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TContext>
}

export interface CreateMutationResult<
  TData = unknown,
  TError = RegisteredError,
  TVariables = unknown,
  TContext = unknown,
> extends Readable<
    CreateBaseMutationResult<TData, TError, TVariables, TContext>
  > {}

type Override<A, B> = { [K in keyof A]: K extends keyof B ? B[K] : A[K] }
