export function shouldThrowError<T extends (...args: any[]) => boolean>(
  suspense: boolean | undefined,
  _useErrorBoundary: boolean | T | undefined,
  params: Parameters<T>
): boolean {
  // Allow useErrorBoundary function to override throwing behavior on a per-error basis
  if (typeof _useErrorBoundary === 'function') {
    return _useErrorBoundary(...params)
  }

  // Allow useErrorBoundary to override suspense's throwing behavior
  if (typeof _useErrorBoundary === 'boolean') return _useErrorBoundary

  // If suspense is enabled default to throwing errors
  return !!suspense
}
