---
id: MutationObserverErrorResult
title: MutationObserverErrorResult
---

# Interface: MutationObserverErrorResult\<TData, TError, TVariables, TOnMutateResult\>

Defined in: [packages/query-core/src/types.ts:1298](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1298)

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

Defined in: [packages/query-core/src/mutation.ts:32](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L32)

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`context`](MutationObserverBaseResult.md#context)

***

### data

```ts
data: undefined;
```

Defined in: [packages/query-core/src/types.ts:1309](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1309)

The last successfully resolved data for the mutation.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`data`](MutationObserverBaseResult.md#data)

***

### error

```ts
error: TError;
```

Defined in: [packages/query-core/src/types.ts:1310](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1310)

The error object for the mutation, if an error was encountered.
- Defaults to `null`.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`error`](MutationObserverBaseResult.md#error)

***

### failureCount

```ts
failureCount: number;
```

Defined in: [packages/query-core/src/mutation.ts:35](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L35)

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`failureCount`](MutationObserverBaseResult.md#failurecount)

***

### failureReason

```ts
failureReason: TError | null;
```

Defined in: [packages/query-core/src/mutation.ts:36](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L36)

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`failureReason`](MutationObserverBaseResult.md#failurereason)

***

### isError

```ts
isError: true;
```

Defined in: [packages/query-core/src/types.ts:1312](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1312)

A boolean variable derived from `status`.
- `true` if the last mutation attempt resulted in an error.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isError`](MutationObserverBaseResult.md#iserror)

***

### isIdle

```ts
isIdle: false;
```

Defined in: [packages/query-core/src/types.ts:1313](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1313)

A boolean variable derived from `status`.
- `true` if the mutation is in its initial state prior to executing.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isIdle`](MutationObserverBaseResult.md#isidle)

***

### isPaused

```ts
isPaused: boolean;
```

Defined in: [packages/query-core/src/mutation.ts:37](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L37)

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isPaused`](MutationObserverBaseResult.md#ispaused)

***

### isPending

```ts
isPending: false;
```

Defined in: [packages/query-core/src/types.ts:1314](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1314)

A boolean variable derived from `status`.
- `true` if the mutation is currently executing.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isPending`](MutationObserverBaseResult.md#ispending)

***

### isSuccess

```ts
isSuccess: false;
```

Defined in: [packages/query-core/src/types.ts:1315](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1315)

A boolean variable derived from `status`.
- `true` if the last mutation attempt was successful.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isSuccess`](MutationObserverBaseResult.md#issuccess)

***

### mutate

```ts
mutate: MutateFunction<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/types.ts:1249](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1249)

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

Defined in: [packages/query-core/src/types.ts:1253](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1253)

A function to clean the mutation internal state (i.e., it resets the mutation to its initial state).

#### Returns

`void`

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`reset`](MutationObserverBaseResult.md#reset)

***

### status

```ts
status: "error";
```

Defined in: [packages/query-core/src/types.ts:1316](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1316)

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

Defined in: [packages/query-core/src/mutation.ts:40](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L40)

#### Inherited from

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`submittedAt`](MutationObserverBaseResult.md#submittedat)

***

### variables

```ts
variables: TVariables;
```

Defined in: [packages/query-core/src/types.ts:1311](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1311)

The variables object passed to the `mutationFn`.

#### Overrides

[`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`variables`](MutationObserverBaseResult.md#variables)
