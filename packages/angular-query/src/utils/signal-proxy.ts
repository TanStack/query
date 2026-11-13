import { computed } from '@angular/core'
import type { Signal } from '@angular/core'

/**
 * Names of object properties whose values are callable.
 */
export type MethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: Array<any>) => any ? K : never
}[keyof T]

/**
 * Exposes selected object fields as Angular signals and leaves all other fields unchanged.
 */
export type MapToSignals<T, TSignalFields extends keyof any = never> = {
  [K in keyof T as K extends TSignalFields ? K : never]: Signal<T[K]>
} & {
  [K in keyof T as K extends TSignalFields ? never : K]: T[K]
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
