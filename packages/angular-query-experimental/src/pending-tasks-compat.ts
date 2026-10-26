import { InjectionToken, inject } from '@angular/core'
import * as ng from '@angular/core'
import { noop } from '@tanstack/query-core'
import type { ProviderToken } from '@angular/core'

type PendingTasksCompat = { add: () => PendingTaskRef }

/**
 * Removes a pending task registered with Angular's `PendingTasks`, so the app can become stable
 * again. Without `PendingTasks` (Angular < 19), it does nothing.
 */
export type PendingTaskRef = () => void

/**
 * `PendingTasks` is only exported by Angular 19+, but the peer range starts at 16, so it is read
 * off the namespace object instead of being imported by name.
 */
type AngularCoreCompat = {
  PendingTasks?: ProviderToken<PendingTasksCompat>
}

export const PENDING_TASKS = new InjectionToken<PendingTasksCompat>(
  'PENDING_TASKS',
  {
    factory: (): PendingTasksCompat => {
      // Read the token with a static member access. A `Reflect.get(ng, 'PendingTasks')`
      // lookup behaves the same at runtime, but it forces bundlers to keep every export
      // of `@angular/core` alive, which drags the whole framework into the initial
      // bundle of apps that call `injectQuery`/`injectMutation` — even when they only
      // use them in a lazy chunk. `ng.PendingTasks` can be tree-shaken like a named
      // import. On Angular < 19 it is `undefined` and the no-op shim below is used;
      // bundlers report the missing export as a warning rather than an error.
      const token = (ng as unknown as AngularCoreCompat).PendingTasks

      const svc = token ? inject(token, { optional: true }) : null

      // Without PendingTasks we fall back to a stable no-op shim.
      return {
        add: svc ? () => svc.add() : () => noop,
      }
    },
  },
)
