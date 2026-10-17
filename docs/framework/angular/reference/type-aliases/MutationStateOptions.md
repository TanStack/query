---
id: MutationStateOptions
title: MutationStateOptions
---

```ts
type MutationStateOptions<TResult, TMutation> = object;
```

Defined in: [packages/angular-query/src/inject-mutation-state.ts:26](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-mutation-state.ts#L26)

Filters and optional projection for observing entries in the mutation cache.

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-filters"></a> `filters?` | [`MutationFilters`](../interfaces/MutationFilters.md) | Restricts the mutation cache entries included in the result. |
| <a id="property-select"></a> `select?` | (`mutation`: `TMutation`) => `TResult` | Maps each matching mutation to the value exposed in the result signal. |
