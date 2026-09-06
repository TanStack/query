---
id: QueryObserverBaseResult
title: QueryObserverBaseResult
---

Defined in: [packages/query-core/src/types.ts:743](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L743)

## Extended by

- [`QueryObserverPendingResult`](QueryObserverPendingResult.md)
- [`QueryObserverLoadingResult`](QueryObserverLoadingResult.md)
- [`QueryObserverLoadingErrorResult`](QueryObserverLoadingErrorResult.md)
- [`QueryObserverRefetchErrorResult`](QueryObserverRefetchErrorResult.md)
- [`QueryObserverSuccessResult`](QueryObserverSuccessResult.md)
- [`QueryObserverPlaceholderResult`](QueryObserverPlaceholderResult.md)
- [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

### data

```ts
data: TData | undefined;
```

Defined in: [packages/query-core/src/types.ts:750](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L750)

The last successfully resolved data for the query.

***

### dataUpdatedAt

```ts
dataUpdatedAt: number;
```

Defined in: [packages/query-core/src/types.ts:754](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L754)

The timestamp for when the query most recently returned the `status` as `"success"`.

***

### error

```ts
error: TError | null;
```

Defined in: [packages/query-core/src/types.ts:759](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L759)

The error object for the query, if an error was thrown.
- Defaults to `null`.

***

### errorUpdateCount

```ts
errorUpdateCount: number;
```

Defined in: [packages/query-core/src/types.ts:778](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L778)

The sum of all errors.

***

### errorUpdatedAt

```ts
errorUpdatedAt: number;
```

Defined in: [packages/query-core/src/types.ts:763](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L763)

The timestamp for when the query most recently returned the `status` as `"error"`.

***

### failureCount

```ts
failureCount: number;
```

Defined in: [packages/query-core/src/types.ts:769](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L769)

The failure count for the query.
- Incremented every time the query fails.
- Reset to `0` when the query succeeds.

***

### failureReason

```ts
failureReason: TError | null;
```

Defined in: [packages/query-core/src/types.ts:774](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L774)

The failure reason for the query retry.
- Reset to `null` when the query succeeds.

***

### fetchStatus

```ts
fetchStatus: FetchStatus;
```

Defined in: [packages/query-core/src/types.ts:868](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L868)

The fetch status of the query.
- `fetching`: Is `true` whenever the queryFn is executing, which includes initial `pending` as well as background refetch.
- `paused`: The query wanted to fetch, but has been `paused`.
- `idle`: The query is not fetching.
- See [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information.

***

### isEnabled

```ts
isEnabled: boolean;
```

Defined in: [packages/query-core/src/types.ts:846](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L846)

`true` if this observer is enabled, `false` otherwise.

***

### isError

```ts
isError: boolean;
```

Defined in: [packages/query-core/src/types.ts:783](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L783)

A derived boolean from the `status` variable, provided for convenience.
- `true` if the query attempt resulted in an error.

***

### isFetched

```ts
isFetched: boolean;
```

Defined in: [packages/query-core/src/types.ts:787](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L787)

Will be `true` if the query has been fetched.

***

### isFetchedAfterMount

```ts
isFetchedAfterMount: boolean;
```

Defined in: [packages/query-core/src/types.ts:792](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L792)

Will be `true` if the query has been fetched after the component mounted.
- This property can be used to not show any previously cached data.

***

### isFetching

```ts
isFetching: boolean;
```

Defined in: [packages/query-core/src/types.ts:797](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L797)

A derived boolean from the `fetchStatus` variable, provided for convenience.
- `true` whenever the `queryFn` is executing, which includes initial `pending` as well as background refetch.

***

### ~~isInitialLoading~~

```ts
isInitialLoading: boolean;
```

Defined in: [packages/query-core/src/types.ts:815](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L815)

#### Deprecated

`isInitialLoading` is being deprecated in favor of `isLoading`
and will be removed in the next major version.

***

### isLoading

```ts
isLoading: boolean;
```

Defined in: [packages/query-core/src/types.ts:802](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L802)

Is `true` whenever the first fetch for a query is in-flight.
- Is the same as `isFetching && isPending`.

***

### isLoadingError

```ts
isLoadingError: boolean;
```

Defined in: [packages/query-core/src/types.ts:810](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L810)

Will be `true` if the query failed while fetching for the first time.

***

### isPaused

```ts
isPaused: boolean;
```

Defined in: [packages/query-core/src/types.ts:820](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L820)

A derived boolean from the `fetchStatus` variable, provided for convenience.
- The query wanted to fetch, but has been `paused`.

***

### isPending

```ts
isPending: boolean;
```

Defined in: [packages/query-core/src/types.ts:806](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L806)

Will be `pending` if there's no cached data and no query attempt was finished yet.

***

### isPlaceholderData

```ts
isPlaceholderData: boolean;
```

Defined in: [packages/query-core/src/types.ts:824](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L824)

Will be `true` if the data shown is the placeholder data.

***

### isRefetchError

```ts
isRefetchError: boolean;
```

Defined in: [packages/query-core/src/types.ts:828](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L828)

Will be `true` if the query failed while refetching.

***

### isRefetching

```ts
isRefetching: boolean;
```

Defined in: [packages/query-core/src/types.ts:833](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L833)

Is `true` whenever a background refetch is in-flight, which _does not_ include initial `pending`.
- Is the same as `isFetching && !isPending`.

***

### isStale

```ts
isStale: boolean;
```

Defined in: [packages/query-core/src/types.ts:837](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L837)

Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`.

***

### isSuccess

```ts
isSuccess: boolean;
```

Defined in: [packages/query-core/src/types.ts:842](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L842)

A derived boolean from the `status` variable, provided for convenience.
- `true` if the query has received a response with no errors and is ready to display its data.

***

### refetch()

```ts
refetch: (options?) => Promise<QueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/types.ts:850](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L850)

A function to manually refetch the query.

#### Parameters

##### options?

[`RefetchOptions`](RefetchOptions.md)

#### Returns

`Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\>

***

### status

```ts
status: QueryStatus;
```

Defined in: [packages/query-core/src/types.ts:860](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L860)

The status of the query.
- Will be:
  - `pending` if there's no cached data and no query attempt was finished yet.
  - `error` if the query attempt resulted in an error.
  - `success` if the query has received a response with no errors and is ready to display its data.
