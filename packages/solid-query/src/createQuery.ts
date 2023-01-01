import type { QueryOptions } from '@tanstack/query-core'
import { QueryObserver } from '@tanstack/query-core'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
  SolidQueryKey,
} from './types'
import { createComputed } from 'solid-js'
import { createStore } from 'solid-js/store'
import { normalizeQueryOptions } from './utils'
import { createBaseQuery } from './createBaseQuery'

type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
> = CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData?: undefined
}

type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
> = CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData: TQueryFnData | (() => TQueryFnData)
}

// There is one way to create a query.
// 1. createQuery(options: CreateQueryOptions)

export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedCreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  options: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): CreateQueryResult<TData, TError> {
  const [parsedOptions, setParsedOptions] = createStore(
    normalizeQueryOptions(options),
  )
  // Watch for changes in the options and update the parsed options.
  createComputed(() => {
    const newParsedOptions = normalizeQueryOptions(options)
    setParsedOptions(newParsedOptions)
  })

  return createBaseQuery(
    parsedOptions as QueryOptions<any, any, any, ReturnType<TQueryKey>>,
    QueryObserver,
  )
}
