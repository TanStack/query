import {
  DestroyRef,
  assertInInjectionContext,
  inject,
  signal,
} from '@angular/core'
import {
  type MutationFilters,
  type QueryClient,
  notifyManager,
} from '@tanstack/query-core'
import { QueryClientService } from './QueryClientService'
import type { Signal } from '@angular/core'

export function useIsMutating(
  filters?: MutationFilters,
  queryClient?: QueryClient,
): Signal<number> {
  assertInInjectionContext(useIsMutating)
  const client = inject(QueryClientService).useQueryClient(queryClient)
  const cache = client.getMutationCache()
  // isMutating is the prev value initialized on mount *
  let isMutating = client.isMutating(filters)

  const result = signal(isMutating)
  const unsubscribe = cache.subscribe(
    notifyManager.batchCalls(() => {
      const newIsMutating = client.isMutating(filters)
      if (isMutating !== newIsMutating) {
        // * and update with each change
        isMutating = newIsMutating
        result.set(isMutating)
      }
    }),
  )
  const destroyRef = inject(DestroyRef)
  destroyRef.onDestroy(unsubscribe)
  return result
}
