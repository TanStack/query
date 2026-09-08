---
id: Mutation
title: Mutation
---

Defined in: [packages/query-core/src/mutation.ts:135](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L135)

Represents a single mutation attempt. A `Mutation` holds the mutation's
options, state (data/error/status), and the `MutationObserver`s currently
subscribed to it.

Instances are created and managed internally by `MutationCache`; application
code typically interacts with mutations indirectly through `QueryClient` or
a framework hook like `useMutation`. Direct access to a `Mutation` instance
is possible via `mutationCache.find()`/`getAll()` for inspecting cache state.

## Example

```ts
const mutationCache = queryClient.getMutationCache()

const mutation = mutationCache.find({ mutationKey: ['addPost'] })
```

## Extends

- `Removable`

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TVariables

`TVariables` = `unknown`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Constructors

### Constructor

```ts
new Mutation<TData, TError, TVariables, TOnMutateResult>(config): Mutation<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutation.ts:152](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L152)

#### Parameters

##### config

`MutationConfig`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Returns

`Mutation`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Overrides

```ts
Removable.constructor
```

## Properties

### gcTime

```ts
gcTime: number;
```

Defined in: [packages/query-core/src/removable.ts:7](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L7)

#### Inherited from

```ts
Removable.gcTime
```

***

### mutationId

```ts
readonly mutationId: number;
```

Defined in: [packages/query-core/src/mutation.ts:143](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L143)

***

### options

```ts
options: MutationOptions<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutation.ts:142](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L142)

***

### state

```ts
state: MutationState<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutation.ts:141](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L141)

## Accessors

### meta

#### Get Signature

```ts
get meta(): Record<string, unknown> | undefined;
```

Defined in: [packages/query-core/src/mutation.ts:179](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L179)

The `meta` object passed in the mutation's options, if any.

##### Returns

`Record`\<`string`, `unknown`\> \| `undefined`

## Methods

### clearGcTimeout()

```ts
protected clearGcTimeout(): void;
```

Defined in: [packages/query-core/src/removable.ts:32](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L32)

#### Returns

`void`

#### Inherited from

```ts
Removable.clearGcTimeout
```

***

### continue()

```ts
continue(): Promise<unknown>;
```

Defined in: [packages/query-core/src/mutation.ts:243](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L243)

Resumes a mutation that is currently paused or was restored from a
dehydrated, still-`pending` state.

- If this mutation has an active retryer (it paused mid-attempt, e.g. due
  to the network mode or scope-based queuing), its retryer is resumed.
- Otherwise, if the mutation's status is still `pending` (e.g. it was
  dehydrated while an attempt was in flight and never got a retryer in
  this instance), `execute` is called again with the last known variables.
- Otherwise the mutation has already settled and this resolves immediately
  without running anything again.

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
// typically driven by reconnect handling, e.g. queryClient.resumePausedMutations()
const mutation = mutationCache.find({ mutationKey: ['addPost'] })
await mutation?.continue()
```

#### See

[Mutation#execute](#execute)

***

### destroy()

```ts
destroy(): void;
```

Defined in: [packages/query-core/src/removable.ts:10](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L10)

#### Returns

`void`

#### Inherited from

```ts
Removable.destroy
```

***

### execute()

```ts
execute(variables): Promise<TData>;
```

Defined in: [packages/query-core/src/mutation.ts:284](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L284)

Runs the mutation function for the given variables through a retryer, and
drives the mutation's state and lifecycle callbacks through to settlement.

If this mutation's state is already `pending` when `execute` is called
(i.e. it was restored, still in-flight, from a dehydrated state), the
`onMutate` step is skipped and a `continue` action is dispatched to
unpause it; otherwise a `pending` action is dispatched first, then the
mutation cache's `onMutate` and the mutation's own `onMutate` option are
awaited in that order, and the resulting context is stored.

The mutation function is then run (subject to `retry`/`retryDelay`/
`networkMode`, and to the mutation cache's scope-based serialization).
On success, the cache's `onSuccess`/`onSettled` callbacks run before the
mutation's own `onSuccess`/`onSettled` options, a `success` action is
dispatched, and the resolved data is returned. On failure, the same
cache-then-option ordering is used for `onError`/`onSettled`, but each of
those four callbacks is individually caught so that a throwing callback
cannot mask the original error; an `error` action is then dispatched and
the original error is re-thrown.

#### Parameters

##### variables

`TVariables`

#### Returns

`Promise`\<`TData`\>

#### Example

```ts
// Called internally by `MutationObserver.mutate` and `Mutation.continue` —
// applications normally trigger mutations through those, not this method.
const data = await mutation.execute(variables)
```

#### See

[Mutation#continue](#continue)

***

### optionalRemove()

```ts
protected optionalRemove(): void;
```

Defined in: [packages/query-core/src/mutation.ts:212](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L212)

#### Returns

`void`

#### Overrides

```ts
Removable.optionalRemove
```

***

### scheduleGc()

```ts
protected scheduleGc(): void;
```

Defined in: [packages/query-core/src/removable.ts:14](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L14)

#### Returns

`void`

#### Inherited from

```ts
Removable.scheduleGc
```

***

### updateGcTime()

```ts
protected updateGcTime(newGcTime): void;
```

Defined in: [packages/query-core/src/removable.ts:24](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L24)

#### Parameters

##### newGcTime

`number` | `undefined`

#### Returns

`void`

#### Inherited from

```ts
Removable.updateGcTime
```
