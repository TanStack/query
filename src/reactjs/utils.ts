export function shouldThrowError<TError>(
  _useErrorBoundary: boolean | ((err: TError) => boolean),
  error: TError
): boolean {
  // Allow useErrorBoundary function to override throwing behavior on a per-error basis
  if (typeof _useErrorBoundary === 'function') {
    return _useErrorBoundary(error)
  }

  return _useErrorBoundary
}
