---
id: QueryCache
title: QueryCache
---

# Class: QueryCache

Defined in: [packages/query-core/src/queryCache.ts:92](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L92)

## Extends

- `Subscribable`\<`QueryCacheListener`\>

## Constructors

### Constructor

```ts
new QueryCache(config): QueryCache;
```

Defined in: [packages/query-core/src/queryCache.ts:95](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L95)

#### Parameters

##### config

`QueryCacheConfig` = `{}`

#### Returns

`QueryCache`

#### Overrides

```ts
Subscribable<QueryCacheListener>.constructor
```

## Properties

### config

```ts
config: QueryCacheConfig = {};
```

Defined in: [packages/query-core/src/queryCache.ts:95](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L95)

***

### listeners

```ts
protected listeners: Set<QueryCacheListener>;
```

Defined in: [packages/query-core/src/subscribable.ts:2](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L2)

#### Inherited from

```ts
Subscribable.listeners
```

## Methods

### add()

```ts
add(query): void;
```

Defined in: [packages/query-core/src/queryCache.ts:133](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L133)

#### Parameters

##### query

[`Query`](Query.md)\<`any`, `any`, `any`, `any`\>

#### Returns

`void`

***

### build()

```ts
build<TQueryFnData, TError, TData, TQueryKey>(
   client, 
   options, 
state?): Query<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [packages/query-core/src/queryCache.ts:100](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L100)

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### client

[`QueryClient`](QueryClient.md)

##### options

[`WithRequired`](../type-aliases/WithRequired.md)\<[`QueryOptions`](../interfaces/QueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `never`\>, `"queryKey"`\>

##### state?

[`QueryState`](../interfaces/QueryState.md)\<`TData`, `TError`\>

#### Returns

[`Query`](Query.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

***

### clear()

```ts
clear(): void;
```

Defined in: [packages/query-core/src/queryCache.ts:158](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L158)

#### Returns

`void`

***

### find()

```ts
find<TQueryFnData, TError, TData>(filters): 
  | Query<TQueryFnData, TError, TData, readonly unknown[]>
  | undefined;
```

Defined in: [packages/query-core/src/queryCache.ts:183](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L183)

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

#### Parameters

##### filters

[`WithRequired`](../type-aliases/WithRequired.md)\<[`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>, `"queryKey"`\>

#### Returns

  \| [`Query`](Query.md)\<`TQueryFnData`, `TError`, `TData`, readonly `unknown`[]\>
  \| `undefined`

***

### findAll()

```ts
findAll(filters): Query<unknown, Error, unknown, readonly unknown[]>[];
```

Defined in: [packages/query-core/src/queryCache.ts:193](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L193)

#### Parameters

##### filters

[`QueryFilters`](../interfaces/QueryFilters.md)\<`any`\> = `{}`

#### Returns

[`Query`](Query.md)\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>[]

***

### get()

```ts
get<TQueryFnData, TError, TData, TQueryKey>(queryHash): 
  | Query<TQueryFnData, TError, TData, TQueryKey>
  | undefined;
```

Defined in: [packages/query-core/src/queryCache.ts:166](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L166)

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### queryHash

`string`

#### Returns

  \| [`Query`](Query.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>
  \| `undefined`

***

### getAll()

```ts
getAll(): Query<unknown, Error, unknown, readonly unknown[]>[];
```

Defined in: [packages/query-core/src/queryCache.ts:179](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L179)

#### Returns

[`Query`](Query.md)\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>[]

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

Defined in: [packages/query-core/src/queryCache.ts:200](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L200)

#### Parameters

##### event

[`QueryCacheNotifyEvent`](../type-aliases/QueryCacheNotifyEvent.md)

#### Returns

`void`

***

### onFocus()

```ts
onFocus(): void;
```

Defined in: [packages/query-core/src/queryCache.ts:208](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L208)

#### Returns

`void`

***

### onOnline()

```ts
onOnline(): void;
```

Defined in: [packages/query-core/src/queryCache.ts:216](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L216)

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
remove(query): void;
```

Defined in: [packages/query-core/src/queryCache.ts:144](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L144)

#### Parameters

##### query

[`Query`](Query.md)\<`any`, `any`, `any`, `any`\>

#### Returns

`void`

***

### subscribe()

```ts
subscribe(listener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:8](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L8)

#### Parameters

##### listener

`QueryCacheListener`

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
