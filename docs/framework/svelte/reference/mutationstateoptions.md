---
id: MutationStateOptions
title: MutationStateOptions
---

# Type Alias: MutationStateOptions\<TResult\>

```ts
type MutationStateOptions<TResult>: object;
```

Options for useMutationState

## Type Parameters

• **TResult** = `MutationState`

## Type declaration

### filters?

```ts
optional filters: MutationFilters;
```

### select()?

```ts
optional select: (mutation) => TResult;
```

#### Parameters

• **mutation**: `Mutation`\<`unknown`, `DefaultError`, `unknown`, `unknown`\>

#### Returns

`TResult`

## Defined in

[packages/svelte-query/src/types.ts:140](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/types.ts#L140)
