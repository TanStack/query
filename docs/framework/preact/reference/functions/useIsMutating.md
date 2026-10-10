---
id: useIsMutating
title: useIsMutating
---

```ts
function useIsMutating(filters?: MutationFilters<unknown, Error, unknown, unknown>, queryClient?: QueryClient): number;
```

Defined in: [packages/preact-query/src/useMutationState.ts:33](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useMutationState.ts#L33)

The `useIsMutating` hook returns the `number` of mutations that your application currently has `pending`
(useful for app-wide loading indicators).

## Parameters

### filters?

[`MutationFilters`](../interfaces/MutationFilters.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

The [MutationFilters](../interfaces/MutationFilters.md) to narrow down the matched mutations.

<a id="filters-properties"></a>

#### `filters` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="filters-property-exact"></a> `exact?` | `boolean` | Match mutation key exactly |
| <a id="filters-property-mutationkey"></a> `mutationKey?` | readonly `unknown`[] | Include mutations matching this mutation key |
| <a id="filters-property-predicate"></a> `predicate?` | (`mutation`: [`Mutation`](../classes/Mutation.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `boolean` | Include mutations matching this predicate function |
| <a id="filters-property-status"></a> `status?` | `"error"` \| `"pending"` \| `"success"` \| `"idle"` | Filter by mutation status |

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

`number`

Will be the `number` of the mutations that your application currently has `pending`.

## Example

```tsx
import { useIsMutating } from '@tanstack/preact-query'

function PostsMutatingIndicator() {
  // How many mutations matching the posts prefix are in progress?
  const isMutatingPosts = useIsMutating({ mutationKey: ['posts'] })

  return isMutatingPosts ? <span>Saving posts...</span> : null
}
```
