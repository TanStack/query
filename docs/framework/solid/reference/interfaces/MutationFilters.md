---
id: MutationFilters
title: MutationFilters
---

Defined in: [packages/query-core/src/utils.ts:63](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L63)

Filters used to select mutations, for example in `mutationCache.findAll` or `queryClient.isMutating`.
All provided filters must match; filters that are left unspecified are ignored.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TVariables

`TVariables` = `unknown`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-exact"></a> `exact?` | `boolean` | Match mutation key exactly |
| <a id="property-mutationkey"></a> `mutationKey?` | readonly `unknown`[] | Include mutations matching this mutation key |
| <a id="property-predicate"></a> `predicate?` | (`mutation`: [`Mutation`](../classes/Mutation.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `boolean` | Include mutations matching this predicate function |
| <a id="property-status"></a> `status?` | `"error"` \| `"pending"` \| `"success"` \| `"idle"` | Filter by mutation status |
