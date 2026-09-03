---
id: useIsMutating
title: useIsMutating
---

```ts
function useIsMutating(filters?, queryClient?): Accessor<number>;
```

Defined in: [useIsMutating.ts:28](https://github.com/TanStack/query/blob/main/packages/solid-query/src/useIsMutating.ts#L28)

The `useIsMutating` hook returns the `number` of mutations that your application currently has `pending`
(useful for app-wide loading indicators).

## Parameters

### filters?

`Accessor`\<`MutationFilters`\<`unknown`, `Error`, `unknown`, `unknown`\>\>

An accessor returning the MutationFilters to narrow down the matched mutations.

### queryClient?

`Accessor`\<[`QueryClient`](../classes/QueryClient.md)\>

An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

## Returns

`Accessor`\<`number`\>

An accessor for the `number` of the mutations that your application currently has `pending`.

## Example

```tsx
import { useIsMutating } from '@tanstack/solid-query'

function PostsMutatingIndicator() {
  // How many mutations matching the posts prefix are in progress?
  const isMutatingPosts = useIsMutating(() => ({ mutationKey: ['posts'] }))

  return isMutatingPosts() > 0 ? <span>Saving posts...</span> : null
}
```
