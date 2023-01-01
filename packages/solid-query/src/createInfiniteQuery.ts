import type { QueryObserver, QueryOptions } from '@tanstack/query-core'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  SolidQueryKey,
} from './types'
import { createBaseQuery } from './createBaseQuery'
import { createComputed } from 'solid-js'
import { createStore } from 'solid-js/store'
import { normalizeQueryOptions } from './utils'

export function createInfiniteQuery<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  options: CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  >,
): CreateInfiniteQueryResult<TData, TError> {
  // The parseQuery Args functions helps normalize the arguments into the correct form.
  // Whatever the parameters are, they are normalized into the correct form.
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
    InfiniteQueryObserver as typeof QueryObserver,
  ) as CreateInfiniteQueryResult<TData, TError>
}
