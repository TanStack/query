---
id: matchMutation
title: matchMutation
---

```ts
function matchMutation(filters: MutationFilters, mutation: Mutation<any, any>): boolean;
```

Defined in: [packages/query-core/src/utils.ts:269](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L269)

Checks whether a mutation matches the given [MutationFilters](../interfaces/MutationFilters.md).
Every filter that is specified must match; filters that are left unspecified are ignored.
If a `mutationKey` filter is provided but the mutation has no `mutationKey` of its own, it does not match.

## Parameters

### filters

[`MutationFilters`](../interfaces/MutationFilters.md)

The filters to check the mutation against.

<a id="filters-properties"></a>

#### `filters` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="filters-property-exact"></a> `exact?` | `boolean` | Match mutation key exactly |
| <a id="filters-property-mutationkey"></a> `mutationKey?` | readonly `unknown`[] | Include mutations matching this mutation key |
| <a id="filters-property-predicate"></a> `predicate?` | (`mutation`: [`Mutation`](../classes/Mutation.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `boolean` | Include mutations matching this predicate function |
| <a id="filters-property-status"></a> `status?` | `"error"` \| `"pending"` \| `"success"` \| `"idle"` | Filter by mutation status |

### mutation

[`Mutation`](../classes/Mutation.md)\<`any`, `any`\>

The mutation to check.

## Returns

`boolean`

`true` if the mutation matches every specified filter.

## Example

```ts
const mutationCache = queryClient.getMutationCache()

const matchingMutations = mutationCache
  .getAll()
  .filter((mutation) => matchMutation({ mutationKey: ['addPost'] }, mutation))
```
