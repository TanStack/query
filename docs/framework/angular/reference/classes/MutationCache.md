---
id: MutationCache
title: MutationCache
---

Defined in: packages/query-core/dist-ts/src/mutationCache.d.ts:68

The `MutationCache` is the storage for mutations.

Normally, you will not interact with the `MutationCache` directly and instead use a
`QueryClient`. You can subscribe to it (inherited from `Subscribable`) to be informed of
safe/known updates to the cache, such as mutations being added, removed, or updated.

## Extends

- `Subscribable`\<`MutationCacheListener`\>

## Constructors

### Constructor

```ts
new MutationCache(config?): MutationCache;
```

Defined in: packages/query-core/dist-ts/src/mutationCache.d.ts:71

#### Parameters

##### config?

[`MutationCacheConfig`](../interfaces/MutationCacheConfig.md)

#### Returns

`MutationCache`

#### Overrides

```ts
Subscribable<MutationCacheListener>.constructor
```

## Properties

### config

```ts
config: MutationCacheConfig;
```

Defined in: packages/query-core/dist-ts/src/mutationCache.d.ts:70

***

### listeners

```ts
protected listeners: Set<MutationCacheListener>;
```

Defined in: packages/query-core/dist-ts/src/subscribable.d.ts:2

#### Inherited from

```ts
Subscribable.listeners
```

## Methods

### clear()

```ts
clear(): void;
```

Defined in: packages/query-core/dist-ts/src/mutationCache.d.ts:92

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
find<TData, TError, TVariables, TOnMutateResult>(filters): 
  | Mutation<TData, TError, TVariables, TOnMutateResult>
  | undefined;
```

Defined in: packages/query-core/dist-ts/src/mutationCache.d.ts:122

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

#### Returns

  \| [`Mutation`](Mutation.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>
  \| `undefined`

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
findAll(filters?): Mutation<unknown, Error, unknown, unknown>[];
```

Defined in: packages/query-core/dist-ts/src/mutationCache.d.ts:138

An even more advanced method that can be used to get existing mutation instances from the
cache that match the given filters. If no mutations match, an empty array is returned.

This is not typically needed for most applications, but can come in handy when needing more
information about mutations in rare scenarios.

#### Parameters

##### filters?

[`MutationFilters`](../interfaces/MutationFilters.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

#### Returns

[`Mutation`](Mutation.md)\<`unknown`, `Error`, `unknown`, `unknown`\>[]

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

Defined in: packages/query-core/dist-ts/src/mutationCache.d.ts:106

Returns all mutations within the cache.

This is not typically needed for most applications, but can come in handy when needing more
information about a mutation in rare scenarios.

#### Returns

[`Mutation`](Mutation.md)\<`unknown`, `Error`, `unknown`, `unknown`\>[]

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

Defined in: packages/query-core/dist-ts/src/subscribable.d.ts:5

#### Returns

`boolean`

#### Inherited from

```ts
Subscribable.hasListeners
```

***

### onSubscribe()

```ts
protected onSubscribe(): void;
```

Defined in: packages/query-core/dist-ts/src/subscribable.d.ts:6

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

Defined in: packages/query-core/dist-ts/src/subscribable.d.ts:7

#### Returns

`void`

#### Inherited from

```ts
Subscribable.onUnsubscribe
```

***

### subscribe()

```ts
subscribe(listener): () => void;
```

Defined in: packages/query-core/dist-ts/src/subscribable.d.ts:4

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
