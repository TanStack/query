---
id: QueryObserver
title: QueryObserver
---

# Class: QueryObserver\<TQueryFnData, TError, TData, TQueryData, TQueryKey\>

Defined in: [packages/query-core/src/queryObserver.ts:41](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L41)

## Extends

- `Subscribable`\<`QueryObserverListener`\<`TData`, `TError`\>\>

## Extended by

- [`InfiniteQueryObserver`](InfiniteQueryObserver.md)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](../type-aliases/QueryKey.md) = [`QueryKey`](../type-aliases/QueryKey.md)

## Constructors

### Constructor

```ts
new QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>(client, options): QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
```

Defined in: [packages/query-core/src/queryObserver.ts:72](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L72)

#### Parameters

##### client

[`QueryClient`](QueryClient.md)

##### options

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

`QueryObserver`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Overrides

```ts
Subscribable<QueryObserverListener<TData, TError>>.constructor
```

## Properties

### listeners

```ts
protected listeners: Set<QueryObserverListener<TData, TError>>;
```

Defined in: [packages/query-core/src/subscribable.ts:2](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L2)

#### Inherited from

```ts
Subscribable.listeners
```

***

### options

```ts
options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
```

Defined in: [packages/query-core/src/queryObserver.ts:74](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L74)

## Methods

### bindMethods()

```ts
protected bindMethods(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:92](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L92)

#### Returns

`void`

***

### createResult()

```ts
protected createResult(query, options): QueryObserverResult<TData, TError>;
```

Defined in: [packages/query-core/src/queryObserver.ts:430](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L430)

#### Parameters

##### query

[`Query`](Query.md)\<`TQueryFnData`, `TError`, `TQueryData`, `TQueryKey`\>

##### options

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>

***

### destroy()

```ts
destroy(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:132](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L132)

#### Returns

`void`

***

### fetch()

```ts
protected fetch(fetchOptions): Promise<QueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/queryObserver.ts:324](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L324)

#### Parameters

##### fetchOptions

`ObserverFetchOptions`

#### Returns

`Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\>

***

### fetchOptimistic()

```ts
fetchOptimistic(options): Promise<QueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/queryObserver.ts:306](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L306)

#### Parameters

##### options

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

`Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\>

***

### getCurrentQuery()

```ts
getCurrentQuery(): Query<TQueryFnData, TError, TQueryData, TQueryKey>;
```

Defined in: [packages/query-core/src/queryObserver.ts:294](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L294)

#### Returns

[`Query`](Query.md)\<`TQueryFnData`, `TError`, `TQueryData`, `TQueryKey`\>

***

### getCurrentResult()

```ts
getCurrentResult(): QueryObserverResult<TData, TError>;
```

Defined in: [packages/query-core/src/queryObserver.ts:260](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L260)

#### Returns

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>

***

### getOptimisticResult()

```ts
getOptimisticResult(options): QueryObserverResult<TData, TError>;
```

Defined in: [packages/query-core/src/queryObserver.ts:223](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L223)

#### Parameters

##### options

[`DefaultedQueryObserverOptions`](../type-aliases/DefaultedQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>

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

### onQueryUpdate()

```ts
onQueryUpdate(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:723](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L723)

#### Returns

`void`

***

### onSubscribe()

```ts
protected onSubscribe(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:96](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L96)

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

Defined in: [packages/query-core/src/queryObserver.ts:110](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L110)

#### Returns

`void`

#### Overrides

```ts
Subscribable.onUnsubscribe
```

***

### refetch()

```ts
refetch(__namedParameters): Promise<QueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/queryObserver.ts:298](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L298)

#### Parameters

##### \_\_namedParameters

[`RefetchOptions`](../interfaces/RefetchOptions.md) = `{}`

#### Returns

`Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\>

***

### setOptions()

```ts
setOptions(options): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:139](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L139)

#### Parameters

##### options

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

`void`

***

### shouldFetchOnReconnect()

```ts
shouldFetchOnReconnect(): boolean;
```

Defined in: [packages/query-core/src/queryObserver.ts:116](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L116)

#### Returns

`boolean`

***

### shouldFetchOnWindowFocus()

```ts
shouldFetchOnWindowFocus(): boolean;
```

Defined in: [packages/query-core/src/queryObserver.ts:124](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L124)

#### Returns

`boolean`

***

### subscribe()

```ts
subscribe(listener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:8](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L8)

#### Parameters

##### listener

`QueryObserverListener`

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

***

### trackProp()

```ts
trackProp(key): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:290](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L290)

#### Parameters

##### key

`"error"` | `"status"` | `"data"` | `"isError"` | `"isPending"` | `"isLoading"` | `"isLoadingError"` | `"isRefetchError"` | `"isSuccess"` | `"isPlaceholderData"` | `"dataUpdatedAt"` | `"errorUpdatedAt"` | `"failureCount"` | `"failureReason"` | `"errorUpdateCount"` | `"isFetched"` | `"isFetchedAfterMount"` | `"isFetching"` | `"isInitialLoading"` | `"isPaused"` | `"isRefetching"` | `"isStale"` | `"isEnabled"` | `"refetch"` | `"fetchStatus"` | `"promise"`

#### Returns

`void`

***

### trackResult()

```ts
trackResult(result, onPropTracked?): QueryObserverResult<TData, TError>;
```

Defined in: [packages/query-core/src/queryObserver.ts:264](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L264)

#### Parameters

##### result

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>

##### onPropTracked?

(`key`) => `void`

#### Returns

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>

***

### updateResult()

```ts
updateResult(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:646](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L646)

#### Returns

`void`
