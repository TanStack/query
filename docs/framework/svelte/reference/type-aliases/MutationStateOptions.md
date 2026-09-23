---
id: MutationStateOptions
title: MutationStateOptions
---

```ts
type MutationStateOptions<TResult, TMutation> = object;
```

Defined in: [packages/svelte-query/src/types.ts:158](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L158)

Options for useMutationState

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = [`MutationTypeFromResult`](MutationTypeFromResult.md)\<`TResult`\>

## Properties

| Property | Type |
| ------ | ------ |
| <a id="filters"></a> `filters?` | [`MutationFilters`](../interfaces/MutationFilters.md) |
| <a id="select"></a> `select?` | (`mutation`: `TMutation`) => `TResult` |
