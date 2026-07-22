// The binding-level type surface — a 1:1 port of @tanstack/react-query's
// types.ts (it is built entirely on query-core generics; nothing here is
// React-specific), plus the component prop / context-value types at the bottom
// (where upstream's React.ReactNode becomes octane's `unknown` renderable).
import type {
  DefaultError,
  DefinedInfiniteQueryObserverResult,
  DefinedQueryObserverResult,
  DehydratedState,
  DistributiveOmit,
  FetchQueryOptions,
  HydrateOptions,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutateFunction,
  MutationObserverOptions,
  MutationObserverResult,
  OmitKeyof,
  Override,
  QueryClient,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  SkipToken,
} from '@tanstack/query-core'

export type AnyUseBaseQueryOptions = UseBaseQueryOptions<
  any,
  any,
  any,
  any,
  any
>
export interface UseBaseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends QueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey
> {
  /**
   * Set this to `false` to unsubscribe this observer from updates to the query cache.
   * Defaults to `true`.
   */
  subscribed?: boolean
}

export interface UsePrefetchQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends OmitKeyof<
  FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryFn'
> {
  queryFn?: Exclude<
    FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>['queryFn'],
    SkipToken
  >
}

export type AnyUseQueryOptions = UseQueryOptions<any, any, any, any>
export interface UseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends OmitKeyof<
  UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'suspense'
> {}

export type AnyUseSuspenseQueryOptions = UseSuspenseQueryOptions<
  any,
  any,
  any,
  any
>
export interface UseSuspenseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends OmitKeyof<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryFn' | 'enabled' | 'throwOnError' | 'placeholderData'
> {
  queryFn?: Exclude<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>['queryFn'],
    SkipToken
  >
}

export type AnyUseInfiniteQueryOptions = UseInfiniteQueryOptions<
  any,
  any,
  any,
  any,
  any
>
export interface UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends OmitKeyof<
  InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  'suspense'
> {
  /**
   * Set this to `false` to unsubscribe this observer from updates to the query cache.
   * Defaults to `true`.
   */
  subscribed?: boolean
}

export type AnyUseSuspenseInfiniteQueryOptions =
  UseSuspenseInfiniteQueryOptions<any, any, any, any, any>
export interface UseSuspenseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends OmitKeyof<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryFn' | 'enabled' | 'throwOnError' | 'placeholderData'
> {
  queryFn?: Exclude<
    UseInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >['queryFn'],
    SkipToken
  >
}

export type UseBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = QueryObserverResult<TData, TError>

export type UseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = UseBaseQueryResult<TData, TError>

export type UseSuspenseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DistributiveOmit<
  DefinedQueryObserverResult<TData, TError>,
  'isPlaceholderData' | 'promise'
>

export type DefinedUseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedQueryObserverResult<TData, TError>

export type UseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = InfiniteQueryObserverResult<TData, TError>

export type DefinedUseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedInfiniteQueryObserverResult<TData, TError>

export type UseSuspenseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = OmitKeyof<
  DefinedInfiniteQueryObserverResult<TData, TError>,
  'isPlaceholderData' | 'promise'
>

export type AnyUseMutationOptions = UseMutationOptions<any, any, any, any>
export interface UseMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
  '_defaulted'
> {}

export type UseMutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = (
  ...args: Parameters<
    MutateFunction<TData, TError, TVariables, TOnMutateResult>
  >
) => void

export type UseMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = MutateFunction<TData, TError, TVariables, TOnMutateResult>

export type UseBaseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
  { mutate: UseMutateFunction<TData, TError, TVariables, TOnMutateResult> }
> & {
  mutateAsync: UseMutateAsyncFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
}

export type UseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = UseBaseMutationResult<TData, TError, TVariables, TOnMutateResult>

// ---------------------------------------------------------------------------
// Component prop + context-value types (octane: children are renderables, so
// upstream's React.ReactNode becomes `unknown`; render-prop children are also
// accepted where upstream accepts them).
// ---------------------------------------------------------------------------

export interface QueryClientProviderProps {
  client: QueryClient
  children?: unknown
}

export interface HydrationBoundaryProps {
  state: DehydratedState | null | undefined
  options?: OmitKeyof<HydrateOptions, 'defaultOptions'> & {
    defaultOptions?: OmitKeyof<
      Exclude<HydrateOptions['defaultOptions'], undefined>,
      'mutations'
    >
  }
  children?: unknown
  queryClient?: QueryClient
}

export type QueryErrorResetFunction = () => void
export type QueryErrorIsResetFunction = () => boolean
export type QueryErrorClearResetFunction = () => void

export interface QueryErrorResetBoundaryValue {
  clearReset: QueryErrorClearResetFunction
  isReset: QueryErrorIsResetFunction
  reset: QueryErrorResetFunction
}

export type QueryErrorResetBoundaryFunction = (
  value: QueryErrorResetBoundaryValue,
) => unknown

export interface QueryErrorResetBoundaryProps {
  children: QueryErrorResetBoundaryFunction | unknown
}
