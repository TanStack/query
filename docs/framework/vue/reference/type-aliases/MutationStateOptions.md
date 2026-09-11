---
id: MutationStateOptions
title: MutationStateOptions
---

```ts
type MutationStateOptions<TResult, TMutation> = object;
```

Defined in: [packages/vue-query/src/useMutationState.ts:88](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutationState.ts#L88)

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Properties

### filters?

```ts
optional filters: MutationFilters;
```

Defined in: [packages/vue-query/src/useMutationState.ts:93](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutationState.ts#L93)

***

### select()?

```ts
optional select: (mutation) => TResult;
```

Defined in: [packages/vue-query/src/useMutationState.ts:94](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutationState.ts#L94)

#### Parameters

##### mutation

`TMutation`

#### Returns

`TResult`
