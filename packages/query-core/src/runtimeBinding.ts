import type { RuntimeBinding } from '@tanstack/query-types/bindings'
import type { Mutation } from './mutation'
import type { MutationCache } from './mutationCache'
import type { MutationObserver } from './mutationObserver'
import type { Query } from './query'
import type { QueryCache } from './queryCache'
import type { QueryClient } from './queryClient'
import type { QueryObserver } from './queryObserver'
import type { QueryKey } from './types'

/** Binds shared option and callback types to the concrete classes in this runtime. */
export interface QueryRuntime extends RuntimeBinding {
  QueryClient: QueryClient
  QueryCache: QueryCache
  MutationCache: MutationCache
  Query: this['args'] extends [
    infer TQueryFnData,
    infer TError,
    infer TData,
    infer TQueryKey extends QueryKey,
  ]
    ? Query<TQueryFnData, TError, TData, TQueryKey>
    : never
  Mutation: this['args'] extends [
    infer TData,
    infer TError,
    infer TVariables,
    infer TOnMutateResult,
  ]
    ? Mutation<TData, TError, TVariables, TOnMutateResult>
    : never
  QueryObserver: this['args'] extends [
    infer TQueryFnData,
    infer TError,
    infer TData,
    infer TQueryData,
    infer TQueryKey extends QueryKey,
  ]
    ? QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    : never
  MutationObserver: this['args'] extends [
    infer TData,
    infer TError,
    infer TVariables,
    infer TOnMutateResult,
  ]
    ? MutationObserver<TData, TError, TVariables, TOnMutateResult>
    : never
}
