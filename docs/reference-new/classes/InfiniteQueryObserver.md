---
id: InfiniteQueryObserver
title: InfiniteQueryObserver
---

# Class: InfiniteQueryObserver\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

Defined in: [packages/query-core/src/infiniteQueryObserver.ts:49](https://github.com/TanStack/query/blob/main/packages/query-core/src/infiniteQueryObserver.ts#L49)

The `InfiniteQueryObserver` can be used to observe and switch between infinite queries.

```tsx
const observer = new InfiniteQueryObserver(queryClient, {
  queryKey: ['posts'],
  queryFn: fetchPosts,
  getNextPageParam: (lastPage, allPages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, allPages) => firstPage.prevCursor,
})

const unsubscribe = observer.subscribe((result) => {
  console.log(result)
  unsubscribe()
})
```

**Options**

The options for the `InfiniteQueryObserver` are exactly the same as those of [`useInfiniteQuery`](../../framework/react/reference/useInfiniteQuery).

## Extends

- [`QueryObserver`](QueryObserver.md)\<`TQueryFnData`, `TError`, `TData`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](../type-aliases/QueryKey.md) = [`QueryKey`](../type-aliases/QueryKey.md)

### TPageParam

`TPageParam` = `unknown`

## Constructors

### Constructor

```ts
new InfiniteQueryObserver<TQueryFnData, TError, TData, TQueryKey, TPageParam>(client, options): InfiniteQueryObserver<TQueryFnData, TError, TData, TQueryKey, TPageParam>;
```

