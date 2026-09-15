---
id: MutationStateOptions
title: MutationStateOptions
---

```ts
type MutationStateOptions<TResult, TMutation> = object;
```

Defined in: [packages/vue-query/src/useMutationState.ts:92](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutationState.ts#L92)

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Properties

### filters?

```ts
optional filters: VueMutationFilters;
```

Defined in: [packages/vue-query/src/useMutationState.ts:97](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutationState.ts#L97)

***

### select()?

```ts
optional select: (mutation) => TResult;
```

Defined in: [packages/vue-query/src/useMutationState.ts:98](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutationState.ts#L98)

#### Parameters

##### mutation

`TMutation`

#### Returns

`TResult`
