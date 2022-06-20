export function shouldThrowError<T extends (...args: any[]) => boolean>(
  _useErrorBoundary: boolean | T | undefined,
  params: Parameters<T>,
): boolean {
  // Allow useErrorBoundary function to override throwing behavior on a per-error basis
  if (typeof _useErrorBoundary === 'function') {
    return _useErrorBoundary(...params)
  }

  return !!_useErrorBoundary
}
