export function shouldThrowError<TError>(
  suspense: boolean | undefined,
  _useErrorBoundary: boolean | ((err: TError) => boolean) | undefined,
  error: TError
): boolean {
  if (typeof _useErrorBoundary === 'function') {
    return _useErrorBoundary(error)
  }

  return !!suspense || !!_useErrorBoundary
}
