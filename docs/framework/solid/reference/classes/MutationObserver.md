---
id: MutationObserver
title: MutationObserver
---

Defined in: [packages/query-core/src/mutationObserver.ts:37](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L37)

Observes a single mutation and derives a `MutationObserverResult` from it.
A framework hook like `useMutation` creates one `MutationObserver` per hook
call, keeps it stable across re-renders, calls `setOptions` when the options
passed to the hook change, subscribes to it to re-render on updates, and
reads `getCurrentResult()` for the value to return. Calling `mutate()`
builds a new underlying `Mutation` in the `MutationCache` and executes it.

## Example

```ts
const observer = new MutationObserver(queryClient, {
  mutationFn: (variables: { title: string }) => addPost(variables),
})
```

## Extends

- `Subscribable`\<`MutationObserverListener`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>\>

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Constructors

### Constructor

```ts
new MutationObserver<TData, TError, TVariables, TOnMutateResult>(client: QueryClient, options: MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>): MutationObserver<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutationObserver.ts:57](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L57)

#### Parameters

##### client

`QueryClient`

##### options

[`MutationObserverOptions`](../interfaces/MutationObserverOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Returns

`MutationObserver`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Overrides

```ts
Subscribable<
  MutationObserverListener<TData, TError, TVariables, TOnMutateResult>
>.constructor
```

## Properties

### options

```ts
options: MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutationObserver.ts:45](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L45)

## Methods

### getCurrentResult()

```ts
getCurrentResult(): MutationObserverResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutationObserver.ts:160](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L160)

Returns the observer's current result, derived from the observed
mutation's state (or the default, `idle` state if no mutation has been
built yet, e.g. before the first `mutate()` call or after `reset()`).

#### Returns

[`MutationObserverResult`](../type-aliases/MutationObserverResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

The observer's latest result.

***

### hasListeners()

```ts
hasListeners(): boolean;
```

Defined in: [packages/query-core/src/subscribable.ts:43](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L43)

Returns `true` while at least one listener is registered, `false` once they have all unsubscribed.

#### Returns

`boolean`

`true` if at least one listener is registered.

#### Inherited from

```ts
Subscribable.hasListeners
```

***

### mutate()

```ts
mutate(variables: TVariables, options?: MutateOptions<TData, TError, TVariables, TOnMutateResult>): Promise<TData>;
```

Defined in: [packages/query-core/src/mutationObserver.ts:212](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L212)

Builds a new `Mutation` in the `MutationCache` using the observer's
current options, detaches this observer from any previously observed
mutation, attaches it to the new one, and executes it with the given
variables.

The optional per-call `options` (`onSuccess`/`onError`/`onSettled`) are
invoked once the mutation settles, in addition to any callbacks defined
on the observer's own options.

#### Parameters

##### variables

`TVariables`

The variables passed to the `mutationFn`.

##### options?

[`MutateOptions`](../interfaces/MutateOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

Per-call `onSuccess`, `onError`, and `onSettled` callbacks.

#### Returns

`Promise`\<`TData`\>

A promise that resolves with the mutation's data, or rejects with its error.

#### Example

```ts
await observer.mutate(
  { title: 'New post' },
  { onSuccess: (data) => console.log(data) },
)
```

***

### reset()

```ts
reset(): void;
```

Defined in: [packages/query-core/src/mutationObserver.ts:183](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L183)

Detaches the observer from the mutation it is currently observing (if
any) and resets the observed result back to its default, `idle` state.

This does not cancel an in-flight mutation; the mutation itself keeps
running to completion and its own callbacks still fire, but this
observer stops reflecting its state and a subsequent `mutate()` call
will build a brand new mutation.

#### Returns

`void`

#### See

[MutationObserver#mutate](#mutate)

#### Example

```ts
observer.reset()
```

***

### setOptions()

```ts
setOptions(options: MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>): void;
```

Defined in: [packages/query-core/src/mutationObserver.ts:96](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L96)

Updates the observer's options.

If the new `mutationKey` differs from the previous one (and both were
defined), the observer is reset, detaching it from the mutation it was
observing. Otherwise, if the currently observed mutation is still
`pending`, its options are updated in place as well.

#### Parameters

##### options

[`MutationObserverOptions`](../interfaces/MutationObserverOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

The new mutation observer options. They are defaulted with [QueryClient#defaultMutationOptions](QueryClient.md#defaultmutationoptions) before being applied.

#### Returns

`void`

#### Example

```ts
observer.setOptions({
  mutationFn: (variables: { title: string }) => addPost(variables),
  onSuccess: (data) => console.log(data),
})
```

***

### subscribe()

```ts
subscribe(listener: MutationObserverListener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:28](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L28)

Registers a listener to be called on every update this object notifies about. Returns a function
that removes the listener again — call it to stop listening. The base class never drops a listener
on its own, though some subclasses clear all of theirs in `destroy()`.

#### Parameters

##### listener

`MutationObserverListener`

Called on each update, with whatever the subclass passes to its subscribers.

#### Returns

A function that removes the listener.

```ts
(): void;
```

##### Returns

`void`

#### Example

```ts
const unsubscribe = subscribable.subscribe(() => {
  // react to the update
})

unsubscribe()
```

#### Inherited from

```ts
Subscribable.subscribe
```
