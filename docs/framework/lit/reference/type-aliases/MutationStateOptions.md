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

### filters?

```ts
optional filters: Accessor<MutationFilters>;
```

Defined in: [packages/lit-query/src/useMutationState.ts:22](https://github.com/TanStack/query/blob/main/packages/lit-query/src/useMutationState.ts#L22)

Filters used to select mutations from the mutation cache.

***

### select()?

```ts
optional select: (mutation) => TResult;
```

Defined in: [packages/lit-query/src/useMutationState.ts:24](https://github.com/TanStack/query/blob/main/packages/lit-query/src/useMutationState.ts#L24)

Maps each matching mutation to the value returned by the accessor.

#### Parameters

##### mutation

[`Mutation`](../classes/Mutation.md)

#### Returns

`TResult`
