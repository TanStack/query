import { placeholderData, select } from '@tanstack/query-core'

export type ProjectionInput<T> = T extends readonly [unknown, infer TInput]
  ? TInput
  : T
/** Returns the input supplied to a projection feature. */
export function projectionInput<T>(
  option: readonly [unknown, T] | undefined,
): T | undefined {
  return option?.[1]
}
/** Preserves a shared test's optional callback when it is defined. */
export function optionalSelect<T>(
  input: T,
): T extends undefined ? undefined : readonly [typeof select, T] {
  return (
    input === undefined ? undefined : [select, input]
  ) as T extends undefined ? undefined : readonly [typeof select, T]
}
/** Preserves a shared test's optional placeholder when it is defined. */
export function optionalPlaceholderData<T>(
  input: T,
): T extends undefined ? undefined : readonly [typeof placeholderData, T] {
  return (
    input === undefined ? undefined : [placeholderData, input]
  ) as T extends undefined ? undefined : readonly [typeof placeholderData, T]
}
/** A stored selection option for a shared React test. */
export type SelectSetting<TValue> = readonly [typeof select, TValue]
/** A stored placeholder option for a shared React test. */
export type PlaceholderSetting<TValue> = readonly [
  typeof placeholderData,
  TValue,
]
