import type {
  DefaultError,
  DefinedQueryObserverResult,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutateFunction,
  MutationObserverOptions,
  MutationObserverResult,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { Readable } from 'svelte/store'

/** Allows a type to be either the base object or a store of that object */
export type StoreOrVal<T> = T | Readable<T>

/** Options for createBaseQuery */
export type CreateBaseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = StoreOrVal<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
>

/** Result from createBaseQuery */
export type CreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = Readable<QueryObserverResult<TData, TError>>

/** Options for createQuery */
export type CreateQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>

/** Result from createQuery */
export type CreateQueryResult<
  TData = unknown,
  TError = DefaultError,
> = CreateBaseQueryResult<TData, TError>

/** Options for createInfiniteQuery */
export type CreateInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = StoreOrVal<
  InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  >
>

/** Result from createInfiniteQuery */
export type CreateInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = Readable<InfiniteQueryObserverResult<TData, TError>>

/** Options for createBaseQuery with initialData */
export type DefinedCreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = Readable<DefinedQueryObserverResult<TData, TError>>

/** Options for createQuery with initialData */
export type DefinedCreateQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedCreateBaseQueryResult<TData, TError>

/** Options for createMutation */
export type CreateMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = StoreOrVal<
  Omit<
    MutationObserverOptions<TData, TError, TVariables, TContext>,
    '_defaulted' | 'variables'
  >
>

export type CreateMutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = (
  ...args: Parameters<MutateFunction<TData, TError, TVariables, TContext>>
) => void

export type CreateMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = MutateFunction<TData, TError, TVariables, TContext>

export type CreateBaseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TContext>,
  { mutate: CreateMutateFunction<TData, TError, TVariables, TContext> }
> & {
  mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TContext>
}

/** Result from createMutation */
export type CreateMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
> = Readable<CreateBaseMutationResult<TData, TError, TVariables, TContext>>

type Override<A, B> = { [K in keyof A]: K extends keyof B ? B[K] : A[K] }
