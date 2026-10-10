import type { Snippet } from 'svelte'
import type {
  DefaultError,
  DefinedInfiniteQueryObserverResult,
  DefinedQueryObserverResult,
  InfiniteQueryMode,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutateFunction,
  Mutation,
  MutationFilters,
  MutationObserverOptions,
  MutationObserverResult,
  MutationState,
  OmitKeyof,
  Override,
  QueryClient,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'

/**
 * A function that returns a value. Options passed as an accessor are read inside reactive contexts, so they
 * update when the state they read changes.
 */
export type Accessor<T> = () => T

/** Options for createBaseQuery */
export type CreateBaseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>

/** Result from createBaseQuery */
export type CreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = QueryObserverResult<TData, TError>

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
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = InfiniteQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  TMode
>

/** Result from createInfiniteQuery */
export type CreateInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>

/** Result from createInfiniteQuery with initialData */
export type DefinedCreateInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedInfiniteQueryObserverResult<TData, TError>

/** Options for createBaseQuery with initialData */
export type DefinedCreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedQueryObserverResult<TData, TError>

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
  TOnMutateResult = unknown,
> = OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
  '_defaulted'
>

/**
 * The type of `mutate`, as returned by `createMutation`. Forwards the variables (and an optional per-call
 * `onSuccess`/`onError`/`onSettled`) to the underlying `mutate` call. Fire-and-forget — errors are surfaced
 * through the mutation result, not thrown.
 */
export type CreateMutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = (
  ...args: Parameters<
    MutateFunction<TData, TError, TVariables, TOnMutateResult>
  >
) => void

/**
 * The type of `mutateAsync`, as returned by `createMutation`. Similar to {@link CreateMutateFunction}, but
 * returns a promise which can be awaited.
 */
export type CreateMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = MutateFunction<TData, TError, TVariables, TOnMutateResult>

/**
 * The result of `createMutation`. Same as {@link MutationObserverResult} from `@tanstack/query-core`, with
 * `mutate` narrowed to the fire-and-forget {@link CreateMutateFunction} signature, plus the added
 * `mutateAsync`.
 */
export type CreateBaseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
  { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }
> & {
  mutateAsync: CreateMutateAsyncFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
}

/** Result from createMutation */
export type CreateMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = CreateBaseMutationResult<TData, TError, TVariables, TOnMutateResult>

/**
 * Infers the `Mutation` type passed to `useMutationState`'s `select` from the `MutationState` type it
 * returns, falling back to `Mutation` otherwise.
 */
export type MutationTypeFromResult<TResult> = [TResult] extends [
  MutationState<
    infer TData,
    infer TError,
    infer TVariables,
    infer TOnMutateResult
  >,
]
  ? Mutation<TData, TError, TVariables, TOnMutateResult>
  : Mutation

/** Options for useMutationState */
export type MutationStateOptions<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
> = {
  /**
   * The filters that select the mutations to return the state of.
   */
  filters?: MutationFilters
  /**
   * Maps each matching mutation to the value returned for it. Defaults to the mutation's `state`.
   */
  select?: (mutation: TMutation) => TResult
}

/**
 * The props accepted by `QueryClientProvider`.
 */
export type QueryClientProviderProps = {
  /**
   * The `QueryClient` to provide to the children.
   */
  client: QueryClient
  /**
   * The children that can use the provided `QueryClient`.
   */
  children: Snippet
}
