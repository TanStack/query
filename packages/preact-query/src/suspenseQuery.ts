import { skipToken } from '@tanstack/query-core'
import { observerKey } from './queryDescriptor'
import { queryPolicy } from './queryPolicy'
import { defaultThrowOnError, suspenseQueryPolicy } from './suspense'
import { throwOnError } from './throwOnError'
import type { QueryDescriptor } from './queryDescriptor'

/** Options that allow Suspense to control execution and error handling. */
export type SuspenseControls = {
  /** A skipped query disables the Suspense reader. */
  enabled?: undefined
  /** The nearest boundary handles errors when no data is cached. */
  throwOnError?: undefined
}

/** A skipped query uses the ordinary render policy and can render without cached data. */
export interface SuspenseQueryMode<TSkippable extends boolean = false> {
  /** Running queries suspend, and skipped queries can read cached data. */
  readonly enabled: TSkippable extends true ? boolean : true
  /** Routes errors without cached data to the nearest boundary. */
  readonly throwOnError: readonly [
    typeof throwOnError,
    typeof defaultThrowOnError,
  ]
  /** The reader uses this policy when the query is enabled. */
  readonly renderPolicy: TSkippable extends true
    ? typeof suspenseQueryPolicy | typeof queryPolicy
    : typeof suspenseQueryPolicy
}

/**
 * Attaches the selected observer and its Suspense policy in one copy.
 * @param options - The fetcher and options supplied by the caller.
 * @param Observer - The observer selected by the public factory.
 * @returns A descriptor that uses the ordinary render policy for a skipped fetcher.
 */
export function prepareSuspenseOptions<
  TOptions extends { queryFn?: unknown },
  TObserver,
>(
  options: TOptions,
  Observer: TObserver,
): TOptions & QueryDescriptor<TObserver> & SuspenseQueryMode<true> {
  const enabled = options.queryFn !== skipToken
  return {
    ...options,
    [observerKey]: Observer,
    enabled,
    throwOnError: [throwOnError, defaultThrowOnError],
    renderPolicy: enabled ? suspenseQueryPolicy : queryPolicy,
  }
}
