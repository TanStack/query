import type { SolidQueryKey, SolidQueryFilters, ParseFilterArgs } from './types'

export function isQueryKey(value: unknown): value is SolidQueryKey {
  return typeof value === 'function'
}

// The parseQuery Args functions helps normalize the arguments into the correct form.
// Whatever the parameters are, they are normalized into the correct form.
export function normalizeQueryOptions<T>(arg: T): T {
  const { queryKey: solidKey, ...opts } = arg as any
  if (solidKey) {
    return {
      ...opts,
      queryKey: solidKey(),
    }
  }
  return arg as any
}

export function normalizeFilterArgs<
  TFilters extends SolidQueryFilters,
  TOptions = unknown,
>(
  arg1?: TFilters,
  arg2?: TOptions,
): [ParseFilterArgs<TFilters>, TOptions | undefined] {
  return [{ ...arg1, queryKey: arg1?.queryKey?.() }, arg2] as [
    ParseFilterArgs<TFilters>,
    TOptions,
  ]
}

export function shouldThrowError<T extends (...args: any[]) => boolean>(
  throwError: boolean | T | undefined,
  params: Parameters<T>,
): boolean {
  // Allow throwError function to override throwing behavior on a per-error basis
  if (typeof throwError === 'function') {
    return throwError(...params)
  }

  return !!throwError
}

export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}

/**
 * Schedules a microtask.
 * This can be useful to schedule state updates after rendering.
 */
export function scheduleMicrotask(callback: () => void) {
  sleep(0).then(callback)
}
