import type { QRL } from '@builder.io/qwik'
import { useSignal, useVisibleTask$ } from '@builder.io/qwik'
import {
  type Query,
  type QueryFilters,
  type QueryKey,
} from '@tanstack/query-core'
import { createQueryClient } from './useQueryClient'

export const useIsFetching = (
  filters?: QueryFilters & {
    predicate?: QRL<
      () => (query: Query<unknown, Error, unknown, QueryKey>) => boolean
    >
  },
) => {
  const isFetchingSig = useSignal<number>(0)

  useVisibleTask$(({ cleanup }) => {
    const client = createQueryClient()
    const cache = client.getQueryCache()
    isFetchingSig.value = client.isFetching(filters)
    const unsubscribe = cache.subscribe(() => {
      const newIsFetching = client.isFetching(filters)
      if (isFetchingSig.value !== newIsFetching) {
        isFetchingSig.value = newIsFetching
      }
    })

    cleanup(unsubscribe)
  })

  return isFetchingSig
}
