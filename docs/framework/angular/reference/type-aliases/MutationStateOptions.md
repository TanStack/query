---
id: MutationStateOptions
title: MutationStateOptions
---

```ts
type MutationStateOptions<TResult, TMutation> = object;
```

Defined in: [packages/angular-query/src/inject-mutation-state.ts:23](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-mutation-state.ts#L23)

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Properties

| Property | Type |
| ------ | ------ |
| <a id="filters"></a> `filters?` | [`MutationFilters`](../interfaces/MutationFilters.md) |
| <a id="select"></a> `select?` | (`mutation`: `TMutation`) => `TResult` |
