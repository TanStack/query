---
id: InfiniteQueryObserverPlaceholderResult
title: InfiniteQueryObserverPlaceholderResult
---

# Interface: InfiniteQueryObserverPlaceholderResult\<TData, TError\>

Defined in: [packages/query-core/src/types.ts:1035](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1035)

## Extends

- [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md)\<`TData`, `TError`\>

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

### data

```ts
data: TData;
```

Defined in: [packages/query-core/src/types.ts:1039](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1039)

The last successfully resolved data for the query.

#### Overrides

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`data`](InfiniteQueryObserverBaseResult.md#data)

***

### dataUpdatedAt

```ts
dataUpdatedAt: number;
```

Defined in: [packages/query-core/src/types.ts:631](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L631)

The timestamp for when the query most recently returned the `status` as `"success"`.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`dataUpdatedAt`](InfiniteQueryObserverBaseResult.md#dataupdatedat)

***

### error

```ts
error: null;
```

Defined in: [packages/query-core/src/types.ts:1041](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1041)

The error object for the query, if an error was thrown.
- Defaults to `null`.

#### Overrides

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`error`](InfiniteQueryObserverBaseResult.md#error)

***

### errorUpdateCount

```ts
errorUpdateCount: number;
```

Defined in: [packages/query-core/src/types.ts:655](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L655)

The sum of all errors.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`errorUpdateCount`](InfiniteQueryObserverBaseResult.md#errorupdatecount)

***

### errorUpdatedAt

```ts
errorUpdatedAt: number;
```

Defined in: [packages/query-core/src/types.ts:640](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L640)

The timestamp for when the query most recently returned the `status` as `"error"`.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`errorUpdatedAt`](InfiniteQueryObserverBaseResult.md#errorupdatedat)

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

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`failureCount`](InfiniteQueryObserverBaseResult.md#failurecount)

***

### failureReason

```ts
failureReason: TError | null;
```

Defined in: [packages/query-core/src/types.ts:651](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L651)

The failure reason for the query retry.
- Reset to `null` when the query succeeds.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`failureReason`](InfiniteQueryObserverBaseResult.md#failurereason)

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

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`fetchNextPage`](InfiniteQueryObserverBaseResult.md#fetchnextpage)

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

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`fetchPreviousPage`](InfiniteQueryObserverBaseResult.md#fetchpreviouspage)

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

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`fetchStatus`](InfiniteQueryObserverBaseResult.md#fetchstatus)

***

### hasNextPage

```ts
hasNextPage: boolean;
```

Defined in: [packages/query-core/src/types.ts:925](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L925)

Will be `true` if there is a next page to be fetched (known via the `getNextPageParam` option).

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`hasNextPage`](InfiniteQueryObserverBaseResult.md#hasnextpage)

***

### hasPreviousPage

```ts
hasPreviousPage: boolean;
```

Defined in: [packages/query-core/src/types.ts:929](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L929)

Will be `true` if there is a previous page to be fetched (known via the `getPreviousPageParam` option).

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`hasPreviousPage`](InfiniteQueryObserverBaseResult.md#haspreviouspage)

***

### isEnabled

```ts
isEnabled: boolean;
```

Defined in: [packages/query-core/src/types.ts:723](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L723)

`true` if this observer is enabled, `false` otherwise.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isEnabled`](InfiniteQueryObserverBaseResult.md#isenabled)

***

### isError

```ts
isError: false;
```

Defined in: [packages/query-core/src/types.ts:1040](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1040)

A derived boolean from the `status` variable, provided for convenience.
- `true` if the query attempt resulted in an error.

#### Overrides

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isError`](InfiniteQueryObserverBaseResult.md#iserror)

***

### isFetched

```ts
isFetched: boolean;
```

Defined in: [packages/query-core/src/types.ts:664](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L664)

Will be `true` if the query has been fetched.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isFetched`](InfiniteQueryObserverBaseResult.md#isfetched)

***

### isFetchedAfterMount

```ts
isFetchedAfterMount: boolean;
```

Defined in: [packages/query-core/src/types.ts:669](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L669)

Will be `true` if the query has been fetched after the component mounted.
- This property can be used to not show any previously cached data.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isFetchedAfterMount`](InfiniteQueryObserverBaseResult.md#isfetchedaftermount)

***

### isFetching

```ts
isFetching: boolean;
```

Defined in: [packages/query-core/src/types.ts:674](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L674)

A derived boolean from the `fetchStatus` variable, provided for convenience.
- `true` whenever the `queryFn` is executing, which includes initial `pending` as well as background refetch.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isFetching`](InfiniteQueryObserverBaseResult.md#isfetching)

***

### isFetchingNextPage

```ts
isFetchingNextPage: boolean;
```

Defined in: [packages/query-core/src/types.ts:937](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L937)

Will be `true` while fetching the next page with `fetchNextPage`.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isFetchingNextPage`](InfiniteQueryObserverBaseResult.md#isfetchingnextpage)

***

### isFetchingPreviousPage

```ts
isFetchingPreviousPage: boolean;
```

Defined in: [packages/query-core/src/types.ts:945](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L945)

Will be `true` while fetching the previous page with `fetchPreviousPage`.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isFetchingPreviousPage`](InfiniteQueryObserverBaseResult.md#isfetchingpreviouspage)

***

### isFetchNextPageError

```ts
isFetchNextPageError: false;
```

Defined in: [packages/query-core/src/types.ts:1048](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1048)

Will be `true` if the query failed while fetching the next page.

#### Overrides

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isFetchNextPageError`](InfiniteQueryObserverBaseResult.md#isfetchnextpageerror)

***

### isFetchPreviousPageError

```ts
isFetchPreviousPageError: false;
```

Defined in: [packages/query-core/src/types.ts:1049](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1049)

Will be `true` if the query failed while fetching the previous page.

#### Overrides

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isFetchPreviousPageError`](InfiniteQueryObserverBaseResult.md#isfetchpreviouspageerror)

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

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isInitialLoading`](InfiniteQueryObserverBaseResult.md#isinitialloading)

***

### isLoading

```ts
isLoading: false;
```

Defined in: [packages/query-core/src/types.ts:1043](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1043)

Is `true` whenever the first fetch for a query is in-flight.
- Is the same as `isFetching && isPending`.

#### Overrides

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isLoading`](InfiniteQueryObserverBaseResult.md#isloading)

***

### isLoadingError

```ts
isLoadingError: false;
```

Defined in: [packages/query-core/src/types.ts:1044](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1044)

Will be `true` if the query failed while fetching for the first time.

#### Overrides

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isLoadingError`](InfiniteQueryObserverBaseResult.md#isloadingerror)

***

### isPaused

```ts
isPaused: boolean;
```

Defined in: [packages/query-core/src/types.ts:697](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L697)

A derived boolean from the `fetchStatus` variable, provided for convenience.
- The query wanted to fetch, but has been `paused`.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isPaused`](InfiniteQueryObserverBaseResult.md#ispaused)

***

### isPending

```ts
isPending: false;
```

Defined in: [packages/query-core/src/types.ts:1042](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1042)

Will be `pending` if there's no cached data and no query attempt was finished yet.

#### Overrides

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isPending`](InfiniteQueryObserverBaseResult.md#ispending)

***

### isPlaceholderData

```ts
isPlaceholderData: true;
```

Defined in: [packages/query-core/src/types.ts:1047](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1047)

Will be `true` if the data shown is the placeholder data.

#### Overrides

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isPlaceholderData`](InfiniteQueryObserverBaseResult.md#isplaceholderdata)

***

### isRefetchError

```ts
isRefetchError: false;
```

Defined in: [packages/query-core/src/types.ts:1045](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1045)

Will be `true` if the query failed while refetching.

#### Overrides

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isRefetchError`](InfiniteQueryObserverBaseResult.md#isrefetcherror)

***

### isRefetching

```ts
isRefetching: boolean;
```

Defined in: [packages/query-core/src/types.ts:710](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L710)

Is `true` whenever a background refetch is in-flight, which _does not_ include initial `pending`.
- Is the same as `isFetching && !isPending`.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isRefetching`](InfiniteQueryObserverBaseResult.md#isrefetching)

***

### isStale

```ts
isStale: boolean;
```

Defined in: [packages/query-core/src/types.ts:714](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L714)

Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`.

#### Inherited from

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isStale`](InfiniteQueryObserverBaseResult.md#isstale)

***

### isSuccess

```ts
isSuccess: true;
```

Defined in: [packages/query-core/src/types.ts:1046](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1046)

A derived boolean from the `status` variable, provided for convenience.
- `true` if the query has received a response with no errors and is ready to display its data.

#### Overrides

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isSuccess`](InfiniteQueryObserverBaseResult.md#issuccess)

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

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`promise`](InfiniteQueryObserverBaseResult.md#promise)

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

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`refetch`](InfiniteQueryObserverBaseResult.md#refetch)

***

### status

```ts
status: "success";
```

Defined in: [packages/query-core/src/types.ts:1050](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1050)

The status of the query.
- Will be:
  - `pending` if there's no cached data and no query attempt was finished yet.
  - `error` if the query attempt resulted in an error.
  - `success` if the query has received a response with no errors and is ready to display its data.

#### Overrides

[`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`status`](InfiniteQueryObserverBaseResult.md#status)
