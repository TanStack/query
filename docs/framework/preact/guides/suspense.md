---
id: suspense
title: Suspense
ref: docs/framework/react/guides/suspense.md
replace: { 'react-query': 'preact-query', 'React': 'Preact' }
---

[//]: # 'Info'

When using suspense mode, `status` states and `error` objects are not needed and are then replaced by usage of the `Suspense` component from `preact/compat` (including the use of the `fallback` prop and error boundaries for catching errors). Please read the [Resetting Error Boundaries](#resetting-error-boundaries) section for more information on how to set up suspense mode.

[//]: # 'Info'
[//]: # 'PlaceholderData'

`placeholderData` also doesn't exist for this Query.

[//]: # 'PlaceholderData'
[//]: # 'ExampleResetComponent'

Preact does not ship an error boundary component, but one can be built with the [`useErrorBoundary`](https://preactjs.com/guide/v10/hooks/#useerrorboundary) hook:

```tsx
import { QueryErrorResetBoundary } from '@tanstack/preact-query'
import { useErrorBoundary } from 'preact/hooks'

function ErrorBoundary({ children, onReset, fallbackRender }) {
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

const App = () => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary
        onReset={reset}
        fallbackRender={({ resetErrorBoundary }) => (
          <div>
            There was an error!
            <button onClick={() => resetErrorBoundary()}>Try again</button>
          </div>
        )}
      >
        <Page />
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
)
```

[//]: # 'ExampleResetComponent'
[//]: # 'ExampleResetHook'

```tsx
import { useQueryErrorResetBoundary } from '@tanstack/preact-query'

const App = () => {
  const { reset } = useQueryErrorResetBoundary()
  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <div>
          There was an error!
          <button onClick={() => resetErrorBoundary()}>Try again</button>
        </div>
      )}
    >
      <Page />
    </ErrorBoundary>
  )
}
```

[//]: # 'ExampleResetHook'
[//]: # 'Streaming'
[//]: # 'Streaming'
