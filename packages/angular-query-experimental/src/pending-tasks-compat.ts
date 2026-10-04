import { InjectionToken, inject } from '@angular/core'
import * as ng from '@angular/core'
import { noop } from '@tanstack/query-core'

type PendingTasksCompat = { add: () => PendingTaskRef }

/**
 * Removes a pending task registered with Angular's `PendingTasks`, so the app can become stable
 * again. Without `PendingTasks` (Angular < 19), it does nothing.
 */
export type PendingTaskRef = () => void

export const PENDING_TASKS = new InjectionToken<PendingTasksCompat>(
  'PENDING_TASKS',
  {
    factory: (): PendingTasksCompat => {
      // Access via Reflect so bundlers stay quiet when the token is absent (Angular < 19).
      const token = Reflect.get(ng, 'PendingTasks') as unknown as
        Parameters<typeof inject>[0] | undefined

      const svc: PendingTasksCompat | null = token
        ? (inject(token, { optional: true }) as PendingTasksCompat | null)
        : null

      // Without PendingTasks we fall back to a stable no-op shim.
      return {
        add: svc ? () => svc.add() : () => noop,
      }
    },
  },
)
