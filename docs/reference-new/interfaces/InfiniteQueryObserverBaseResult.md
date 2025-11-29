---
id: InfiniteQueryObserverBaseResult
title: InfiniteQueryObserverBaseResult
---

# Interface: InfiniteQueryObserverBaseResult\<TData, TError\>

Defined in: [packages/query-core/src/types.ts:906](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L906)

## Extends

- [`QueryObserverBaseResult`](QueryObserverBaseResult.md)\<`TData`, `TError`\>

## Extended by

- [`InfiniteQueryObserverPendingResult`](InfiniteQueryObserverPendingResult.md)
- [`InfiniteQueryObserverLoadingResult`](InfiniteQueryObserverLoadingResult.md)
- [`InfiniteQueryObserverLoadingErrorResult`](InfiniteQueryObserverLoadingErrorResult.md)
- [`InfiniteQueryObserverRefetchErrorResult`](InfiniteQueryObserverRefetchErrorResult.md)
- [`InfiniteQueryObserverSuccessResult`](InfiniteQueryObserverSuccessResult.md)
- [`InfiniteQueryObserverPlaceholderResult`](InfiniteQueryObserverPlaceholderResult.md)

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

Defined in: [packages/query-core/src/types.ts:627](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L627)

The last successfully resolved data for the query.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`data`](QueryObserverBaseResult.md#data)

***

### dataUpdatedAt

```ts
dataUpdatedAt: number;
```

Defined in: [packages/query-core/src/types.ts:631](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L631)

The timestamp for when the query most recently returned the `status` as `"success"`.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`dataUpdatedAt`](QueryObserverBaseResult.md#dataupdatedat)

***

### error

```ts
error: TError | null;
```

Defined in: [packages/query-core/src/types.ts:636](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L636)

The error object for the query, if an error was thrown.
- Defaults to `null`.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`error`](QueryObserverBaseResult.md#error)

***

### errorUpdateCount

```ts
errorUpdateCount: number;
```

Defined in: [packages/query-core/src/types.ts:655](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L655)

The sum of all errors.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`errorUpdateCount`](QueryObserverBaseResult.md#errorupdatecount)

***

### errorUpdatedAt

```ts
errorUpdatedAt: number;
```

Defined in: [packages/query-core/src/types.ts:640](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L640)

The timestamp for when the query most recently returned the `status` as `"error"`.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`errorUpdatedAt`](QueryObserverBaseResult.md#errorupdatedat)

***

### failureCount

```ts
failureCount: number;
```

Defined in: [packages/query-core/src/types.ts:646](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L646)

The failure count for the query.
- Incremented every time the query fails.
- Reset to `0` when the query succeeds.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`failureCount`](QueryObserverBaseResult.md#failurecount)

***

### failureReason

```ts
failureReason: TError | null;
```

Defined in: [packages/query-core/src/types.ts:651](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L651)

The failure reason for the query retry.
- Reset to `null` when the query succeeds.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`failureReason`](QueryObserverBaseResult.md#failurereason)

***

### fetchNextPage()

```ts
fetchNextPage: (options?) => Promise<InfiniteQueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/types.ts:913](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L913)

This function allows you to fetch the next "page" of results.

#### Parameters

##### options?

[`FetchNextPageOptions`](FetchNextPageOptions.md)

#### Returns

`Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\>

***

### fetchPreviousPage()

```ts
fetchPreviousPage: (options?) => Promise<InfiniteQueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/types.ts:919](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L919)

This function allows you to fetch the previous "page" of results.

#### Parameters

##### options?

[`FetchPreviousPageOptions`](FetchPreviousPageOptions.md)

#### Returns

`Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\>

***

### fetchStatus

```ts
fetchStatus: FetchStatus;
```

Defined in: [packages/query-core/src/types.ts:745](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L745)

The fetch status of the query.
- `fetching`: Is `true` whenever the queryFn is executing, which includes initial `pending` as well as background refetch.
- `paused`: The query wanted to fetch, but has been `paused`.
- `idle`: The query is not fetching.
- See [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`fetchStatus`](QueryObserverBaseResult.md#fetchstatus)

***

### hasNextPage

```ts
hasNextPage: boolean;
```

Defined in: [packages/query-core/src/types.ts:925](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L925)

Will be `true` if there is a next page to be fetched (known via the `getNextPageParam` option).

***

### hasPreviousPage

```ts
hasPreviousPage: boolean;
```

Defined in: [packages/query-core/src/types.ts:929](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L929)

Will be `true` if there is a previous page to be fetched (known via the `getPreviousPageParam` option).

***

### isEnabled

```ts
isEnabled: boolean;
```

Defined in: [packages/query-core/src/types.ts:723](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L723)

`true` if this observer is enabled, `false` otherwise.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isEnabled`](QueryObserverBaseResult.md#isenabled)

***

### isError

```ts
isError: boolean;
```

Defined in: [packages/query-core/src/types.ts:660](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L660)

A derived boolean from the `status` variable, provided for convenience.
- `true` if the query attempt resulted in an error.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isError`](QueryObserverBaseResult.md#iserror)

***

### isFetched

```ts
isFetched: boolean;
```

Defined in: [packages/query-core/src/types.ts:664](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L664)

Will be `true` if the query has been fetched.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isFetched`](QueryObserverBaseResult.md#isfetched)

***

### isFetchedAfterMount

```ts
isFetchedAfterMount: boolean;
```

Defined in: [packages/query-core/src/types.ts:669](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L669)

Will be `true` if the query has been fetched after the component mounted.
- This property can be used to not show any previously cached data.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isFetchedAfterMount`](QueryObserverBaseResult.md#isfetchedaftermount)

***

### isFetching

```ts
isFetching: boolean;
```

Defined in: [packages/query-core/src/types.ts:674](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L674)

A derived boolean from the `fetchStatus` variable, provided for convenience.
- `true` whenever the `queryFn` is executing, which includes initial `pending` as well as background refetch.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isFetching`](QueryObserverBaseResult.md#isfetching)

***

### isFetchingNextPage

```ts
isFetchingNextPage: boolean;
```

Defined in: [packages/query-core/src/types.ts:937](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L937)

Will be `true` while fetching the next page with `fetchNextPage`.

***

### isFetchingPreviousPage

```ts
isFetchingPreviousPage: boolean;
```

Defined in: [packages/query-core/src/types.ts:945](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L945)

Will be `true` while fetching the previous page with `fetchPreviousPage`.

***

### isFetchNextPageError

```ts
isFetchNextPageError: boolean;
```

Defined in: [packages/query-core/src/types.ts:933](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L933)

Will be `true` if the query failed while fetching the next page.

***

### isFetchPreviousPageError

```ts
isFetchPreviousPageError: boolean;
```

Defined in: [packages/query-core/src/types.ts:941](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L941)

Will be `true` if the query failed while fetching the previous page.

***

### ~~isInitialLoading~~

```ts
isInitialLoading: boolean;
```

Defined in: [packages/query-core/src/types.ts:692](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L692)

#### Deprecated

`isInitialLoading` is being deprecated in favor of `isLoading`
and will be removed in the next major version.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isInitialLoading`](QueryObserverBaseResult.md#isinitialloading)

***

### isLoading

```ts
isLoading: boolean;
```

Defined in: [packages/query-core/src/types.ts:679](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L679)

Is `true` whenever the first fetch for a query is in-flight.
- Is the same as `isFetching && isPending`.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isLoading`](QueryObserverBaseResult.md#isloading)

***

### isLoadingError

```ts
isLoadingError: boolean;
```

Defined in: [packages/query-core/src/types.ts:687](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L687)

Will be `true` if the query failed while fetching for the first time.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isLoadingError`](QueryObserverBaseResult.md#isloadingerror)

***

### isPaused

```ts
isPaused: boolean;
```

Defined in: [packages/query-core/src/types.ts:697](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L697)

A derived boolean from the `fetchStatus` variable, provided for convenience.
- The query wanted to fetch, but has been `paused`.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isPaused`](QueryObserverBaseResult.md#ispaused)

***

### isPending

```ts
isPending: boolean;
```

Defined in: [packages/query-core/src/types.ts:683](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L683)

Will be `pending` if there's no cached data and no query attempt was finished yet.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isPending`](QueryObserverBaseResult.md#ispending)

***

### isPlaceholderData

```ts
isPlaceholderData: boolean;
```

Defined in: [packages/query-core/src/types.ts:701](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L701)

Will be `true` if the data shown is the placeholder data.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isPlaceholderData`](QueryObserverBaseResult.md#isplaceholderdata)

***

### isRefetchError

```ts
isRefetchError: boolean;
```

Defined in: [packages/query-core/src/types.ts:705](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L705)

Will be `true` if the query failed while refetching.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isRefetchError`](QueryObserverBaseResult.md#isrefetcherror)

***

### isRefetching

```ts
isRefetching: boolean;
```

Defined in: [packages/query-core/src/types.ts:710](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L710)

Is `true` whenever a background refetch is in-flight, which _does not_ include initial `pending`.
- Is the same as `isFetching && !isPending`.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isRefetching`](QueryObserverBaseResult.md#isrefetching)

***

### isStale

```ts
isStale: boolean;
```

Defined in: [packages/query-core/src/types.ts:714](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L714)

Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isStale`](QueryObserverBaseResult.md#isstale)

***

### isSuccess

```ts
isSuccess: boolean;
```

Defined in: [packages/query-core/src/types.ts:719](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L719)

A derived boolean from the `status` variable, provided for convenience.
- `true` if the query has received a response with no errors and is ready to display its data.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isSuccess`](QueryObserverBaseResult.md#issuccess)

***

### promise

```ts
promise: Promise<TData>;
```

Defined in: [packages/query-core/src/types.ts:794](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L794)

A stable promise that will be resolved with the data of the query.
Requires the `experimental_prefetchInRender` feature flag to be enabled.

#### Example

### Enabling the feature flag
```ts
const client = new QueryClient({
  defaultOptions: {
    queries: {
      experimental_prefetchInRender: true,
    },
  },
})
```

### Usage
```tsx
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { fetchTodos, type Todo } from './api'

function TodoList({ query }: { query: UseQueryResult<Todo[], Error> }) {
  const data = React.use(query.promise)

  return (
    <ul>
      {data.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}

export function App() {
  const query = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

  return (
    <>
      <h1>Todos</h1>
      <React.Suspense fallback={<div>Loading...</div>}>
        <TodoList query={query} />
      </React.Suspense>
    </>
  )
}
```

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`promise`](QueryObserverBaseResult.md#promise)

***

### refetch()

```ts
refetch: (options?) => Promise<QueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/types.ts:727](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L727)

A function to manually refetch the query.

#### Parameters

##### options?

[`RefetchOptions`](RefetchOptions.md)

#### Returns

`Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\>

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`refetch`](QueryObserverBaseResult.md#refetch)

***

### status

```ts
status: QueryStatus;
```

Defined in: [packages/query-core/src/types.ts:737](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L737)

The status of the query.
- Will be:
  - `pending` if there's no cached data and no query attempt was finished yet.
  - `error` if the query attempt resulted in an error.
  - `success` if the query has received a response with no errors and is ready to display its data.

#### Inherited from

[`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`status`](QueryObserverBaseResult.md#status)
