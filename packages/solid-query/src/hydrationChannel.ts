import { hydrate } from '@tanstack/query-core'
import { createContext, runWithOwner } from 'solid-js'
import type { DehydratedState, QueryState } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'

type DehydratedQueryEntry = DehydratedState['queries'][number]

/**
 * A single message on the dehydration channel. `entries` is *cumulative* —
 * every yield carries all entries settled so far. Two reasons:
 *
 * - It is what makes Solid's signal-path hydration replay lossless.
 *   Yields still buffered when hydration begins are conflated to the
 *   LATEST one (`normalizeIterator` drains synchronously available
 *   results, keeps the last data yield, and delivers the stream's done
 *   result on a subsequent pull), so each yield must be self-contained:
 *   the latest cumulative snapshot alone carries everything the dropped
 *   intermediates did. Requires the solid-js build with that conflation
 *   behavior (> 2.0.0-beta.32); earlier betas pinned the replay at the
 *   FIRST buffered yield, dropping every later entry and the `done`
 *   marker.
 * - Entry objects keep their identity across yields, so seroval's
 *   cross-reference serialization emits each entry once and later yields
 *   only reference it — the cumulative shape costs bytes proportional to
 *   the number of entries, not its square.
 *
 * `done: true` marks the final yield. The client uses it to release
 * subscribers still waiting for entries that will never arrive (e.g.
 * queries that errored during SSR and were not dehydrated).
 */
export interface DehydrationChannelYield {
  entries: Array<DehydratedQueryEntry>
  done: boolean
}

/**
 * Server side of the library-owned serialization channel.
 *
 * Returns an AsyncIterable that yields a cumulative snapshot of the
 * dehydrated query cache (success entries, per query-core `dehydrate()`
 * shapes) every time a query settles during SSR. `QueryClientProvider`
 * holds it as a signal value, so Solid serializes it through the normal
 * per-computation path: the server runtime tees the iterator into the
 * hydration serializer (`ctx.serialize(id, tapped)` in solid-js'
 * `processResult`) and seroval streams each yield to the client as a
 * script chunk riding the SSR stream.
 *
 * The iterable must terminate for the SSR stream to complete: the
 * hydration serializer's `flush()` only fires its `onDone` once all
 * pending streams have closed, and the render root is disposed *after*
 * that, so neither `onCleanup` nor the serializer itself can close the
 * channel. Instead the channel closes itself on cache quiescence: after
 * every cache event (and once at creation) it schedules a timer-task
 * check; if no query is fetching by then, no further settle can occur —
 * suspense retry passes that start waterfall fetches are scheduled on
 * microtasks, so they have begun before the check runs — and the channel
 * emits its final cumulative snapshot with `done: true` and completes.
 *
 * Single-consumer by design: solid-js creates exactly one iterator from
 * the value and shares it between the memo and the serializer tap.
 */
