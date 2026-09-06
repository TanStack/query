---
id: MutationObserverLoadingResult
title: MutationObserverLoadingResult
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:826

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

Defined in: packages/query-core/dist-ts/src/mutation.d.ts:22

The value returned by `onMutate`, if defined. Passed to `onSuccess`,
`onError` and `onSettled` as the mutation's context.

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`context`](MutationObserverBaseResult.md#context)

***

### data

```ts
data: undefined;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:827

The last successfully resolved data for the mutation.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`data`](MutationObserverBaseResult.md#data)

***

### error

```ts
error: null;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:829

The error object for the mutation, if an error was encountered.
- Defaults to `null`.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`error`](MutationObserverBaseResult.md#error)

***

### failureCount

```ts
failureCount: number;
```

Defined in: packages/query-core/dist-ts/src/mutation.d.ts:35

The number of times the mutation function has failed for the current attempt.

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`failureCount`](MutationObserverBaseResult.md#failurecount)

***

### failureReason

```ts
failureReason: TError | null;
```

Defined in: packages/query-core/dist-ts/src/mutation.d.ts:39

The reason the current attempt failed, as reported by the retryer.

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`failureReason`](MutationObserverBaseResult.md#failurereason)

***

### isError

```ts
isError: false;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:830

A boolean variable derived from `status`.
- `true` if the last mutation attempt resulted in an error.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isError`](MutationObserverBaseResult.md#iserror)

***

### isIdle

```ts
isIdle: false;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:831

A boolean variable derived from `status`.
- `true` if the mutation is in its initial state prior to executing.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isIdle`](MutationObserverBaseResult.md#isidle)

***

### isPaused

```ts
isPaused: boolean;
```

Defined in: packages/query-core/dist-ts/src/mutation.d.ts:44

Whether the mutation is currently paused (see network mode), or is
waiting for another mutation with the same `scope` to finish.

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isPaused`](MutationObserverBaseResult.md#ispaused)

***

### isPending

```ts
isPending: true;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:832

A boolean variable derived from `status`.
- `true` if the mutation is currently executing.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isPending`](MutationObserverBaseResult.md#ispending)

***

### isSuccess

```ts
isSuccess: false;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:833

A boolean variable derived from `status`.
- `true` if the last mutation attempt was successful.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isSuccess`](MutationObserverBaseResult.md#issuccess)

***

### mutate

```ts
mutate: MutateFunction<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:810

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:814

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:834

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

Defined in: packages/query-core/dist-ts/src/mutation.d.ts:56

The timestamp for when the mutation was submitted.

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`submittedAt`](MutationObserverBaseResult.md#submittedat)

***

### variables

```ts
variables: TVariables;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:828

The variables object passed to the `mutationFn`.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`variables`](MutationObserverBaseResult.md#variables)
