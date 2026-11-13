import { DestroyRef, NgZone, PendingTasks, inject } from '@angular/core'

/**
 * Tracks ownership and pending work for the current Angular injection context.
 */
export interface QueryLifecycle {
  /**
   * Whether Angular has destroyed the injection context that owns this query.
   */
  readonly destroyed: boolean
  /**
   * Adds or releases the task that keeps Angular unstable while owned work is pending.
   */
  setPending: (pending: boolean) => void
}

/**
 * Tracks pending work for the lifetime of the current injection context.
 * @returns The destruction state and pending-task controller for this context.
 */
export function injectPendingTasksLifecycle(): QueryLifecycle {
  const destroyRef = inject(DestroyRef)
  const pendingTasks = inject(PendingTasks)
  const ngZone = inject(NgZone)
  let taskCleanup: (() => void) | undefined

  const lifecycle: QueryLifecycle = {
    get destroyed() {
      return destroyRef.destroyed
    },
    setPending(pending) {
      if (pending) {
        if (!destroyRef.destroyed && !taskCleanup) {
          taskCleanup = pendingTasks.add()
        }
        return
      }

      const cleanup = taskCleanup
      taskCleanup = undefined
      // Enter NgZone while our task is still held to avoid transient stability
      // before dependent queries are scheduled.
      // In zoneless apps, NgZone.run simply invokes the cleanup.
      if (cleanup) ngZone.run(cleanup)
    },
  }

  destroyRef.onDestroy(() => {
    lifecycle.setPending(false)
  })

  return lifecycle
}
