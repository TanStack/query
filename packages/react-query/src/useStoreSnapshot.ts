'use client'
import { notifyManager } from '@tanstack/query-core'
import * as React from 'react'

/**
 * Subscribes to a cache or observer with batched notifications. The subscription
 * stays stable while each render can supply its own snapshot of the same store.
 * @param store - The cache or observer to subscribe to.
 * @param getSnapshot - Reads the current value for this render.
 * @returns The store snapshot, updated when its value changes.
 */
export function useStoreSnapshot<T>(
  store: { subscribe: (listener: () => void) => () => void },
  getSnapshot: () => T,
): T {
  return React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        store.subscribe(notifyManager.batchCalls(onStoreChange)),
      [store],
    ),
    getSnapshot,
    getSnapshot,
  )
}
