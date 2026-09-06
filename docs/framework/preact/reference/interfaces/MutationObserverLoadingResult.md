---
id: MutationObserverLoadingResult
title: MutationObserverLoadingResult
---

Defined in: [packages/query-core/src/types.ts:1421](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1421)

The raw state stored on a `Mutation` instance. This is the underlying state
that observer results (e.g. `MutationObserverResult`) are derived from.

## Extends

- [`MutationObserverBaseResult`](MutationObserverBaseResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TVariables

`TVariables` = `void`

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

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`context`](MutationObserverBaseResult.md#context)

***

### data

```ts
data: undefined;
```

Defined in: [packages/query-core/src/types.ts:1432](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1432)

The last successfully resolved data for the mutation.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`data`](MutationObserverBaseResult.md#data)

***

### error

```ts
error: null;
```

Defined in: [packages/query-core/src/types.ts:1434](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1434)

The error object for the mutation, if an error was encountered.
- Defaults to `null`.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`error`](MutationObserverBaseResult.md#error)

***

### failureCount

```ts
failureCount: number;
```

Defined in: [packages/query-core/src/mutation.ts:53](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L53)

The number of times the mutation function has failed for the current attempt.

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`failureCount`](MutationObserverBaseResult.md#failurecount)

***

### failureReason

```ts
failureReason: TError | null;
```

Defined in: [packages/query-core/src/mutation.ts:57](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L57)

The reason the current attempt failed, as reported by the retryer.

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`failureReason`](MutationObserverBaseResult.md#failurereason)

***

### isError

```ts
isError: false;
```

Defined in: [packages/query-core/src/types.ts:1435](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1435)

A boolean variable derived from `status`.
- `true` if the last mutation attempt resulted in an error.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isError`](MutationObserverBaseResult.md#iserror)

***

### isIdle

```ts
isIdle: false;
```

Defined in: [packages/query-core/src/types.ts:1436](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1436)

A boolean variable derived from `status`.
- `true` if the mutation is in its initial state prior to executing.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isIdle`](MutationObserverBaseResult.md#isidle)

***

### isPaused

```ts
isPaused: boolean;
```

Defined in: [packages/query-core/src/mutation.ts:62](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L62)

Whether the mutation is currently paused (see network mode), or is
waiting for another mutation with the same `scope` to finish.

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isPaused`](MutationObserverBaseResult.md#ispaused)

***

### isPending

```ts
isPending: true;
```

Defined in: [packages/query-core/src/types.ts:1437](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1437)

A boolean variable derived from `status`.
- `true` if the mutation is currently executing.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isPending`](MutationObserverBaseResult.md#ispending)

***

### isSuccess

```ts
isSuccess: false;
```

Defined in: [packages/query-core/src/types.ts:1438](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1438)

A boolean variable derived from `status`.
- `true` if the last mutation attempt was successful.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isSuccess`](MutationObserverBaseResult.md#issuccess)

***

### mutate

```ts
mutate: MutateFunction<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/types.ts:1393](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1393)

The mutation function you can call with variables to trigger the mutation and optionally hooks on additional callback options.

#### Param

The variables object to pass to the `mutationFn`.

#### Param

This function will fire when the mutation is successful and will be passed the mutation's result.

#### Param

This function will fire if the mutation encounters an error and will be passed the error.

#### Param

This function will fire when the mutation is either successfully fetched or encounters an error and be passed either the data or error.

#### Remarks

- If you make multiple requests, `onSuccess` will fire only after the latest call you've made.
- All the callback functions (`onSuccess`, `onError`, `onSettled`) are void functions, and the returned value will be ignored.

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`mutate`](MutationObserverBaseResult.md#mutate)

***

### reset()

```ts
reset: () => void;
```

Defined in: [packages/query-core/src/types.ts:1397](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1397)

A function to clean the mutation internal state (i.e., it resets the mutation to its initial state).

#### Returns

`void`

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`reset`](MutationObserverBaseResult.md#reset)

***

### status

```ts
status: "pending";
```

Defined in: [packages/query-core/src/types.ts:1439](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1439)

The status of the mutation.
- Will be:
  - `idle` initial status prior to the mutation function executing.
  - `pending` if the mutation is currently executing.
  - `error` if the last mutation attempt resulted in an error.
  - `success` if the last mutation attempt was successful.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`status`](MutationObserverBaseResult.md#status)

***

### submittedAt

```ts
submittedAt: number;
```

Defined in: [packages/query-core/src/mutation.ts:74](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L74)

The timestamp for when the mutation was submitted.

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`submittedAt`](MutationObserverBaseResult.md#submittedat)

***

### variables

```ts
variables: TVariables;
```

Defined in: [packages/query-core/src/types.ts:1433](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1433)

The variables object passed to the `mutationFn`.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`variables`](MutationObserverBaseResult.md#variables)
