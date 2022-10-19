import type {
  QueryKey,
  QueryObserverOptions,
  InfiniteQueryObserverOptions,
  MutationObserverOptions
} from '@tanstack/query-core'
import type { Ref, UnwrapRef } from 'vue-demi'
import type { QueryClient } from './queryClient'

export type MaybeRef<T> = Ref<T> | T

export type MaybeRefDeep<T> = T extends Function
  ? T
  : MaybeRef<
      T extends object
        ? {
            [Property in keyof T]: MaybeRefDeep<T[Property]>
          }
        : T
    >

export type WithQueryClientKey<T> = T & {
  queryClientKey?: string
  queryClient?: QueryClient
}

export type VueMutationObserverOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> = {
  [Property in keyof MutationObserverOptions<
    TData,
    TError,
    TVariables,
    TContext
  >]: MaybeRefDeep<
    MutationObserverOptions<TData, TError, TVariables, TContext>[Property]
  >
}

// A Vue version of QueriesObserverOptions from "@tanstack/query-core"
// Accept refs as options
export type VueQueryObserverOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = {
  [Property in keyof QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >]: Property extends 'queryFn'
    ? QueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        UnwrapRef<TQueryKey>
      >[Property]
    : MaybeRef<
        QueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryData,
          TQueryKey
        >[Property]
      >
}

// A Vue version of InfiniteQueryObserverOptions from "@tanstack/query-core"
// Accept refs as options
export type VueInfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = unknown,
  TQueryData = unknown,
  TQueryKey extends QueryKey = QueryKey,
> = {
  [Property in keyof InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >]: Property extends 'queryFn'
    ? InfiniteQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        UnwrapRef<TQueryKey>
      >[Property]
    : MaybeRef<
        InfiniteQueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryData,
          TQueryKey
        >[Property]
      >
}
