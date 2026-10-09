---
id: MutationResult
title: MutationResult
---

```ts
type MutationResult<TData, TError, TVariables, TOnMutateResult> = DistributiveOmit<MutationObserverResult<TData, TError, TVariables, TOnMutateResult>, "mutate" | "reset">;
```

Defined in: [packages/vue-query/src/useMutation.ts:25](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutation.ts#L25)

## Type Parameters

### TData

`TData`

### TError

`TError`

### TVariables

`TVariables`

### TOnMutateResult

`TOnMutateResult`
