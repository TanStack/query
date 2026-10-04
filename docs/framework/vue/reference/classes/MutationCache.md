---
id: MutationCache
title: MutationCache
---

Defined in: [packages/vue-query/src/mutationCache.ts:15](https://github.com/TanStack/query/blob/main/packages/vue-query/src/mutationCache.ts#L15)

Vue-aware subclass of `@tanstack/query-core`'s `MutationCache`. `find`/`findAll` also accept a
MaybeRefDeep filters object, so `ref`s can be passed directly without unwrapping. Access it via
`queryClient.getMutationCache()` — `QueryClient` constructs one of these by default.

## Extends

- `MutationCache`

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

#### Inherited from

```ts
MC.constructor
```

## Properties

### config

```ts
config: MutationCacheConfig = {};
```

Defined in: [packages/query-core/src/mutationCache.ts:128](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L128)

#### Inherited from

```ts
MC.config
```

## Methods

### clear()

```ts
clear(): void;
```

Defined in: [packages/query-core/src/mutationCache.ts:262](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L262)

Removes all mutations from the cache.

#### Returns

`void`

#### Example

```ts
const mutationCache = queryClient.getMutationCache()

mutationCache.clear()
```

#### Inherited from

```ts
MC.clear
```

***

### find()

```ts
find<TData, TError, TVariables, TOnMutateResult>(filters: MaybeRefDeep<MutationFilters<unknown, Error, unknown, unknown>>): 
  | Mutation<TData, TError, TVariables, TOnMutateResult>
  | undefined;
```

Defined in: [packages/vue-query/src/mutationCache.ts:16](https://github.com/TanStack/query/blob/main/packages/vue-query/src/mutationCache.ts#L16)

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

`MaybeRefDeep`\<[`MutationFilters`](../interfaces/MutationFilters.md)\<`unknown`, `Error`, `unknown`, `unknown`\>\>

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

#### Overrides

```ts
MC.find
```

***

### findAll()

```ts
findAll(filters: MaybeRefDeep<MutationFilters<unknown, Error, unknown, unknown>>): Mutation<unknown, Error, unknown, unknown>[];
```

Defined in: [packages/vue-query/src/mutationCache.ts:27](https://github.com/TanStack/query/blob/main/packages/vue-query/src/mutationCache.ts#L27)

An even more advanced method that can be used to get existing mutation instances from the
cache that match the given filters. If no mutations match, an empty array is returned.

This is not typically needed for most applications, but can come in handy when needing more
information about mutations in rare scenarios.

#### Parameters

##### filters

`MaybeRefDeep`\<[`MutationFilters`](../interfaces/MutationFilters.md)\<`unknown`, `Error`, `unknown`, `unknown`\>\> = `{}`

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

#### Overrides

```ts
MC.findAll
```

***

### getAll()

```ts
getAll(): Mutation<unknown, Error, unknown, unknown>[];
```

Defined in: [packages/query-core/src/mutationCache.ts:285](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L285)

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

#### Inherited from

```ts
MC.getAll
```

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
MC.hasListeners
```

***

### subscribe()

```ts
subscribe(listener: MutationCacheListener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:28](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L28)

Registers a listener to be called on every update this object notifies about. Returns a function
that removes the listener again — call it to stop listening. The base class never drops a listener
on its own, though some subclasses clear all of theirs in `destroy()`.

#### Parameters

##### listener

`MutationCacheListener`

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
MC.subscribe
```
