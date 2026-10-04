---
id: CreateMutateAsyncFunction
title: CreateMutateAsyncFunction
---

```ts
type CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> = MutateFunction<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/svelte-query/src/types.ts:127](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L127)

The type of `mutateAsync`, as returned by `createMutation`. Similar to [CreateMutateFunction](CreateMutateFunction.md), but
returns a promise which can be awaited.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
