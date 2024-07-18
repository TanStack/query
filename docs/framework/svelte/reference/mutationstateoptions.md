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

[packages/svelte-query/src/types.ts:140](https://github.com/TanStack/query/blob/81ca3332486f7b98502d4f5ea50588d88a80f59b/packages/svelte-query/src/types.ts#L140)
