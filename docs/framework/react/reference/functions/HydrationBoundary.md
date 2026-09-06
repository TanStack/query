---
id: HydrationBoundary
title: HydrationBoundary
---

```ts
function HydrationBoundary(__namedParameters): ReactElement<unknown, string | JSXElementConstructor<any>>;
```

Defined in: [packages/react-query/src/HydrationBoundary.tsx:86](https://github.com/TanStack/query/blob/main/packages/react-query/src/HydrationBoundary.tsx#L86)

`HydrationBoundary` adds a previously dehydrated state into the `queryClient` that would be returned by
`useQueryClient()`. If the client already contains data, the new queries will be intelligently merged based on
update timestamp.

Note: Only `queries` can be dehydrated with an `HydrationBoundary`.

## Parameters

### \_\_namedParameters

[`HydrationBoundaryProps`](../interfaces/HydrationBoundaryProps.md)

## Returns

`ReactElement`\<`unknown`, `string` \| `JSXElementConstructor`\<`any`\>\>

The provided `children`, rendered unconditionally. New queries in `state` are hydrated into the
cache during render; for queries already in the cache, only newer dehydrated data is hydrated, in an effect
after commit.

## Examples

```tsx
import { HydrationBoundary } from '@tanstack/react-query'

function App() {
  return <HydrationBoundary state={dehydratedState}>...</HydrationBoundary>
}
```

Server-side prefetch handed off to the client via `dehydrate`:
```tsx
import { HydrationBoundary, dehydrate, noop } from '@tanstack/react-query'

async function ServerComponent() {
  const queryClient = getQueryClient()

  await queryClient
    .query({
      queryKey: ['posts'],
      queryFn: fetchPosts,
    })
    .catch(noop)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Posts />
    </HydrationBoundary>
  )
}
```
