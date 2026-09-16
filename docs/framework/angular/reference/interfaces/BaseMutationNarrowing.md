---
id: BaseMutationNarrowing
title: BaseMutationNarrowing
---

Defined in: [packages/angular-query/src/types.ts:297](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L297)

## Type Parameters

### TData

`TData` = `unknown`

The type your mutation function resolves to.

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

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

Defined in: [packages/angular-query/src/types.ts:320](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L320)

***

### isIdle

```ts
isIdle: SignalFunction<(this) => this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverIdleResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>>;
```

Defined in: [packages/angular-query/src/types.ts:354](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L354)

***

### isPending

```ts
isPending: SignalFunction<(this) => this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverLoadingResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>>;
```

Defined in: [packages/angular-query/src/types.ts:337](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L337)

***

### isSuccess

```ts
isSuccess: SignalFunction<(this) => this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverSuccessResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>>;
```

Defined in: [packages/angular-query/src/types.ts:303](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L303)
