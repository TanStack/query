import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'

/**
 * This is taken from https://github.com/preactjs/preact/blob/main/compat/src/hooks.js#L8-L54
 * which is taken from https://github.com/facebook/react/blob/main/packages/use-sync-external-store/src/useSyncExternalStoreShimClient.js#L84
 * on a high level this cuts out the warnings, ... and attempts a smaller implementation.
 * This way we don't have to import preact/compat with side effects
 */
type InternalStore = {
  _value: any
  _getSnapshot: () => any
}
type StoreRef = {
  _instance: InternalStore
}
/**
 * Subscribes to an external store and returns its current snapshot, re-rendering when it changes.
 * @param subscribe - Subscribes to the store, and returns a function that unsubscribes.
 * @param getSnapshot - Returns the current snapshot of the store.
 * @returns The current snapshot.
 */
export function useSyncExternalStore(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => any,
) {
  const value = getSnapshot()

  const [{ _instance }, forceUpdate] = useState<StoreRef>({
    _instance: { _value: value, _getSnapshot: getSnapshot },
  })

  useLayoutEffect(() => {
    _instance._value = value
    _instance._getSnapshot = getSnapshot

    if (didSnapshotChange(_instance)) {
      forceUpdate({ _instance })
    }
  }, [subscribe, value, getSnapshot])

  useEffect(() => {
    if (didSnapshotChange(_instance)) {
      forceUpdate({ _instance })
    }

    return subscribe(() => {
      if (didSnapshotChange(_instance)) {
        forceUpdate({ _instance })
      }
    })
  }, [subscribe])

  return value
}

/**
 * Checks whether the store's snapshot changed since it was last read.
 * @param inst - The stored snapshot and the function that reads the current one.
 * @returns `true` if the current snapshot differs, or if reading it throws.
 */
function didSnapshotChange(inst: {
  _getSnapshot: () => any
  _value: any
}): boolean {
  const latestGetSnapshot = inst._getSnapshot
  const prevValue = inst._value
  try {
    const nextValue = latestGetSnapshot()
    return !Object.is(prevValue, nextValue)
  } catch (_error) {
    return true
  }
}

/**
 * Like {@link useSyncExternalStore}, but returns a selected part of the snapshot, only updating it
 * when `isEqual` reports a change.
 * @param subscribe - Subscribes to the store, and returns a function that unsubscribes.
 * @param getSnapshot - Returns the current snapshot of the store.
 * @param selector - Selects the part of the snapshot to return.
 * @param isEqual - Compares the previous and the new selection.
 * @returns The selected part of the current snapshot.
 */
export function useSyncExternalStoreWithSelector<TSnapshot, TSelected>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => TSnapshot,
  selector: (snapshot: TSnapshot) => TSelected,
  isEqual: (a: TSelected, b: TSelected) => boolean,
): TSelected {
  const selectedSnapshotRef = useRef<TSelected | undefined>(undefined)

  const getSelectedSnapshot = () => {
    const snapshot = getSnapshot()
    const selected = selector(snapshot)

    if (
      selectedSnapshotRef.current === undefined ||
      !isEqual(selectedSnapshotRef.current, selected)
    ) {
      selectedSnapshotRef.current = selected
    }

    return selectedSnapshotRef.current
  }

  return useSyncExternalStore(subscribe, getSelectedSnapshot)
}
