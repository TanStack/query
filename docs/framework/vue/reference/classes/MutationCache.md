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
new MutationCache(config): MutationCache;
```

Defined in: [packages/query-core/src/mutationCache.ts:129](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L129)

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

Defined in: [packages/query-core/src/mutationCache.ts:129](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L129)

#### Inherited from

```ts
MC.config
```

***

### listeners

```ts
protected listeners: Set<MutationCacheListener>;
```

Defined in: [packages/query-core/src/subscribable.ts:2](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L2)

#### Inherited from

```ts
MC.listeners
```

## Methods

### clear()

```ts
clear(): void;
```

Defined in: [packages/query-core/src/mutationCache.ts:236](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L236)

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
find<TData, TError, TVariables, TOnMutateResult>(filters): 
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

`MaybeRefDeep`\<`MutationFilters`\<`unknown`, `Error`, `unknown`, `unknown`\>\>

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

#### Overrides

```ts
MC.find
```

***

### findAll()

```ts
findAll(filters): Mutation<unknown, Error, unknown, unknown>[];
```

Defined in: [packages/vue-query/src/mutationCache.ts:27](https://github.com/TanStack/query/blob/main/packages/vue-query/src/mutationCache.ts#L27)

An even more advanced method that can be used to get existing mutation instances from the
cache that match the given filters. If no mutations match, an empty array is returned.

This is not typically needed for most applications, but can come in handy when needing more
information about mutations in rare scenarios.

#### Parameters

##### filters

`MaybeRefDeep`\<`MutationFilters`\<`unknown`, `Error`, `unknown`, `unknown`\>\> = `{}`

#### Returns

[`Mutation`](Mutation.md)\<`unknown`, `Error`, `unknown`, `unknown`\>[]

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

Defined in: [packages/query-core/src/mutationCache.ts:259](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L259)

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

#### Inherited from

```ts
MC.getAll
```

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
MC.hasListeners
```

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
MC.onSubscribe
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
MC.onUnsubscribe
```

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
MC.subscribe
```
