---
id: MutationStateOptions
title: MutationStateOptions
---

```ts
type MutationStateOptions<TResult, TMutation> = {
  filters?: VueMutationFilters;
  select?: (mutation: TMutation) => TResult;
};
```

Defined in: [packages/vue-query/src/useMutationState.ts:97](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutationState.ts#L97)

The options accepted by `useMutationState`: the `filters` matching the mutations, and `select` to map each
one (to its state, by default).

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-filters"></a> `filters?` | `VueMutationFilters` | The filters that select the mutations to return the state of. |
| <a id="property-select"></a> `select?` | (`mutation`: `TMutation`) => `TResult` | Maps each matching mutation to the value returned for it. Defaults to the mutation's `state`. |
