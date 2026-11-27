/** Marks a query selector in suites shared by adapters with different option syntax. */
export const selectOption = 'select'

/** Marks a query placeholder in suites shared by adapters with different option syntax. */
export const placeholderOption = 'placeholderData'

/** Input of a projection option in the standard observer. */
export type ProjectionInput<T> = T

/**
 * Reads the selector or placeholder supplied to the standard observer.
 * @param option - Value exposed through the observer options.
 * @returns The original input for a projection type assertion.
 */
export function projectionInput<T>(option: T): T {
  return option
}

/** A stored selection option for an adapter-agnostic React test. */
export type SelectSetting<TValue> = TValue

/** A stored placeholder option for an adapter-agnostic React test. */
export type PlaceholderSetting<TValue> = TValue
