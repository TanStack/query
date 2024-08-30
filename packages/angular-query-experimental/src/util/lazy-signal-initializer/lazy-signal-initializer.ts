import { Injector, computed, inject, untracked } from '@angular/core'
import type { Signal } from '@angular/core'

type SignalInitializerFn<T> = (injector: Injector) => Signal<T>

export function lazySignalInitializer<T>(
  initializerFn: SignalInitializerFn<T>,
) {
  const injector = inject(Injector)

  let source: Signal<T> | null = null

  const unwrapSignal = () => {
    if (!source) {
      source = untracked(() => initializerFn(injector))
    }
    return source()
  }

  queueMicrotask(() => unwrapSignal())

  return computed(unwrapSignal)
}
