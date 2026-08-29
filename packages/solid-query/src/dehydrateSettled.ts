import { dehydrate } from '@tanstack/query-core'
import type { DehydrateOptions, DehydratedState } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'

/**
 * Waits for every fetch the client has in flight to settle, then
 * dehydrates. This is the extraction half of a single-flight collector:
 * after route data functions run for the mutation's target URL, loaders
 * commonly kick off prefetches without awaiting them — plain
 * `dehydrate()` would snapshot those mid-fetch and ship nothing.
 *
 * ```ts
 * registerFlightDataSource(FLIGHT_DATA_SOURCE, (event, outcome) =>
 *   loadFlightTarget({
 *     router,
 *     event,
 *     outcome,
 *     collect: () => dehydrateSettled(queryClient),
 *   }),
 * )
 * ```
 *
 * Settling is chased to quiescence — awaiting one batch of fetches can
 * dispatch more (dependent queries keyed off a first result) — so an
 * unconditionally self-refetching query would keep this pending; that's
 * an app bug mirrored, not guarded.
 */
export async function dehydrateSettled(
  client: QueryClient,
  options?: DehydrateOptions,
): Promise<DehydratedState> {
  const cache = client.getQueryCache()
  for (;;) {
    const pending = cache
      .getAll()
      .filter((query) => query.state.fetchStatus !== 'idle')
      .map((query) => query.promise)
    if (pending.length === 0) break
    await Promise.allSettled(pending)
  }
  return dehydrate(client, options)
}
