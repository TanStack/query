---
id: MutationStateOptions
title: MutationStateOptions
---

```ts
type MutationStateOptions<TResult, TMutation> = object;
```

Defined in: [packages/vue-query/src/useMutationState.ts:91](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutationState.ts#L91)

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Properties

| Property | Type |
| ------ | ------ |
| <a id="filters"></a> `filters?` | `VueMutationFilters` |
| <a id="select"></a> `select?` | (`mutation`: `TMutation`) => `TResult` |
