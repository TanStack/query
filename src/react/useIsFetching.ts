import React from 'react'

import { isFetching, QueryKey } from '../core'
import { parseFilterArgs, QueryFilters } from '../core/utils'
import { useEnvironment } from './EnvironmentProvider'
import { useIsMounted } from './utils'

export function useIsFetching(filters?: QueryFilters): number
export function useIsFetching(
  queryKey?: QueryKey,
  filters?: QueryFilters
): number
export function useIsFetching(
  arg1?: QueryKey | QueryFilters,
  arg2?: QueryFilters
): number {
  const environment = useEnvironment()
  const isMounted = useIsMounted()
  const [filters] = parseFilterArgs(arg1, arg2)
  const [fetching, setFetching] = React.useState(
    isFetching(environment, filters)
  )

  const filtersRef = React.useRef(filters)
  filtersRef.current = filters
  const isFetchingRef = React.useRef(fetching)
  isFetchingRef.current = fetching

  React.useEffect(
    () =>
      environment.getQueryCache().subscribe(() => {
        if (isMounted()) {
          const newIsFetching = isFetching(environment, filtersRef.current)
          if (isFetchingRef.current !== newIsFetching) {
            setFetching(newIsFetching)
          }
        }
      }),
    [environment, isMounted]
  )

  return fetching
}
