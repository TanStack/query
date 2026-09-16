import { NgZone, inject } from '@angular/core'

/** Keep Query's background timers out of Angular's stability tracking. */
export function injectQueryZone() {
  const ngZone = inject(NgZone)
  return <T>(fn: () => T): T => ngZone.runOutsideAngular(fn)
}
