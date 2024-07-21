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

[packages/svelte-query/src/types.ts:140](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/svelte-query/src/types.ts#L140)
