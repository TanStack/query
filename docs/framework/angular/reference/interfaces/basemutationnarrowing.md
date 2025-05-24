---
id: BaseMutationNarrowing
title: BaseMutationNarrowing
---

# Interface: BaseMutationNarrowing\<TData, TError, TVariables, TContext\>

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TContext** = `unknown`

## Properties

### isError

```ts
isError: SignalFunction<
  (
    this,
  ) => this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TContext,
    Override<
      MutationObserverErrorResult<TData, TError, TVariables, TContext>,
      { mutate: CreateMutateFunction<TData, TError, TVariables, TContext> }
    > & {
      mutateAsync: CreateMutateAsyncFunction<
        TData,
        TError,
        TVariables,
        TContext
      >
    }
  >
>
```

#### Defined in

[types.ts:242](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L242)

---

### isIdle

```ts
isIdle: SignalFunction<
  (
    this,
  ) => this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TContext,
    Override<
      MutationObserverIdleResult<TData, TError, TVariables, TContext>,
      { mutate: CreateMutateFunction<TData, TError, TVariables, TContext> }
    > & {
      mutateAsync: CreateMutateAsyncFunction<
        TData,
        TError,
        TVariables,
        TContext
      >
    }
  >
>
```

#### Defined in

[types.ts:276](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L276)

---

### isPending

```ts
isPending: SignalFunction<
  (
    this,
  ) => this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TContext,
    Override<
      MutationObserverLoadingResult<TData, TError, TVariables, TContext>,
      { mutate: CreateMutateFunction<TData, TError, TVariables, TContext> }
    > & {
      mutateAsync: CreateMutateAsyncFunction<
        TData,
        TError,
        TVariables,
        TContext
      >
    }
  >
>
```

#### Defined in

[types.ts:259](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L259)

---

### isSuccess

```ts
isSuccess: SignalFunction<
  (
    this,
  ) => this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TContext,
    Override<
      MutationObserverSuccessResult<TData, TError, TVariables, TContext>,
      { mutate: CreateMutateFunction<TData, TError, TVariables, TContext> }
    > & {
      mutateAsync: CreateMutateAsyncFunction<
        TData,
        TError,
        TVariables,
        TContext
      >
    }
  >
>
```

#### Defined in

[types.ts:225](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L225)
