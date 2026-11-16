import { useErrorBoundary } from 'preact/hooks'
import type { ComponentChildren } from 'preact'

export default function ErrorBoundary({
  children,
  fallback,
}: {
  children: ComponentChildren
  fallback: (error: Error) => ComponentChildren
}) {
  const [error] = useErrorBoundary()

  return error ? fallback(error) : children
}
