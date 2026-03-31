import { Injectable, isDevMode } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { fromEvent, map, scan } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class DevtoolsOptionsManager {
  readonly loadDevtools = toSignal(
    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      map(
        (event): boolean =>
          event.metaKey && event.ctrlKey && event.shiftKey && event.key === 'D',
      ),
      scan((acc, curr) => acc || curr, false),
    ),
    {
      initialValue: false,
    },
  )
}
