import { getCurrentScope, onScopeDispose, ref, watchEffect } from 'vue-demi'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type { Ref } from 'vue-demi'
import type { QueryFilters as QF } from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'
import type { QueryClient } from './queryClient'

export type QueryFilters = MaybeRefDeep<QF> | (() => MaybeRefDeep<QF>)

/**
 * The `useIsFetching` composable returns a `ref` to the `number` of the queries that your application is
 * loading or fetching in the background (useful for app-wide loading indicators).
 *
 * `fetchingFilters` may be a plain object, `MaybeRefDeep`, or a reactive getter (`() => ({ ... })`) — pass a
 * getter if the filters themselves depend on other reactive state.
 *
 * @param fetchingFilters - The {@link QueryFilters} to narrow down the matched queries.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
 * will be used.
 * @returns A `ref` to the `number` of the queries that your application is currently loading or fetching in
 * the background.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useIsFetching } from '@tanstack/vue-query'
 *
 * // How many queries matching the posts prefix are fetching?
 * const isFetchingPosts = useIsFetching({ queryKey: ['posts'] })
 * </script>
 *
 * <template>
 *   <span v-if="isFetchingPosts">Refreshing posts...</span>
 * </template>
 * ```
 *
 * @example
 * A global loading indicator for any query fetching in the background, not just the ones on screen:
 * ```vue
 * <script setup lang="ts">
 * import { useIsFetching } from '@tanstack/vue-query'
 *
 * const isFetching = useIsFetching()
 * </script>
 *
 * <template>
 *   <div v-if="isFetching">Queries are fetching in the background...</div>
 * </template>
 * ```
 */
export function useIsFetching(
  fetchingFilters: QueryFilters = {},
  queryClient?: QueryClient,
): Ref<number> {
  if (process.env.NODE_ENV === 'development') {
    if (!getCurrentScope()) {
      console.warn(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

  const client = queryClient || useQueryClient()

  const isFetching = ref()

  const listener = () => {
    const resolvedFilters =
      typeof fetchingFilters === 'function'
        ? fetchingFilters()
        : fetchingFilters
    isFetching.value = client.isFetching(cloneDeepUnref(resolvedFilters))
  }

  const unsubscribe = client.getQueryCache().subscribe(listener)

  watchEffect(listener)

  onScopeDispose(() => {
    unsubscribe()
  })

  return isFetching
}
