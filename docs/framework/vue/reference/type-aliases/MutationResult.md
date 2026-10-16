---
id: MutationResult
title: MutationResult
---

```ts
type MutationResult<TData, TError, TVariables, TOnMutateResult> = DistributiveOmit<MutationObserverResult<TData, TError, TVariables, TOnMutateResult>, "mutate" | "reset">;
```

Defined in: [packages/vue-query/src/useMutation.ts:29](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutation.ts#L29)

The [MutationObserverResult](MutationObserverResult.md) properties without `mutate` and `reset`, which `useMutation` replaces with
its own versions.

## Type Parameters

### TData

`TData`

### TError

`TError`

### TVariables

`TVariables`

### TOnMutateResult

`TOnMutateResult`
