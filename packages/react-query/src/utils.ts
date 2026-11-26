/**
 * Resolves the adapter's error boundary option.
 * @param throwOnError - A boolean or a predicate.
 * @param params - The arguments passed to the predicate.
 * @returns Whether to throw the error.
 */
export function shouldThrowError<T extends (...args: Array<any>) => boolean>(
  throwOnError: boolean | T | undefined,
  params: Parameters<T>,
): boolean {
  if (typeof throwOnError === 'function') {
    return throwOnError(...params)
  }

  return !!throwOnError
}
