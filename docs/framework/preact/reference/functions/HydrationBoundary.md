---
id: HydrationBoundary
title: HydrationBoundary
---

```ts
function HydrationBoundary(__namedParameters): Element;
```

Defined in: [preact-query/src/HydrationBoundary.tsx:51](https://github.com/TanStack/query/blob/main/packages/preact-query/src/HydrationBoundary.tsx#L51)

`HydrationBoundary` adds a previously dehydrated state into the `queryClient` that would be returned by
`useQueryClient()`. If the client already contains data, the new queries will be intelligently merged based on
update timestamp.

Note: Only `queries` can be dehydrated with an `HydrationBoundary`.

## Parameters

### \_\_namedParameters

[`HydrationBoundaryProps`](../interfaces/HydrationBoundaryProps.md)

## Returns

`Element`

## Example

```tsx
import { HydrationBoundary } from '@tanstack/preact-query'

function App() {
  return <HydrationBoundary state={dehydratedState}>...</HydrationBoundary>
}
```
