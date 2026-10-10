---
id: UseMutationReturnType
title: UseMutationReturnType
---

```ts
type UseMutationReturnType<TData, TError, TVariables, TOnMutateResult, TResult> = ToRefs<Readonly<TResult>> & object;
```

Defined in: [packages/vue-query/src/useMutation.ts:65](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutation.ts#L65)

The result of `useMutation`: the [MutationObserverResult](MutationObserverResult.md) properties wrapped in `Ref`s, plus the
fire-and-forget `mutate`, the awaitable `mutateAsync`, and `reset`.

## Type Declaration

### mutate

```ts
mutate: MutateSyncFunction<TData, TError, TVariables, TOnMutateResult>;
```

### mutateAsync

```ts
mutateAsync: MutateFunction<TData, TError, TVariables, TOnMutateResult>;
```

### reset

```ts
reset: MutationObserverResult<TData, TError, TVariables, TOnMutateResult>["reset"];
```

## Type Parameters

### TData

`TData`

### TError

`TError`

### TVariables

`TVariables`

### TOnMutateResult

`TOnMutateResult`

### TResult

`TResult` = [`MutationResult`](MutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>
