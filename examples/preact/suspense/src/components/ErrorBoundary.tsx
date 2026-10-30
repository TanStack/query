import { useErrorBoundary } from 'preact/hooks'
import type { ComponentChildren } from 'preact'

export default function ErrorBoundary({
  children,
  onReset,
  fallbackRender,
}: {
  children: ComponentChildren
  onReset: () => void
  fallbackRender: (props: {
    error: Error
    resetErrorBoundary: () => void
  }) => ComponentChildren
}) {
  const [error, resetError] = useErrorBoundary()

  if (error) {
    return fallbackRender({
      error,
      resetErrorBoundary: () => {
        onReset()
        resetError()
      },
    })
  }

  return children
}
