import { placeholderData, select } from '../src'

export { select, placeholderData }
export const selectOption = 'select'
export const placeholderOption = 'placeholderData'
export type ProjectionInput<T> = T extends readonly [unknown, infer Input]
  ? Input
  : T

/** Returns the input supplied to a projection feature. */
export function projectionInput<T>(
  option: readonly [unknown, T] | undefined,
): T | undefined {
  return option?.[1]
}

/** Preserves a shared test's optional callback when migrating a stored reference. */
export function portSelect<T>(
  input: T,
): T extends undefined ? undefined : readonly [typeof select, T] {
  return (
    input === undefined ? undefined : [select, input]
  ) as T extends undefined ? undefined : readonly [typeof select, T]
}

/** Preserves a shared test's optional placeholder when migrating a stored reference. */
export function portPlaceholder<T>(
  input: T,
): T extends undefined ? undefined : readonly [typeof placeholderData, T] {
  return (
    input === undefined ? undefined : [placeholderData, input]
  ) as T extends undefined ? undefined : readonly [typeof placeholderData, T]
}

/** A stored pluggable selection option for a shared React test. */
export type SelectSetting<TValue> = readonly [typeof select, TValue]

/** A stored pluggable placeholder option for a shared React test. */
export type PlaceholderSetting<TValue> = readonly [
  typeof placeholderData,
  TValue,
]
