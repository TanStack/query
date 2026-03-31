---
id: MutationStateOptions
title: MutationStateOptions
---

# Type Alias: MutationStateOptions\<TResult\>

```ts
type MutationStateOptions<TResult> = object;
```

Defined in: [packages/svelte-query/src/types.ts:140](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L140)

Options for useMutationState

## Type Parameters

### TResult

`TResult` = `MutationState`

## Properties

### filters?

```ts
optional filters: MutationFilters;
```

Defined in: [packages/svelte-query/src/types.ts:141](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L141)

***

### select()?

```ts
optional select: (mutation) => TResult;
```

Defined in: [packages/svelte-query/src/types.ts:142](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L142)

#### Parameters

##### mutation

`Mutation`\<`unknown`, `DefaultError`, `unknown`, `unknown`\>

#### Returns

`TResult`
