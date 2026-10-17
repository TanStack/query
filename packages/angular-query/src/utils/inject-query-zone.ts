import { NgZone, inject } from '@angular/core'

/**
 * Keeps Query's background timers out of Angular's stability tracking.
 * @returns A function that runs callbacks outside the injected NgZone.
 */
export function injectQueryZone() {
  const ngZone = inject(NgZone)
  return <T>(fn: () => T): T => ngZone.runOutsideAngular(fn)
}
