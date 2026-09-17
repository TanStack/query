import { computed } from '@angular/core'
import type { Signal } from '@angular/core'

export type MethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: Array<any>) => any ? K : never
}[keyof T]

export type MapToSignals<T, TExcludeFields extends MethodKeys<T> = never> = {
  [K in keyof T]: K extends TExcludeFields ? T[K] : Signal<T[K]>
}

/**
 * Maps known result fields to lazy computed signals on an ordinary object.
 * Creating or enumerating the fields never evaluates the source. Imperative
 * methods are defined by each adapter, outside this mapping.
 * @param inputSignal - The source snapshot.
 * @param fields - The fields exposed as signals.
 * @returns An object containing one stable signal per field.
 */
export function signalProxy<T, TField extends keyof T>(
  inputSignal: Signal<T>,
  fields: ReadonlyArray<TField>,
): { [P in TField]: Signal<T[P]> } {
  const result = {} as { [P in TField]: Signal<T[P]> }
  for (const field of fields) {
    result[field] = computed(() => inputSignal()[field])
  }
  return result
}
