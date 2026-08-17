import type {
  DefaultError,
  InfiniteData,
  MutationObserverResult,
  QueryKey,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { Accessor } from './accessor.js'
import type { CreateInfiniteQueryOptions } from './createInfiniteQueryController.js'
import type { CreateMutationOptions } from './createMutationController.js'
import type {
  CreateQueriesControllerOptions,
  CreateQueriesResults,
} from './createQueriesController.js'
import type { CreateQueryOptions } from './createQueryController.js'

/**
 * Accessor-wrapped options accepted by `createQueryController`.
 */
export type QueryControllerOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Accessor<
  CreateQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
>

/**
 * Result object produced by a Lit query controller.
 */
export type QueryControllerResult<
  TData = unknown,
  TError = DefaultError,
> = QueryObserverResult<TData, TError>

/**
 * Accessor-wrapped options accepted by `createInfiniteQueryController`.
 */
export type InfiniteQueryControllerOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Accessor<
  CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
>

/**
 * Accessor-wrapped options accepted by `createMutationController`.
 */
export type MutationControllerOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Accessor<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>>

/**
 * Result object produced by a Lit mutation controller.
 */
export type MutationControllerResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = MutationObserverResult<TData, TError, TVariables, TOnMutateResult>

/**
 * Accessor-wrapped options accepted by `createQueriesController`.
 */
export type QueriesControllerOptions<
  TQueryOptions extends Array<any> = Array<any>,
  TCombinedResult = CreateQueriesResults<TQueryOptions>,
> = Accessor<CreateQueriesControllerOptions<TQueryOptions, TCombinedResult>>
