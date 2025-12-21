import { computed, untracked } from '@angular/core'
import type { Signal } from '@angular/core'

export type MethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: Array<any>) => any ? K : never
}[keyof T]

export type MapToSignals<T, TExcludeFields extends MethodKeys<T> = never> = {
  [K in keyof T]: K extends TExcludeFields ? T[K] : Signal<T[K]>
}

/**
 * Exposes fields of an object passed via an Angular `Signal` as `Computed` signals.
 * Functions on the object are passed through as-is.
 * @param inputSignal - `Signal` that must return an object.
 * @param excludeFields - Array of function property names that should NOT be converted to signals.
 * @returns A proxy object with the same fields as the input object, but with each field wrapped in a `Computed` signal.
 */
export function signalProxy<
  TInput extends Record<string | symbol, any>,
  const TExcludeFields extends ReadonlyArray<MethodKeys<TInput>> = [],
>(inputSignal: Signal<TInput>, excludeFields: TExcludeFields) {
  const internalState = {} as MapToSignals<TInput, TExcludeFields[number]>
  const excludeFieldsArray = excludeFields as ReadonlyArray<string>

  return new Proxy<MapToSignals<TInput, TExcludeFields[number]>>(
    internalState,
    {
      get(target, prop) {
        // first check if we have it in our internal state and return it
        const computedField = target[prop]
        if (computedField) return computedField

        // if it is an excluded function, return it without tracking
        if (excludeFieldsArray.includes(prop as string)) {
          const fn = (...args: Parameters<TInput[typeof prop]>) =>
            untracked(inputSignal)[prop](...args)
          // @ts-expect-error
          target[prop] = fn
          return fn
        }

        // otherwise, make a computed field
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
    },
  )
}
