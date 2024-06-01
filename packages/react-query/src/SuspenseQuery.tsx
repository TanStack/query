import { useSuspenseQuery } from './useSuspenseQuery'
import type { ReactNode } from 'react'
import type { DefaultError, QueryKey } from '@tanstack/query-core'
import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from './types'

export const SuspenseQuery = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>({
  children,
  ...useQueryOptions
}: {
  children: (result: UseSuspenseQueryResult<TData, TError>) => ReactNode
} & UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) => (
  <>{children(useSuspenseQuery(useQueryOptions))}</>
)
