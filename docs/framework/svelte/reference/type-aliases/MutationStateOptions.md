---
id: MutationStateOptions
title: MutationStateOptions
---

```ts
type MutationStateOptions<TResult, TMutation> = object;
```

Defined in: [packages/svelte-query/src/types.ts:151](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L151)

Options for useMutationState

## Type Parameters

### TResult

`TResult` = `MutationState`

### TMutation

`TMutation` *extends* `Mutation`\<`any`, `any`, `any`, `any`\> = [`MutationTypeFromResult`](MutationTypeFromResult.md)\<`TResult`\>

## Properties

### filters?

```ts
optional filters: MutationFilters;
```

Defined in: [packages/svelte-query/src/types.ts:156](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L156)

***

### select()?

```ts
optional select: (mutation) => TResult;
```

Defined in: [packages/svelte-query/src/types.ts:157](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L157)

#### Parameters

##### mutation

`TMutation`

#### Returns

`TResult`
