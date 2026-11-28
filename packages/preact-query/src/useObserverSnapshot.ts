import { noop, notifyManager } from '@tanstack/query-core'
import { useCallback, useEffect } from 'preact/hooks'
import { useSyncExternalStore } from './utils'
import type { QueryObserverResultReader } from '@tanstack/query-core'

interface ObserverStore {
  subscribe: (listener: () => void) => () => void
}

/**
 * Commits a reader and subscribes Preact to its cached snapshots.
 * @param observer - The observer that owns the subscription.
 * @param reader - The reader scoped to the current render options.
 * @param subscribed - Whether this render subscribes to updates.
 * @param refresh - Includes updates that occurred before the subscription started.
 * @returns The current snapshot.
 */
export function useObserverSnapshot<TObserver extends ObserverStore, TResult>(
  observer: TObserver,
  reader: QueryObserverResultReader<TResult>,
  subscribed: boolean,
  refresh: (observer: TObserver) => void,
): TResult {
  useEffect(() => {
    reader.commit()
  }, [reader])

  return useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        const unsubscribe = subscribed
          ? observer.subscribe(notifyManager.batchCalls(onStoreChange))
          : noop
        refresh(observer)
        return unsubscribe
      },
      [observer, subscribed, refresh],
    ),
    reader.getSnapshot,
  )
}
