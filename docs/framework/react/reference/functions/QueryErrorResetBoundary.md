---
id: QueryErrorResetBoundary
title: QueryErrorResetBoundary
redirect_from:
  - framework/react/reference/QueryErrorResetBoundary
---

```ts
function QueryErrorResetBoundary(__namedParameters): Element;
```

Defined in: [packages/react-query/src/QueryErrorResetBoundary.tsx:136](https://github.com/TanStack/query/blob/main/packages/react-query/src/QueryErrorResetBoundary.tsx#L136)

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
import { ErrorBoundary } from 'react-error-boundary'
import { QueryErrorResetBoundary } from '@tanstack/react-query'

function App() {
  return (
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
}
```
