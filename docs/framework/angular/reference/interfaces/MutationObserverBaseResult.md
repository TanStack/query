---
id: MutationObserverBaseResult
title: MutationObserverBaseResult
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:744

The raw state stored on a `Mutation` instance. This is the underlying state
that observer results (e.g. `MutationObserverResult`) are derived from.

## Extends

- [`MutationState`](MutationState.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

## Extended by

- [`MutationObserverIdleResult`](MutationObserverIdleResult.md)
- [`MutationObserverLoadingResult`](MutationObserverLoadingResult.md)
- [`MutationObserverErrorResult`](MutationObserverErrorResult.md)
- [`MutationObserverSuccessResult`](MutationObserverSuccessResult.md)

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

Defined in: packages/query-core/dist-ts/src/mutation.d.ts:22

The value returned by `onMutate`, if defined. Passed to `onSuccess`,
`onError` and `onSettled` as the mutation's context.

#### Inherited from

[`MutationState`](MutationState.md).[`context`](MutationState.md#context)

***

### data

```ts
data: TData | undefined;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:748

The last successfully resolved data for the mutation.

#### Overrides

[`MutationState`](MutationState.md).[`data`](MutationState.md#data)

***

### error

```ts
error: TError | null;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:757

The error object for the mutation, if an error was encountered.
- Defaults to `null`.

#### Overrides

[`MutationState`](MutationState.md).[`error`](MutationState.md#error)

***

### failureCount

```ts
failureCount: number;
```

Defined in: packages/query-core/dist-ts/src/mutation.d.ts:35

The number of times the mutation function has failed for the current attempt.

#### Inherited from

[`MutationState`](MutationState.md).[`failureCount`](MutationState.md#failurecount)

***

### failureReason

```ts
failureReason: TError | null;
```

Defined in: packages/query-core/dist-ts/src/mutation.d.ts:39

The reason the current attempt failed, as reported by the retryer.

#### Inherited from

[`MutationState`](MutationState.md).[`failureReason`](MutationState.md#failurereason)

***

### isError

```ts
isError: boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:762

A boolean variable derived from `status`.
- `true` if the last mutation attempt resulted in an error.

***

### isIdle

```ts
isIdle: boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:767

A boolean variable derived from `status`.
- `true` if the mutation is in its initial state prior to executing.

***

### isPaused

```ts
isPaused: boolean;
```

Defined in: packages/query-core/dist-ts/src/mutation.d.ts:44

Whether the mutation is currently paused (see network mode), or is
waiting for another mutation with the same `scope` to finish.

#### Inherited from

[`MutationState`](MutationState.md).[`isPaused`](MutationState.md#ispaused)

***

### isPending

```ts
isPending: boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:772

A boolean variable derived from `status`.
- `true` if the mutation is currently executing.

***

### isSuccess

```ts
isSuccess: boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:777

A boolean variable derived from `status`.
- `true` if the last mutation attempt was successful.

***

### mutate

```ts
mutate: MutateFunction<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:797

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

***

### reset()

```ts
reset: () => void;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:801

A function to clean the mutation internal state (i.e., it resets the mutation to its initial state).

#### Returns

`void`

***

### status

```ts
status: MutationStatus;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:786

The status of the mutation.
- Will be:
  - `idle` initial status prior to the mutation function executing.
  - `pending` if the mutation is currently executing.
  - `error` if the last mutation attempt resulted in an error.
  - `success` if the last mutation attempt was successful.

#### Overrides

[`MutationState`](MutationState.md).[`status`](MutationState.md#status)

***

### submittedAt

```ts
submittedAt: number;
```

Defined in: packages/query-core/dist-ts/src/mutation.d.ts:56

The timestamp for when the mutation was submitted.

#### Inherited from

[`MutationState`](MutationState.md).[`submittedAt`](MutationState.md#submittedat)

***

### variables

```ts
variables: TVariables | undefined;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:752

The variables object passed to the `mutationFn`.

#### Overrides

[`MutationState`](MutationState.md).[`variables`](MutationState.md#variables)
