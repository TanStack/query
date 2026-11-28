import { queryOptions, useQuery } from '#adapter'
import type { UndefinedInitialDataOptions } from '#adapter'

export function useBookQuery<TQueryData, TData = TQueryData>(
  options: UndefinedInitialDataOptions<TQueryData, Error, TData>,
) {
  return useQuery(queryOptions(options))
}

export { isError, isPending } from '#adapter'