Defined in: [packages/query-core/src/infiniteQueryObserver.ts:91](https://github.com/TanStack/query/blob/main/packages/query-core/src/infiniteQueryObserver.ts#L91)

#### Parameters

##### client

[`QueryClient`](QueryClient.md)

##### options

[`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`InfiniteQueryObserver`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Overrides

[`QueryObserver`](QueryObserver.md).[`constructor`](QueryObserver.md#constructor)

## Properties

### fetch

```ts
protected fetch: ReplaceReturnType<(fetchOptions) => Promise<QueryObserverResult<TData, TError>>, Promise<InfiniteQueryObserverResult<TData, TError>>>;
```

Defined in: [packages/query-core/src/infiniteQueryObserver.ts:80](https://github.com/TanStack/query/blob/main/packages/query-core/src/infiniteQueryObserver.ts#L80)

#### Overrides

```ts
QueryObserver.fetch
```

***

### getCurrentResult

```ts
getCurrentResult: ReplaceReturnType<() => QueryObserverResult<TData, TError>, InfiniteQueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/infiniteQueryObserver.ts:68](https://github.com/TanStack/query/blob/main/packages/query-core/src/infiniteQueryObserver.ts#L68)

#### Overrides

```ts
QueryObserver.getCurrentResult
```

***

### listeners

```ts
protected listeners: Set<QueryObserverListener<TData, TError>>;
```

Defined in: [packages/query-core/src/subscribable.ts:2](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L2)

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`listeners`](QueryObserver.md#listeners)

***

### options

```ts
options: QueryObserverOptions<TQueryFnData, TError, TData, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/queryObserver.ts:74](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L74)

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`options`](QueryObserver.md#options)

***

### subscribe()

```ts
subscribe: (listener) => () => void;
```

Defined in: [packages/query-core/src/infiniteQueryObserver.ts:63](https://github.com/TanStack/query/blob/main/packages/query-core/src/infiniteQueryObserver.ts#L63)

#### Parameters

##### listener

`InfiniteQueryObserverListener`

#### Returns

```ts
(): void;
```

##### Returns

`void`

#### Overrides

```ts
QueryObserver.subscribe
```

## Methods

### bindMethods()

```ts
protected bindMethods(): void;
```

Defined in: [packages/query-core/src/infiniteQueryObserver.ts:104](https://github.com/TanStack/query/blob/main/packages/query-core/src/infiniteQueryObserver.ts#L104)

#### Returns

`void`

#### Overrides

[`QueryObserver`](QueryObserver.md).[`bindMethods`](QueryObserver.md#bindmethods)

***

### createResult()

```ts
protected createResult(query, options): InfiniteQueryObserverResult<TData, TError>;
```

Defined in: [packages/query-core/src/infiniteQueryObserver.ts:163](https://github.com/TanStack/query/blob/main/packages/query-core/src/infiniteQueryObserver.ts#L163)

#### Parameters

##### query

[`Query`](Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>

##### options

[`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>

#### Overrides

[`QueryObserver`](QueryObserver.md).[`createResult`](QueryObserver.md#createresult)

***

### destroy()

```ts
destroy(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:132](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L132)

#### Returns

`void`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`destroy`](QueryObserver.md#destroy)

***

### fetchNextPage()

```ts
fetchNextPage(options?): Promise<InfiniteQueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/infiniteQueryObserver.ts:141](https://github.com/TanStack/query/blob/main/packages/query-core/src/infiniteQueryObserver.ts#L141)

#### Parameters

##### options?

[`FetchNextPageOptions`](../interfaces/FetchNextPageOptions.md)

#### Returns

`Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\>

***

### fetchOptimistic()

```ts
fetchOptimistic(options): Promise<QueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/queryObserver.ts:306](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L306)

#### Parameters

##### options

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>

#### Returns

`Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\>

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`fetchOptimistic`](QueryObserver.md#fetchoptimistic)

***

### fetchPreviousPage()

```ts
fetchPreviousPage(options?): Promise<InfiniteQueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/infiniteQueryObserver.ts:152](https://github.com/TanStack/query/blob/main/packages/query-core/src/infiniteQueryObserver.ts#L152)

#### Parameters

##### options?

[`FetchPreviousPageOptions`](../interfaces/FetchPreviousPageOptions.md)

#### Returns

`Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\>

***

### getCurrentQuery()

```ts
getCurrentQuery(): Query<TQueryFnData, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/queryObserver.ts:294](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L294)

#### Returns

[`Query`](Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`getCurrentQuery`](QueryObserver.md#getcurrentquery)

***

### getOptimisticResult()

```ts
getOptimisticResult(options): InfiniteQueryObserverResult<TData, TError>;
```

Defined in: [packages/query-core/src/infiniteQueryObserver.ts:125](https://github.com/TanStack/query/blob/main/packages/query-core/src/infiniteQueryObserver.ts#L125)

#### Parameters

##### options

[`DefaultedInfiniteQueryObserverOptions`](../type-aliases/DefaultedInfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>

#### Overrides

[`QueryObserver`](QueryObserver.md).[`getOptimisticResult`](QueryObserver.md#getoptimisticresult)

***

### hasListeners()

```ts
hasListeners(): boolean;
```

Defined in: [packages/query-core/src/subscribable.ts:19](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L19)

#### Returns

`boolean`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`hasListeners`](QueryObserver.md#haslisteners)

***

### onQueryUpdate()

```ts
onQueryUpdate(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:723](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L723)

#### Returns

`void`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`onQueryUpdate`](QueryObserver.md#onqueryupdate)

***

### onSubscribe()

```ts
protected onSubscribe(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:96](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L96)

#### Returns

`void`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`onSubscribe`](QueryObserver.md#onsubscribe)

***

### onUnsubscribe()

```ts
protected onUnsubscribe(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:110](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L110)

#### Returns

`void`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`onUnsubscribe`](QueryObserver.md#onunsubscribe)

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

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`refetch`](QueryObserver.md#refetch)

***

### setOptions()

```ts
setOptions(options): void;
```

Defined in: [packages/query-core/src/infiniteQueryObserver.ts:110](https://github.com/TanStack/query/blob/main/packages/query-core/src/infiniteQueryObserver.ts#L110)

#### Parameters

##### options

[`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`void`

#### Overrides

[`QueryObserver`](QueryObserver.md).[`setOptions`](QueryObserver.md#setoptions)

***

### shouldFetchOnReconnect()

```ts
shouldFetchOnReconnect(): boolean;
```

Defined in: [packages/query-core/src/queryObserver.ts:116](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L116)

#### Returns

`boolean`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`shouldFetchOnReconnect`](QueryObserver.md#shouldfetchonreconnect)

***

### shouldFetchOnWindowFocus()

```ts
shouldFetchOnWindowFocus(): boolean;
```

Defined in: [packages/query-core/src/queryObserver.ts:124](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L124)

#### Returns

`boolean`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`shouldFetchOnWindowFocus`](QueryObserver.md#shouldfetchonwindowfocus)

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

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`trackProp`](QueryObserver.md#trackprop)

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

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`trackResult`](QueryObserver.md#trackresult)

***

### updateResult()

```ts
updateResult(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:646](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L646)

#### Returns

`void`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`updateResult`](QueryObserver.md#updateresult)
