import type { DefaultError, QueryKey } from './types'

/** Runtime implementations bind these slots to their own nominal class types. */
export interface RuntimeBinding {
  args: unknown
  QueryClient: unknown
  QueryCache: unknown
  MutationCache: unknown
  Query: unknown
  Mutation: unknown
  QueryObserver: unknown
  MutationObserver: unknown
}

export type QueryClientOf<TRuntime extends RuntimeBinding> =
  TRuntime['QueryClient']

export type QueryCacheOf<TRuntime extends RuntimeBinding> =
  TRuntime['QueryCache']

export type MutationCacheOf<TRuntime extends RuntimeBinding> =
  TRuntime['MutationCache']

export type QueryOf<
  TRuntime extends RuntimeBinding,
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = (TRuntime & { args: [TQueryFnData, TError, TData, TQueryKey] })['Query']

export type MutationOf<
  TRuntime extends RuntimeBinding,
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = (TRuntime & {
  args: [TData, TError, TVariables, TOnMutateResult]
})['Mutation']

export type QueryObserverOf<
  TRuntime extends RuntimeBinding,
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = (TRuntime & {
  args: [TQueryFnData, TError, TData, TQueryData, TQueryKey]
})['QueryObserver']

export type MutationObserverOf<
  TRuntime extends RuntimeBinding,
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = (TRuntime & {
  args: [TData, TError, TVariables, TOnMutateResult]
})['MutationObserver']
