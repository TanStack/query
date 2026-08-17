---
id: useQueryErrorResetBoundary
title: useQueryErrorResetBoundary
ref: docs/framework/react/reference/useQueryErrorResetBoundary.md
replace: { '@tanstack/react-query': '@tanstack/preact-query' }
---

[//]: # 'ReactErrorBoundaryExample'

Preact provides a [`useErrorBoundary` hook](https://preactjs.com/guide/v10/hooks/#useerrorboundary) that you can combine with `useQueryErrorResetBoundary`'s `reset`:

```tsx
import { useQueryErrorResetBoundary } from '@tanstack/preact-query'
import { useErrorBoundary } from 'preact/hooks'

const App = () => {
  const { reset } = useQueryErrorResetBoundary()
  const [error, resetError] = useErrorBoundary()

  if (error) {
    return (
      <div>
        There was an error!
        <Button
          onClick={() => {
            reset()
            resetError()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  return <Page />
}
```

[//]: # 'ReactErrorBoundaryExample'
