---
id: MutationStateOptions
title: MutationStateOptions
---

```ts
type MutationStateOptions<TResult, TMutation> = object;
```

Defined in: packages/angular-query/src/inject-mutation-state.ts:23

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-filters"></a> `filters?` | [`MutationFilters`](../interfaces/MutationFilters.md) |
| <a id="property-select"></a> `select?` | (`mutation`: `TMutation`) => `TResult` |
