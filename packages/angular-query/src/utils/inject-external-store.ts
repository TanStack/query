import {
  DestroyRef,
  assertInInjectionContext,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core'
import { injectQueryZone } from './inject-query-zone'
import type { Signal, ValueEqualityFn } from '@angular/core'

interface ExternalBinding<T> {
  /** Synchronous snapshot. Angular signals read here are tracked dependencies. */
  readonly getSnapshot: () => T
  /** Omit to pause observation; changing eligibility requires a new descriptor. */
  readonly subscribe?: ((notify: () => void) => () => void) | undefined
}

interface ExternalStoreOptions<T> {
  /** Snapshot equality, defaulting to Object.is. Does not control connection identity. */
  readonly equal?: ValueEqualityFn<T> | undefined
}

/**
 * Creates a readonly Angular signal backed by a synchronous external store.
 *
 * Store access, subscription setup, and cleanup run outside NgZone so background
 * timers do not hold Angular stability open.
 *
 * Reads evaluate snapshots without subscribing. An effect owns the subscription
 * and invalidates the snapshot after setup, closing the gap between an early
 * read and connection. The next read recomputes the snapshot; equality prevents
 * unchanged values from propagating. Unread snapshots stay lazy.
 *
 * Notifications invalidate snapshots synchronously once connected. Snapshot-only
 * dependencies do not reinstall the subscription. Subscription setup and cleanup
 * may read the returned signal; factories and snapshot readers must not recurse.
 *
 * Only factory/snapshot errors are exposed on reads. Subscription and cleanup
 * errors follow Angular's normal effect error handling; the helper does not store
 * them or implement retries. Destruction stops observation without changing the
 * cached snapshot.
 */
export function injectExternalStore<T>(
  binding: () => ExternalBinding<T>,
  options?: ExternalStoreOptions<T>,
): Signal<T> {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    assertInInjectionContext(injectExternalStore)
  }
  const owner = inject(DestroyRef)
  const outsideZone = injectQueryZone()
  const revision = signal(0)
  const requested = computed(() => outsideZone(binding))
  const invalidate = () => untracked(() => revision.update((n) => n + 1))

  effect((onCleanup) => {
    // The previous subscription's cleanup may have destroyed the owner.
    if (owner.destroyed) return
    const current = requested()
    outsideZone(() =>
      untracked(() => {
        try {
          const unsubscribe = current.subscribe?.(invalidate)
          if (unsubscribe) {
            // subscribe() can trigger component/injector destruction before returning.
            // Registering cleanup afterward misses that destruction.
            if (owner.destroyed) unsubscribe()
            else onCleanup(() => outsideZone(unsubscribe))
          }
        } finally {
          // Invalidate after subscribing so an early cached snapshot cannot miss
          // changes before or during setup. Do not eagerly read the snapshot.
          invalidate()
        }
      }),
    )
  })

  return computed(
    () => {
      revision()
      return outsideZone(() => requested().getSnapshot())
    },
    options?.equal ? { equal: options.equal } : undefined,
  )
}
