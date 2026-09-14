---
id: useIsMutating
title: useIsMutating
redirect_from:
  - framework/react/reference/useIsMutating
---

```ts
function useIsMutating(filters?, queryClient?): number;
```

Defined in: [packages/react-query/src/useMutationState.ts:35](https://github.com/TanStack/query/blob/main/packages/react-query/src/useMutationState.ts#L35)

The `useIsMutating` hook returns the `number` of mutations that your application currently has `pending`
(useful for app-wide loading indicators).

## Parameters

### filters?

[`MutationFilters`](../interfaces/MutationFilters.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

The [MutationFilters](../interfaces/MutationFilters.md) to narrow down the matched mutations.

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

`number`

Will be the `number` of the mutations that your application currently has `pending`.

## Example

```tsx
import { useIsMutating } from '@tanstack/react-query'

function PostsMutatingIndicator() {
  // How many mutations matching the posts prefix are in progress?
  const isMutatingPosts = useIsMutating({ mutationKey: ['posts'] })

  return isMutatingPosts ? <span>Saving posts...</span> : null
}
```
