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

[types.ts:241](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L241)

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

[types.ts:275](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L275)

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

[types.ts:258](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L258)

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

[types.ts:224](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L224)
