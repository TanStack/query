/**
 * Supplies the interval directly to the v6 query options.
 * The pluggable compatibility suite uses its own public factory here.
 * @param option - Interval setting from a shared test case.
 * @returns The supplied setting with its original type.
 */
export function refetchInterval<T>(option: T): T {
  return option
}

/** Input accepted by the polling option in this implementation. */
export type IntervalInput<TOption> = TOption
