---
id: BaseMutationNarrowing
title: BaseMutationNarrowing
---

# Interface: BaseMutationNarrowing\<TData, TError, TVariables, TScope\>

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TScope** = `unknown`

## Properties

### isError

```ts
isError: SignalFunction<
  (this) => this is CreateMutationResult<
    TData,
    TError,
    TVariables,
    TScope,
    Override<
      MutationObserverErrorResult<TData, TError, TVariables, TScope>,
      { mutate: CreateMutateFunction<TData, TError, TVariables, TScope> }
    > & {
      mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TScope>
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
    TScope,
    Override<
      MutationObserverIdleResult<TData, TError, TVariables, TScope>,
      { mutate: CreateMutateFunction<TData, TError, TVariables, TScope> }
    > & {
      mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TScope>
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
    TScope,
    Override<
      MutationObserverLoadingResult<TData, TError, TVariables, TScope>,
      { mutate: CreateMutateFunction<TData, TError, TVariables, TScope> }
    > & {
      mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TScope>
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
    TScope,
    Override<
      MutationObserverSuccessResult<TData, TError, TVariables, TScope>,
      { mutate: CreateMutateFunction<TData, TError, TVariables, TScope> }
    > & {
      mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TScope>
    }
  >
>
```

#### Defined in

[types.ts:225](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L225)
