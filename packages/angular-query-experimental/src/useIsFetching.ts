import {
  DestroyRef,
  assertInInjectionContext,
  inject,
  signal,
} from '@angular/core'
import {
  type QueryClient,
  type QueryFilters,
  notifyManager,
} from '@tanstack/query-core'
import { QueryClientService } from './QueryClientService'
import type { Signal } from '@angular/core'

export function useIsFetching(
  filters?: QueryFilters,
  queryClient?: QueryClient,
): Signal<number> {
  assertInInjectionContext(useIsFetching)

  const destroyRef = inject(DestroyRef)

  /** Load query client */
  if (!queryClient) {
    queryClient = inject(QueryClientService).useQueryClient()
  }
  const cache = queryClient.getQueryCache()
  // isFetching is the prev value initialized on mount *
  let isFetching = queryClient.isFetching(filters)

  const result = signal(isFetching)
  const unsubscribe = cache.subscribe(
    notifyManager.batchCalls(() => {
      const newIsFetching = queryClient!.isFetching(filters)
      if (isFetching !== newIsFetching) {
        // * and update with each change
        isFetching = newIsFetching
        result.set(isFetching)
      }
    }),
  )

  destroyRef.onDestroy(unsubscribe)
  return result
}
