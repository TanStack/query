import { Injector, type Signal, computed, inject } from '@angular/core'

type SignalInitializerFn<T> = (injector: Injector) => Signal<T>

export function lazySignalInitializer<T>(
  initializerFn: SignalInitializerFn<T>,
) {
  const injector = inject(Injector)

  let source: Signal<T> | null = null

  const initializeObject = () => {
    if (!source) {
      source = initializerFn(injector)
    }
    return source
  }

  queueMicrotask(() => initializeObject())

  return computed(() => {
    if (!source) {
      source = initializeObject()
    }
    return source()
  })
}
