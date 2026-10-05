---
id: MutationStateOptions
title: MutationStateOptions
---

```ts
type MutationStateOptions<TResult, TMutation> = object;
```

Defined in: [packages/svelte-query/src/types.ts:180](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L180)

Options for useMutationState

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = [`MutationTypeFromResult`](MutationTypeFromResult.md)\<`TResult`\>

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-filters"></a> `filters?` | [`MutationFilters`](../interfaces/MutationFilters.md) | The filters that select the mutations to return the state of. |
| <a id="property-select"></a> `select?` | (`mutation`: `TMutation`) => `TResult` | Maps each matching mutation to the value returned for it. Defaults to the mutation's `state`. |
