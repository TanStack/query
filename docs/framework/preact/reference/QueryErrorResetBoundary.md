---
id: QueryErrorResetBoundary
title: QueryErrorResetBoundary
ref: docs/framework/react/reference/QueryErrorResetBoundary.md
replace: { '@tanstack/react-query': '@tanstack/preact-query' }
---

[//]: # 'ReactErrorBoundaryExample'

Preact provides a [`useErrorBoundary` hook](https://preactjs.com/guide/v10/hooks/#useerrorboundary) that you can combine with `QueryErrorResetBoundary`'s `reset`:

```tsx
import { QueryErrorResetBoundary } from '@tanstack/preact-query'
import type { ComponentChildren } from 'preact'
import { useErrorBoundary } from 'preact/hooks'

function ErrorBoundary(props: { onReset: () => void; children: ComponentChildren }) {
  const [error, resetError] = useErrorBoundary()

  if (error) {
    return (
      <div>
        There was an error!
        <Button
          onClick={() => {
            props.onReset()
            resetError()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  return props.children
}

const App = () => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary onReset={reset}>
        <Page />
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
)
```

[//]: # 'ReactErrorBoundaryExample'
