---
id: MutationCache
title: MutationCache
---

Defined in: [packages/query-core/src/mutationCache.ts:123](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L123)

The `MutationCache` is the storage for mutations.

Normally, you will not interact with the `MutationCache` directly and instead use a
`QueryClient`. You can subscribe to it (inherited from `Subscribable`) to be informed of
safe/known updates to the cache, such as mutations being added, removed, or updated.

## Example

```ts
const unsubscribe = mutationCache.subscribe((event) => {
  console.log(event.type, event.mutation)
})
```

## Extends

- `Subscribable`\<`MutationCacheListener`\>

## Constructors

### Constructor

```ts
new MutationCache(config: MutationCacheConfig): MutationCache;
```

Defined in: [packages/query-core/src/mutationCache.ts:128](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L128)

#### Parameters

##### config

[`MutationCacheConfig`](../interfaces/MutationCacheConfig.md) = `{}`

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

Defined in: [packages/query-core/src/mutationCache.ts:128](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L128)

## Methods

### clear()

```ts
clear(): void;
```

Defined in: [packages/query-core/src/mutationCache.ts:257](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L257)

Removes all mutations from the cache.

#### Returns

`void`

#### Example

```ts
const mutationCache = queryClient.getMutationCache()

mutationCache.clear()
```

***

### find()

```ts
find<TData, TError, TVariables, TOnMutateResult>(filters: MutationFilters):
  | Mutation<TData, TError, TVariables, TOnMutateResult>
  | undefined;
```

Defined in: [packages/query-core/src/mutationCache.ts:300](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L300)

A slightly more advanced method that can be used to get an existing mutation instance from
the cache. If the mutation does not exist, `undefined` is returned.

This is not typically needed for most applications, but can come in handy when needing more
information about a mutation in rare scenarios.

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

The filters to match. `exact` defaults to `true`.

#### Returns

  \| [`Mutation`](Mutation.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>
  \| `undefined`

The first matching mutation, or `undefined`.

#### See

[MutationCache#findAll](#findall)

#### Example

```ts
const mutationCache = queryClient.getMutationCache()

const mutation = mutationCache.find({ mutationKey: ['addPost'] })
```

***

### findAll()

```ts
findAll(filters: MutationFilters): Mutation<unknown, Error, unknown, unknown>[];
```

Defined in: [packages/query-core/src/mutationCache.ts:331](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L331)

An even more advanced method that can be used to get existing mutation instances from the
cache that match the given filters. If no mutations match, an empty array is returned.

This is not typically needed for most applications, but can come in handy when needing more
information about mutations in rare scenarios.

#### Parameters

##### filters

[`MutationFilters`](../interfaces/MutationFilters.md) = `{}`

The filters to match. Without filters, every mutation is returned.

#### Returns

[`Mutation`](Mutation.md)\<`unknown`, `Error`, `unknown`, `unknown`\>[]

The matching mutations.

#### See

[MutationCache#find](#find)

#### Example

```ts
const mutationCache = queryClient.getMutationCache()

const mutations = mutationCache.findAll({ mutationKey: ['addPost'] })
```

***

### getAll()

```ts
getAll(): Mutation<unknown, Error, unknown, unknown>[];
```

Defined in: [packages/query-core/src/mutationCache.ts:280](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L280)

Returns all mutations within the cache.

This is not typically needed for most applications, but can come in handy when needing more
information about a mutation in rare scenarios.

#### Returns

[`Mutation`](Mutation.md)\<`unknown`, `Error`, `unknown`, `unknown`\>[]

Every mutation in the cache.

#### Example

```ts
const mutationCache = queryClient.getMutationCache()

const mutations = mutationCache.getAll()
```

***

### hasListeners()

```ts
hasListeners(): boolean;
```

Defined in: [packages/query-core/src/subscribable.ts:41](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L41)

Returns `true` while at least one listener is registered, `false` once they have all unsubscribed.

#### Returns

`boolean`

#### Inherited from

```ts
Subscribable.hasListeners
```

***

### subscribe()

```ts
subscribe(listener: MutationCacheListener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:27](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L27)

Registers a listener to be called on every update this object notifies about. Returns a function
that removes the listener again — call it to stop listening. The base class never drops a listener
on its own, though some subclasses clear all of theirs in `destroy()`.

#### Parameters

##### listener

`MutationCacheListener`

Called on each update, with whatever the subclass passes to its subscribers.

#### Returns

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
