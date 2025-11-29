---
id: MutationCache
title: MutationCache
---

# Class: MutationCache

Defined in: [packages/query-core/src/mutationCache.ts:187](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L187)

The `MutationCache` is the storage for mutations.

**Normally, you will not interact with the MutationCache directly and instead use the `QueryClient`.**

```tsx
import { MutationCache } from '@tanstack/react-query'

const mutationCache = new MutationCache({
  onError: (error) => {
    console.log(error)
  },
  onSuccess: (data) => {
    console.log(data)
  },
})
```

Its available methods are:

- [`getAll`](#mutationcachegetall)
- [`subscribe`](#mutationcachesubscribe)
- [`clear`](#mutationcacheclear)

**Options**

- `onError?: (error: unknown, variables: unknown, onMutateResult: unknown, mutation: Mutation, mutationFnContext: MutationFunctionContext) => Promise<unknown> | unknown`
  - Optional
  - This function will be called if some mutation encounters an error.
  - If you return a Promise from it, it will be awaited
- `onSuccess?: (data: unknown, variables: unknown, onMutateResult: unknown, mutation: Mutation, mutationFnContext: MutationFunctionContext) => Promise<unknown> | unknown`
  - Optional
  - This function will be called if some mutation is successful.
  - If you return a Promise from it, it will be awaited
- `onSettled?: (data: unknown | undefined, error: unknown | null, variables: unknown, onMutateResult: unknown, mutation: Mutation, mutationFnContext: MutationFunctionContext) => Promise<unknown> | unknown`
  - Optional
  - This function will be called if some mutation is settled (either successful or errored).
  - If you return a Promise from it, it will be awaited
- `onMutate?: (variables: unknown, mutation: Mutation, mutationFnContext: MutationFunctionContext) => Promise<unknown> | unknown`
  - Optional
  - This function will be called before some mutation executes.
  - If you return a Promise from it, it will be awaited

## Global callbacks

The `onError`, `onSuccess`, `onSettled` and `onMutate` callbacks on the MutationCache can be used to handle these events on a global level. They are different to `defaultOptions` provided to the QueryClient because:

- `defaultOptions` can be overridden by each Mutation - the global callbacks will **always** be called.
- `onMutate` does not allow returning a result.

## `mutationCache.getAll`

`getAll` returns all mutations within the cache.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a mutation in rare scenarios

```tsx
const mutations = mutationCache.getAll()
```

**Returns**

- `Mutation[]`
  - Mutation instances from the cache

## `mutationCache.subscribe`

The `subscribe` method can be used to subscribe to the mutation cache as a whole and be informed of safe/known updates to the cache like mutation states changing or mutations being updated, added or removed.

```tsx
const callback = (event) => {
  console.log(event.type, event.mutation)
}

const unsubscribe = mutationCache.subscribe(callback)
```

**Options**

- `callback: (mutation?: MutationCacheNotifyEvent) => void`
  - This function will be called with the mutation cache any time it is updated.

**Returns**

- `unsubscribe: Function => void`
  - This function will unsubscribe the callback from the mutation cache.

## `mutationCache.clear`

The `clear` method can be used to clear the cache entirely and start fresh.

```tsx
mutationCache.clear()
```

## Extends

- `Subscribable`\<`MutationCacheListener`\>

## Constructors

### Constructor

```ts
new MutationCache(config): MutationCache;
```

Defined in: [packages/query-core/src/mutationCache.ts:192](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L192)

#### Parameters

##### config

`MutationCacheConfig` = `{}`

#### Returns

`MutationCache`

#### Overrides

```ts
Subscribable<MutationCacheListener>.constructor
```

## Properties

### config

```ts
config: MutationCacheConfig = {};
```

Defined in: [packages/query-core/src/mutationCache.ts:192](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L192)

***

### listeners

```ts
protected listeners: Set<MutationCacheListener>;
```

Defined in: [packages/query-core/src/subscribable.ts:2](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L2)

#### Inherited from

```ts
Subscribable.listeners
```

## Methods

### add()

```ts
add(mutation): void;
```

Defined in: [packages/query-core/src/mutationCache.ts:217](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L217)

#### Parameters

##### mutation

[`Mutation`](Mutation.md)\<`any`, `any`, `any`, `any`\>

#### Returns

`void`

***

### build()

```ts
build<TData, TError, TVariables, TOnMutateResult>(
   client, 
   options, 
state?): Mutation<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutationCache.ts:199](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L199)

#### Type Parameters

##### TData

`TData`

##### TError

`TError`

##### TVariables

`TVariables`

##### TOnMutateResult

`TOnMutateResult`

#### Parameters

##### client

[`QueryClient`](QueryClient.md)

##### options

[`MutationOptions`](../interfaces/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

##### state?

[`MutationState`](../interfaces/MutationState.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Returns

[`Mutation`](Mutation.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

***

### canRun()

```ts
canRun(mutation): boolean;
```

Defined in: [packages/query-core/src/mutationCache.ts:254](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L254)

#### Parameters

##### mutation

[`Mutation`](Mutation.md)\<`any`, `any`, `any`, `any`\>

#### Returns

`boolean`

***

### clear()

```ts
clear(): void;
```

Defined in: [packages/query-core/src/mutationCache.ts:284](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L284)

#### Returns

`void`

***

### find()

```ts
find<TData, TError, TVariables, TOnMutateResult>(filters): 
  | Mutation<TData, TError, TVariables, TOnMutateResult>
  | undefined;
```

Defined in: [packages/query-core/src/mutationCache.ts:298](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L298)

#### Type Parameters

##### TData

`TData` = `unknown`

##### TError

`TError` = `Error`

##### TVariables

`TVariables` = `any`

##### TOnMutateResult

`TOnMutateResult` = `unknown`

#### Parameters

##### filters

[`MutationFilters`](../interfaces/MutationFilters.md)

#### Returns

  \| [`Mutation`](Mutation.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>
  \| `undefined`

***

### findAll()

```ts
findAll(filters): Mutation<unknown, Error, unknown, unknown>[];
```

Defined in: [packages/query-core/src/mutationCache.ts:313](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L313)

#### Parameters

##### filters

[`MutationFilters`](../interfaces/MutationFilters.md) = `{}`

#### Returns

[`Mutation`](Mutation.md)\<`unknown`, `Error`, `unknown`, `unknown`\>[]

***

### getAll()

```ts
getAll(): Mutation<unknown, Error, unknown, unknown>[];
```

Defined in: [packages/query-core/src/mutationCache.ts:294](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L294)

#### Returns

[`Mutation`](Mutation.md)\<`unknown`, `Error`, `unknown`, `unknown`\>[]

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

### notify()

```ts
notify(event): void;
```

Defined in: [packages/query-core/src/mutationCache.ts:317](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L317)

#### Parameters

##### event

[`MutationCacheNotifyEvent`](../type-aliases/MutationCacheNotifyEvent.md)

#### Returns

`void`

***

### onSubscribe()

```ts
protected onSubscribe(): void;
```

Defined in: [packages/query-core/src/subscribable.ts:23](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L23)

#### Returns

`void`

#### Inherited from

```ts
Subscribable.onSubscribe
```

***

### onUnsubscribe()

```ts
protected onUnsubscribe(): void;
```

Defined in: [packages/query-core/src/subscribable.ts:27](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L27)

#### Returns

`void`

#### Inherited from

```ts
Subscribable.onUnsubscribe
```

***

### remove()

```ts
remove(mutation): void;
```

Defined in: [packages/query-core/src/mutationCache.ts:231](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L231)

#### Parameters

##### mutation

[`Mutation`](Mutation.md)\<`any`, `any`, `any`, `any`\>

#### Returns

`void`

***

### resumePausedMutations()

```ts
resumePausedMutations(): Promise<unknown>;
```

Defined in: [packages/query-core/src/mutationCache.ts:325](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L325)

#### Returns

`Promise`\<`unknown`\>

***

### runNext()

```ts
runNext(mutation): Promise<unknown>;
```

Defined in: [packages/query-core/src/mutationCache.ts:271](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L271)

#### Parameters

##### mutation

[`Mutation`](Mutation.md)\<`any`, `any`, `any`, `any`\>

#### Returns

`Promise`\<`unknown`\>

***

### subscribe()

```ts
subscribe(listener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:8](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L8)

#### Parameters

##### listener

`MutationCacheListener`

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
