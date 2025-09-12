---
id: BaseMutationNarrowing
title: BaseMutationNarrowing
---

# Interface: BaseMutationNarrowing\<TData, TError, TVariables, TOnMutateResult\>

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TOnMutateResult** = `unknown`

## Properties

### isError

```ts
isError: SignalFunction<
  (this) => this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult,
    Override<
      MutationObserverErrorResult<TData, TError, TVariables, TOnMutateResult>,
      {
        mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>
      }
    > & {
      mutateAsync: CreateMutateAsyncFunction<
        TData,
        TError,
        TVariables,
        TOnMutateResult
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
  (this) => this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult,
    Override<
      MutationObserverIdleResult<TData, TError, TVariables, TOnMutateResult>,
      {
        mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>
      }
    > & {
      mutateAsync: CreateMutateAsyncFunction<
        TData,
        TError,
        TVariables,
        TOnMutateResult
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
  (this) => this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult,
    Override<
      MutationObserverLoadingResult<TData, TError, TVariables, TOnMutateResult>,
      {
        mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>
      }
    > & {
      mutateAsync: CreateMutateAsyncFunction<
        TData,
        TError,
        TVariables,
        TOnMutateResult
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
  (this) => this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult,
    Override<
      MutationObserverSuccessResult<TData, TError, TVariables, TOnMutateResult>,
      {
        mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>
      }
    > & {
      mutateAsync: CreateMutateAsyncFunction<
        TData,
        TError,
        TVariables,
        TOnMutateResult
      >
    }
  >
>
```

#### Defined in

[types.ts:225](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L225)
