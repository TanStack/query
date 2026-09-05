---
id: BaseMutationNarrowing
title: BaseMutationNarrowing
---

Defined in: [types.ts:328](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L328)

The `isSuccess`/`isError`/`isPending`/`isIdle` methods on a mutation result. Each is both a `Signal`
(its current boolean value is read reactively without calling it) and a type-guard function you can
call — `if (mutation.isSuccess())` — so that `mutation.data` narrows away `undefined` inside the branch.

## Type Parameters

### TData

`TData` = `unknown`

The type your mutation function resolves to.

### TError

`TError` = `DefaultError`

The type of errors your mutation function may throw.

### TVariables

`TVariables` = `unknown`

The type of the variable passed to `mutate`/`mutateAsync`.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
their `onMutateResult` parameter — useful for optimistic-update rollback data.

## Properties

### isError

```ts
isError: SignalFunction<(this) => this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverErrorResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>>;
```

Defined in: [types.ts:351](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L351)

***

### isIdle

```ts
isIdle: SignalFunction<(this) => this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverIdleResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>>;
```

Defined in: [types.ts:385](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L385)

***

### isPending

```ts
isPending: SignalFunction<(this) => this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverLoadingResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>>;
```

Defined in: [types.ts:368](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L368)

***

### isSuccess

```ts
isSuccess: SignalFunction<(this) => this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverSuccessResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>>;
```

Defined in: [types.ts:334](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L334)
