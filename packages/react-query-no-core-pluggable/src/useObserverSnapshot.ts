'use client'
import * as React from 'react'
import { notifyManager } from './runtime/notifyManager'
import { noop } from './runtime/utils'
import type { QueryObserverResultReader } from './runtime/queryObserver'

interface ObserverStore {
  subscribe: (listener: () => void) => () => void
}

/**
 * Commits a reader and subscribes React to its cached snapshots.
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
  React.useEffect(() => {
    reader.commit()
  }, [reader])

  return React.useSyncExternalStore(
    React.useCallback(
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
    reader.getSnapshot,
  )
}
