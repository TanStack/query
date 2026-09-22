import { getIsRestoringContext } from './context.js'
import type { Box } from './containers.svelte.js'

/**
 * If you are using `PersistQueryClientProvider`, you can also use the `useIsRestoring` function alongside it to
 * check if a restore is currently in progress. `createQuery` and friends also check this internally to avoid
 * race conditions between the restore and mounting queries.
 *
 * @returns A reactive box — read `.current` for `true` while a persisted client is being restored, `false`
 * otherwise.
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useIsRestoring } from '@tanstack/svelte-query'
 *
 *   const isRestoring = useIsRestoring()
 * </script>
 *
 * {#if isRestoring.current}
 *   <div>Restoring cached data...</div>
 * {/if}
 * ```
 */
export function useIsRestoring(): Box<boolean> {
  return getIsRestoringContext()
}
