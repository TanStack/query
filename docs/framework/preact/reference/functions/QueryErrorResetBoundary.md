---
id: QueryErrorResetBoundary
title: QueryErrorResetBoundary
---

```ts
function QueryErrorResetBoundary(__namedParameters): Element;
```

Defined in: [packages/preact-query/src/QueryErrorResetBoundary.tsx:159](https://github.com/TanStack/query/blob/main/packages/preact-query/src/QueryErrorResetBoundary.tsx#L159)

When using `suspense` or `throwOnError` in your queries, you need a way to let queries know that you want to
try again when re-rendering after some error occurred. With the `QueryErrorResetBoundary` component you can
reset any query errors within the boundaries of the component.

## Parameters

### \_\_namedParameters

[`QueryErrorResetBoundaryProps`](../interfaces/QueryErrorResetBoundaryProps.md)

## Returns

`Element`

The `children`, rendered as-is, or called with the boundary's QueryErrorResetBoundaryValue
if `children` is a function.

## Example

```tsx
import { useErrorBoundary } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import { QueryErrorResetBoundary } from '@tanstack/preact-query'

function App() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary reset={reset}>
          <Page />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

function ErrorBoundary({
  children,
  reset,
}: {
  children: ComponentChildren
  reset: () => void
}) {
  const [error, resetError] = useErrorBoundary(() => reset())

  if (error) {
    return (
      <div>
        There was an error!
        <button onClick={() => resetError()}>Try again</button>
      </div>
    )
  }

  return children
}
```
