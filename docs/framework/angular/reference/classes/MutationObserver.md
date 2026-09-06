---
id: MutationObserver
title: MutationObserver
---

Defined in: [packages/query-core/src/mutationObserver.ts:38](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L38)

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
new MutationObserver<TData, TError, TVariables, TOnMutateResult>(client, options): MutationObserver<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutationObserver.ts:58](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L58)

#### Parameters

##### client

[`QueryClient`](QueryClient.md)

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

### listeners

```ts
protected listeners: Set<MutationObserverListener<TData, TError, TVariables, TOnMutateResult>>;
```

Defined in: [packages/query-core/src/subscribable.ts:2](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L2)

#### Inherited from

```ts
Subscribable.listeners
```

***

### options

```ts
options: MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutationObserver.ts:46](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L46)

## Methods

### bindMethods()

```ts
protected bindMethods(): void;
```

Defined in: [packages/query-core/src/mutationObserver.ts:75](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L75)

#### Returns

`void`

***

### getCurrentResult()

```ts
getCurrentResult(): MutationObserverResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutationObserver.ts:155](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L155)

Returns the observer's current result, derived from the observed
mutation's state (or the default, `idle` state if no mutation has been
built yet, e.g. before the first `mutate()` call or after `reset()`).

#### Returns

[`MutationObserverResult`](../type-aliases/MutationObserverResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

***

### hasListeners()

```ts
hasListeners(): boolean;
```

Defined in: [packages/query-core/src/subscribable.ts:19](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L19)

#### Returns

`boolean`

#### Inherited from

```ts
Subscribable.hasListeners
```

***

### mutate()

```ts
mutate(variables, options?): Promise<TData>;
```

Defined in: [packages/query-core/src/mutationObserver.ts:207](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L207)

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

##### options?

[`MutateOptions`](../interfaces/MutateOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Returns

`Promise`\<`TData`\>

#### Example

```ts
await observer.mutate(
  { title: 'New post' },
  { onSuccess: (data) => console.log(data) },
)
```

***

### onSubscribe()

```ts
protected onSubscribe(): void;
```

Defined in: [packages/query-core/src/mutationObserver.ts:127](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L127)

#### Returns

`void`

#### Overrides

```ts
Subscribable.onSubscribe
```

***

### onUnsubscribe()

```ts
protected onUnsubscribe(): void;
```

Defined in: [packages/query-core/src/mutationObserver.ts:135](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L135)

#### Returns

`void`

#### Overrides

```ts
Subscribable.onUnsubscribe
```

***

### reset()

```ts
reset(): void;
```

Defined in: [packages/query-core/src/mutationObserver.ts:180](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L180)

Detaches the observer from the mutation it is currently observing (if
any) and resets the observed result back to its default, `idle` state.

This does not cancel an in-flight mutation; the mutation itself keeps
running to completion and its own callbacks still fire, but this
observer stops reflecting its state and a subsequent `mutate()` call
will build a brand new mutation.

#### Returns

`void`

#### Example

```ts
observer.reset()
```

#### See

[MutationObserver#mutate](#mutate)

***

### setOptions()

```ts
setOptions(options): void;
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
subscribe(listener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:8](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L8)

#### Parameters

##### listener

`MutationObserverListener`

#### Returns

```ts
(): void;
```

##### Returns

`void`

#### Inherited from

```ts
Subscribable.subscribe
```
