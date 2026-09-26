---
id: MutationStateOptions
title: MutationStateOptions
---

```ts
type MutationStateOptions<TResult> = object;
```

Defined in: [packages/lit-query/src/useMutationState.ts:20](https://github.com/TanStack/query/blob/main/packages/lit-query/src/useMutationState.ts#L20)

Options accepted by `useMutationState`.

## Type Parameters

### TResult

`TResult`

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="filters"></a> `filters?` | [`Accessor`](Accessor.md)\<[`MutationFilters`](../interfaces/MutationFilters.md)\> | Filters used to select mutations from the mutation cache. |
| <a id="select"></a> `select?` | (`mutation`: [`Mutation`](../classes/Mutation.md)) => `TResult` | Maps each matching mutation to the value returned by the accessor. |