export function createServerDehydrationChannel(
  client: QueryClient,
): AsyncIterable<DehydrationChannelYield> {
  const cache = client.getQueryCache()
  // Entry objects are reused across yields while the query's state object
  // is unchanged, both so seroval can deduplicate them by reference and
  // so the client can cheaply skip already-applied entries.
  const entryCache = new Map<
    string,
    { state: QueryState<unknown, unknown>; entry: DehydratedQueryEntry }
  >()

  const snapshot = (): Array<DehydratedQueryEntry> => {
    const entries: Array<DehydratedQueryEntry> = []
    for (const query of cache.getAll()) {
      // Mirrors query-core's defaultShouldDehydrateQuery.
      if (query.state.status !== 'success') continue
      let cached = entryCache.get(query.queryHash)
      if (!cached || cached.state !== query.state) {
        cached = {
          state: query.state,
          entry: {
            dehydratedAt: Date.now(),
            state: query.state,
            queryKey: query.queryKey,
            queryHash: query.queryHash,
            ...(query.meta && { meta: query.meta }),
            ...(query.queryType && { queryType: query.queryType }),
          },
        }
        entryCache.set(query.queryHash, cached)
      }
      entries.push(cached.entry)
    }
    return entries
  }

  let closed = false
  let pull: ((result: IteratorResult<DehydrationChannelYield>) => void) | null =
    null
  const buffered: Array<DehydrationChannelYield> = []

  const emit = (value: DehydrationChannelYield) => {
    if (closed) return
    if (value.done) closed = true
    if (pull) {
      const resolve = pull
      pull = null
      resolve({ done: false, value })
    } else {
      buffered.push(value)
    }
  }

  let closeTimer: ReturnType<typeof setTimeout> | null = null
  const scheduleCloseCheck = () => {
    if (closed || closeTimer !== null) return
    closeTimer = setTimeout(() => {
      closeTimer = null
      if (closed) return
      if (client.isFetching() === 0) {
        unsubscribe()
        emit({ entries: snapshot(), done: true })
      }
    }, 0)
  }

  const unsubscribe = cache.subscribe((event) => {
    if (closed) return
    if (event.type === 'updated' && event.action.type === 'success') {
      emit({ entries: snapshot(), done: false })
    }
    scheduleCloseCheck()
  })
  scheduleCloseCheck()

  return {
    [Symbol.asyncIterator]() {
      return {
        next() {
          if (buffered.length > 0) {
            return Promise.resolve({ done: false, value: buffered.shift()! })
          }
          if (closed) {
            return Promise.resolve({
              done: true as const,
              value: undefined,
            })
          }
          return new Promise<IteratorResult<DehydrationChannelYield>>(
            (resolve) => {
              pull = resolve
            },
          )
        },
        return(value?: unknown) {
          if (!closed) {
            closed = true
            unsubscribe()
            if (closeTimer !== null) {
              clearTimeout(closeTimer)
              closeTimer = null
            }
            const resolve = pull
            pull = null
            resolve?.({ done: true, value: undefined })
          }
          return Promise.resolve({
            done: true as const,
            value: value as DehydrationChannelYield,
          })
        },
      }
    },
  }
}

interface HydrationCoordinator {
  /**
   * Prime the QueryClient from a channel yield. Entries already applied
   * (same queryHash and dataUpdatedAt) are skipped; the rest go through
   * query-core `hydrate()`, which keeps whichever data is newer.
   */
  applyYield: (value: DehydrationChannelYield) => void
  /**
   * Invoke `callback` (on a microtask) once the entry for `queryHash` has
   * been applied — or immediately-on-a-microtask if it already was, or
   * when the channel completes without one (SSR-errored queries are not
   * dehydrated, so their components must not wait forever).
   */
  whenQueryPrimed: (queryHash: string, callback: () => void) => void
}

/**
 * Client side of the channel. Created by `QueryClientProvider` on the
 * client and handed to `useBaseQuery` via context so hydrated components
 * can attach their observers as soon as their query's entry has been
 * primed — per query, not at global hydration end, which keeps
 * early-hydrated components live while other boundaries still stream.
 */
export function createHydrationCoordinator(
  client: () => QueryClient,
): HydrationCoordinator {
  // queryHash -> dataUpdatedAt of the applied entry
  const applied = new Map<string, number>()
  const waiters = new Map<string, Array<() => void>>()
  let channelDone = false

  const fireWaiters = (queryHash: string) => {
    const callbacks = waiters.get(queryHash)
    if (!callbacks) return
    waiters.delete(queryHash)
    for (const callback of callbacks) queueMicrotask(callback)
  }

  return {
    applyYield(value) {
      const fresh = value.entries.filter(
        (entry) => applied.get(entry.queryHash) !== entry.state.dataUpdatedAt,
      )
      if (fresh.length > 0) {
        // hydrate() synchronously notifies cache subscribers which may
        // write to stores/signals; escape the owned scope (this runs
        // inside the provider's render effect) so those writes are
        // allowed.
        runWithOwner(null, () =>
          hydrate(client(), { queries: fresh, mutations: [] }),
        )
        for (const entry of fresh) {
          applied.set(entry.queryHash, entry.state.dataUpdatedAt)
          fireWaiters(entry.queryHash)
        }
      }
      if (value.done && !channelDone) {
        channelDone = true
        const remaining = [...waiters.values()]
        waiters.clear()
        for (const callbacks of remaining) {
          for (const callback of callbacks) queueMicrotask(callback)
        }
      }
    },
    whenQueryPrimed(queryHash, callback) {
      if (channelDone || applied.has(queryHash)) {
        queueMicrotask(callback)
        return
      }
      let list = waiters.get(queryHash)
      if (!list) {
        list = []
        waiters.set(queryHash, list)
      }
      list.push(callback)
    },
  }
}

export const HydrationCoordinatorContext =
  createContext<HydrationCoordinator | null>(null)
