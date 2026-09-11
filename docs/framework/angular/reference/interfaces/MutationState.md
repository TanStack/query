---
id: MutationState
title: MutationState
---

Defined in: [packages/query-core/src/mutation.ts:30](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L30)

The raw state stored on a `Mutation` instance. This is the underlying state
that observer results (e.g. `MutationObserverResult`) are derived from.

## Extended by

- [`MutationObserverBaseResult`](MutationObserverBaseResult.md)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TVariables

`TVariables` = `unknown`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Properties

### context

```ts
context: TOnMutateResult | undefined;
```

Defined in: [packages/query-core/src/mutation.ts:40](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L40)

The value returned by `onMutate`, if defined. Passed to `onSuccess`,
`onError` and `onSettled` as the mutation's context.

***

### data

```ts
data: TData | undefined;
```

Defined in: [packages/query-core/src/mutation.ts:44](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L44)

The last successfully resolved data for the mutation.

***

### error

```ts
error: TError | null;
```

Defined in: [packages/query-core/src/mutation.ts:49](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L49)

The error object for the mutation, if the last attempt resulted in an error.
- Defaults to `null`.

***

### failureCount

```ts
failureCount: number;
```

Defined in: [packages/query-core/src/mutation.ts:53](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L53)

The number of times the mutation function has failed for the current attempt.

***

### failureReason

```ts
failureReason: TError | null;
```

Defined in: [packages/query-core/src/mutation.ts:57](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L57)

The reason the current attempt failed, as reported by the retryer.

***

### isPaused

```ts
isPaused: boolean;
```

Defined in: [packages/query-core/src/mutation.ts:62](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L62)

Whether the mutation is currently paused (see network mode), or is
waiting for another mutation with the same `scope` to finish.

***

### status

```ts
status: MutationStatus;
```

Defined in: [packages/query-core/src/mutation.ts:66](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L66)

The status of the mutation.

***

### submittedAt

```ts
submittedAt: number;
```

Defined in: [packages/query-core/src/mutation.ts:74](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L74)

The timestamp for when the mutation was submitted.

***

### variables

```ts
variables: TVariables | undefined;
```

Defined in: [packages/query-core/src/mutation.ts:70](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L70)

The variables the mutation was last called with.
