export function shouldThrowError<TError>(
  suspense: boolean | undefined,
  _useErrorBoundary: boolean | ((err: TError) => boolean) | undefined,
  error: TError
): boolean {
  // Allow useErrorBoundary function to override throwing behavior on a per-error basis
  if (typeof _useErrorBoundary === 'function') {
    return _useErrorBoundary(error)
  }

  // Allow useErrorBoundary to override suspense's throwing behavior
  if (typeof _useErrorBoundary === 'boolean') return _useErrorBoundary

  // If suspense is enabled default to throwing errors
  return !!suspense
}
