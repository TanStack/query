# Type Alias: CreateMutationOptions\<TData, TError, TVariables, TContext\>

```ts
type CreateMutationOptions<TData, TError, TVariables, TContext>: OmitKeyof<MutationObserverOptions<TData, TError, TVariables, TContext>, "_defaulted">;
```

Options for createMutation

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `void`

• **TContext** = `unknown`

## Defined in

[packages/svelte-query/src/types.ts:87](https://github.com/TanStack/query/blob/81ca3332486f7b98502d4f5ea50588d88a80f59b/packages/svelte-query/src/types.ts#L87)
