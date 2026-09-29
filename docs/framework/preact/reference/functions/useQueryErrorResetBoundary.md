---
id: useQueryErrorResetBoundary
title: useQueryErrorResetBoundary
---

```ts
function useQueryErrorResetBoundary(): QueryErrorResetBoundaryValue;
```

Defined in: [packages/preact-query/src/QueryErrorResetBoundary.tsx:85](https://github.com/TanStack/query/blob/main/packages/preact-query/src/QueryErrorResetBoundary.tsx#L85)

This hook will reset any query errors within the closest `QueryErrorResetBoundary`. If there is no boundary
defined it will reset them globally.

## Returns

`QueryErrorResetBoundaryValue`

The boundary's QueryErrorResetBoundaryValue.

## Example

```tsx
import { useErrorBoundary } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import { useQueryErrorResetBoundary } from '@tanstack/preact-query'

function App({ children }: { children: ComponentChildren }) {
  const { reset } = useQueryErrorResetBoundary()
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
