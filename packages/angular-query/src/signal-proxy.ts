import { computed, untracked } from '@angular/core'
import type { Signal } from '@angular/core'

export type MapToSignals<T> = {
  [K in keyof T]: T[K] extends Function ? T[K] : Signal<T[K]>
}

/**
 * Exposes fields of an object passed via an Angular `Signal` as `Computed` signals.
 * Functions on the object are passed through as-is.
 * @param inputSignal - `Signal` that must return an object.
 * @returns A proxy object with the same fields as the input object, but with each field wrapped in a `Computed` signal.
 */
export function signalProxy<TInput extends Record<string | symbol, any>>(
  inputSignal: Signal<TInput>,
) {
  const internalState = {} as MapToSignals<TInput>

  return new Proxy<MapToSignals<TInput>>(internalState, {
    get(target, prop) {
      // first check if we have it in our internal state and return it
      const computedField = target[prop]
      if (computedField) return computedField

      // then, check if it's a function on the resultState and return it
      const targetField = untracked(inputSignal)[prop]
      if (typeof targetField === 'function') return targetField

      // finally, create a computed field, store it and return it
      // @ts-expect-error
      return (target[prop] = computed(() => inputSignal()[prop]))
    },
    has(_, prop) {
      return !!untracked(inputSignal)[prop]
    },
    ownKeys() {
      return Reflect.ownKeys(untracked(inputSignal))
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: true,
        configurable: true,
      }
    },
  })
}
