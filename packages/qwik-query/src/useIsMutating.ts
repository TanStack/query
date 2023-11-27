import type { QRL } from '@builder.io/qwik'
import { useSignal, useVisibleTask$ } from '@builder.io/qwik'
import type { Mutation, MutationFilters } from '@tanstack/query-core'
import { createQueryClient } from './useQueryClient'

export const useIsMutating = (
  filters?: MutationFilters & {
    predicate: QRL<() => (mutation: Mutation<any, any, any>) => boolean>
  },
) => {
  const isMutatingSig = useSignal<number>(0)

  useVisibleTask$(({ cleanup }) => {
    const client = createQueryClient()
    const cache = client.getQueryCache()
    isMutatingSig.value = client.isMutating(filters)
    const unsubscribe = cache.subscribe(() => {
      const newIsMutating = client.isMutating(filters)
      if (isMutatingSig.value !== newIsMutating) {
        isMutatingSig.value = newIsMutating
      }
      // notifyManager.batchCalls
    })

    cleanup(unsubscribe)
  })

  return isMutatingSig
}
