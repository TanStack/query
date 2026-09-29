---
id: useQueryErrorResetBoundary
title: useQueryErrorResetBoundary
redirect_from:
  - framework/react/reference/useQueryErrorResetBoundary
---

```ts
function useQueryErrorResetBoundary(): QueryErrorResetBoundaryValue;
```

Defined in: [packages/react-query/src/QueryErrorResetBoundary.tsx:76](https://github.com/TanStack/query/blob/main/packages/react-query/src/QueryErrorResetBoundary.tsx#L76)

This hook will reset any query errors within the closest `QueryErrorResetBoundary`. If there is no boundary
defined it will reset them globally.

## Returns

`QueryErrorResetBoundaryValue`

The boundary's QueryErrorResetBoundaryValue.

## Example

```tsx
import { ErrorBoundary } from 'react-error-boundary'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'

function App({ children }: { children: React.ReactNode }) {
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
      {children}
    </ErrorBoundary>
  )
}
```
