---
id: matchMutation
title: matchMutation
---

```ts
function matchMutation(filters: MutationFilters, mutation: Mutation<any, any>): boolean;
```

Defined in: [packages/query-core/src/utils.ts:237](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L237)

Checks whether a mutation matches the given [MutationFilters](../interfaces/MutationFilters.md).
Every filter that is specified must match; filters that are left unspecified are ignored.
If a `mutationKey` filter is provided but the mutation has no `mutationKey` of its own, it does not match.

## Parameters

### filters

[`MutationFilters`](../interfaces/MutationFilters.md)

<a id="filters-properties"></a>

#### `filters` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="filters-exact"></a> `exact?` | `boolean` | Match mutation key exactly |
| <a id="filters-mutationkey"></a> `mutationKey?` | readonly `unknown`[] | Include mutations matching this mutation key |
| <a id="filters-predicate"></a> `predicate?` | (`mutation`: [`Mutation`](../classes/Mutation.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `boolean` | Include mutations matching this predicate function |
| <a id="filters-status"></a> `status?` | `"error"` \| `"pending"` \| `"success"` \| `"idle"` | Filter by mutation status |

### mutation

[`Mutation`](../classes/Mutation.md)\<`any`, `any`\>

## Returns

`boolean`

## Example

```ts
const mutationCache = queryClient.getMutationCache()

const matchingMutations = mutationCache
  .getAll()
  .filter((mutation) => matchMutation({ mutationKey: ['addPost'] }, mutation))
```
