---
id: QueryClient
title: QueryClient
---

Defined in: [packages/query-core/src/queryClient.ts:79](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L79)

`QueryClient` is used to interact with a cache of queries and mutations. It owns a
`QueryCache` and a `MutationCache` (creating default ones if none are passed in) and holds
the default options that are applied to queries and mutations created through it.

## Example

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
})

await queryClient.query({ queryKey: ['posts'], queryFn: fetchPosts })
```

## Constructors

### Constructor

```ts
new QueryClient(config): QueryClient;
```

Defined in: [packages/query-core/src/queryClient.ts:89](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L89)

#### Parameters

##### config

[`QueryClientConfig`](../interfaces/QueryClientConfig.md) = `{}`

#### Returns

`QueryClient`

## Methods

### cancelQueries()

```ts
cancelQueries<TTaggedQueryKey>(filters?, cancelOptions?): Promise<void>;
```

Defined in: [packages/query-core/src/queryClient.ts:432](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L432)

Cancels outgoing fetches for queries matching the given filters. Most useful when performing
optimistic updates, since any outgoing refetch that resolves afterwards would otherwise
overwrite the optimistic update. By default (`revert: true`), a cancelled query's data is
reverted to its state before the outgoing fetch started.

The returned promise never rejects, even if individual cancellations fail.

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

[`QueryFilters`](../interfaces/QueryFilters.md)\<`TTaggedQueryKey`\>

##### cancelOptions?

[`CancelOptions`](../interfaces/CancelOptions.md) = `{}`

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await queryClient.cancelQueries({ queryKey: ['posts'], exact: true })
```

***

### clear()

```ts
clear(): void;
```

Defined in: [packages/query-core/src/queryClient.ts:1083](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L1083)

Clears both the query cache and the mutation cache this client is connected to.

#### Returns

`void`

#### Example

```ts
import { QueryClient } from '@tanstack/query-core'

const queryClient = new QueryClient()
queryClient.clear()
```

***

### defaultMutationOptions()

```ts
defaultMutationOptions<T>(options?): T;
```

Defined in: [packages/query-core/src/queryClient.ts:1057](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L1057)

The mutation counterpart of [QueryClient#defaultQueryOptions](#defaultqueryoptions). Called by framework
adapters (e.g. inside `useMutation`) to merge `queryClient.setMutationDefaults` for the
given `mutationKey`, then the client's `defaultOptions.mutations`, then the caller's options
on top. A no-op if the options are already defaulted (`_defaulted: true`).

#### Type Parameters

##### T

`T` *extends* [`MutationOptions`](../interfaces/MutationOptions.md)\<`any`, `any`, `any`, `any`\>

#### Parameters

##### options?

`T`

#### Returns

`T`

***

### defaultQueryOptions()

```ts
defaultQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam>(options): DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
```

Defined in: [packages/query-core/src/queryClient.ts:970](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L970)

Called by framework adapters (e.g. inside `useQuery`) to resolve the options passed by the
caller into their final, defaulted form: merging `queryClient.setQueryDefaults` for the
given `queryKey`, then the client's own `defaultOptions.queries`, then the caller's options
on top. A no-op if the options are already defaulted (`_defaulted: true`).

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryData

`TQueryData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `never`

#### Parameters

##### options

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`, `TPageParam`\> | [`DefaultedQueryObserverOptions`](../type-aliases/DefaultedQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

[`DefaultedQueryObserverOptions`](../type-aliases/DefaultedQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

***

### ~~ensureInfiniteQueryData()~~

```ts
ensureInfiniteQueryData<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<InfiniteData<TData, TPageParam>>;
```

Defined in: [packages/query-core/src/queryClient.ts:735](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L735)

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `unknown`

#### Parameters

##### options

[`EnsureInfiniteQueryDataOptions`](../type-aliases/EnsureInfiniteQueryDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`Promise`\<[`InfiniteData`](../interfaces/InfiniteData.md)\<`TData`, `TPageParam`\>\>

#### Deprecated

Use queryClient.infiniteQuery({ ...options, staleTime: 'static' }) instead. This method will be removed in the next major version.

***

### ~~ensureQueryData()~~

```ts
ensureQueryData<TQueryFnData, TError, TData, TQueryKey>(options): Promise<TData>;
```

Defined in: [packages/query-core/src/queryClient.ts:197](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L197)

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### options

[`EnsureQueryDataOptions`](../interfaces/EnsureQueryDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

#### Returns

`Promise`\<`TData`\>

#### Deprecated

Use queryClient.query({ ...options, staleTime: 'static' }) instead. This method will be removed in the next major version.

***

### ~~fetchInfiniteQuery()~~

```ts
fetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<InfiniteData<TData, TPageParam>>;
```

Defined in: [packages/query-core/src/queryClient.ts:692](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L692)

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `unknown`

#### Parameters

##### options

[`FetchInfiniteQueryOptions`](../type-aliases/FetchInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`Promise`\<[`InfiniteData`](../interfaces/InfiniteData.md)\<`TData`, `TPageParam`\>\>

#### Deprecated

Use queryClient.infiniteQuery(options) instead. This method will be removed in the next major version.

***

### ~~fetchQuery()~~

```ts
fetchQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<TData>;
```

Defined in: [packages/query-core/src/queryClient.ts:600](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L600)

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `never`

#### Parameters

##### options

[`FetchQueryOptions`](../interfaces/FetchQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`Promise`\<`TData`\>

#### Deprecated

Use queryClient.query(options) instead. This method will be removed in the next major version.

***

### getDefaultOptions()

```ts
getDefaultOptions(): DefaultOptions;
```

Defined in: [packages/query-core/src/queryClient.ts:818](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L818)

Returns the default options that were set when creating the client, or via
[QueryClient#setDefaultOptions](#setdefaultoptions).

#### Returns

[`DefaultOptions`](../interfaces/DefaultOptions.md)

#### Example

```ts
import { QueryClient } from '@tanstack/query-core'

const queryClient = new QueryClient()
const defaultOptions = queryClient.getDefaultOptions()
```

***

### getMutationCache()

```ts
getMutationCache(): MutationCache;
```

Defined in: [packages/query-core/src/queryClient.ts:802](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L802)

Returns the mutation cache this client is connected to.

#### Returns

[`MutationCache`](MutationCache.md)

#### Example

```ts
import { QueryClient } from '@tanstack/query-core'

const queryClient = new QueryClient()
const mutationCache = queryClient.getMutationCache()
const mutations = mutationCache.findAll({ status: 'pending' })
```

***

### getMutationDefaults()

```ts
getMutationDefaults(mutationKey): OmitKeyof<MutationObserverOptions<any, any, any, any>, "mutationKey">;
```

Defined in: [packages/query-core/src/queryClient.ts:945](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L945)

Returns the default options registered for mutations whose mutation key partially matches
the given `mutationKey`, via [QueryClient#setMutationDefaults](#setmutationdefaults). If multiple registered
defaults match, they are merged together in registration order.

#### Parameters

##### mutationKey

readonly `unknown`[]

#### Returns

[`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`MutationObserverOptions`](../interfaces/MutationObserverOptions.md)\<`any`, `any`, `any`, `any`\>, `"mutationKey"`\>

#### Example

```ts
const defaultOptions = queryClient.getMutationDefaults(['addPost'])
```

***

### getQueriesData()

```ts
getQueriesData<TQueryFnData, TQueryFilters>(filters): [readonly unknown[], TQueryFnData | undefined][];
```

Defined in: [packages/query-core/src/queryClient.ts:240](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L240)

Imperative (non-reactive) way to retrieve the cached data of multiple queries at once.
Only queries matching the given filters are returned; if none match, an empty array is
returned.

Because the matched queries can hold data of different shapes (e.g. a broad filter can match
queries with unrelated data types), the `TQueryFnData` generic defaults to `unknown` rather
than being inferred. Passing a more specific type is a convenience for call sites that know
every matched query holds the same shape — it is not checked against the actual cache
contents.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TQueryFilters

`TQueryFilters` *extends* [`QueryFilters`](../interfaces/QueryFilters.md)\<`any`\> = [`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>

#### Parameters

##### filters

`TQueryFilters`

#### Returns

\[readonly `unknown`[], `TQueryFnData` \| `undefined`\][]

#### See

[QueryClient#getQueryData](#getquerydata)

#### Example

```ts
const data = queryClient.getQueriesData({ queryKey: ['posts'] })
```

***

### getQueryCache()

```ts
getQueryCache(): QueryCache;
```

Defined in: [packages/query-core/src/queryClient.ts:786](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L786)

Returns the query cache this client is connected to.

#### Returns

[`QueryCache`](QueryCache.md)

#### Example

```ts
import { QueryClient } from '@tanstack/query-core'

const queryClient = new QueryClient()
const queryCache = queryClient.getQueryCache()
const queries = queryCache.findAll({ queryKey: ['posts'] })
```

***

### getQueryData()

```ts
getQueryData<TQueryFnData, TTaggedQueryKey, TInferredQueryFnData>(queryKey): TInferredQueryFnData | undefined;
```

Defined in: [packages/query-core/src/queryClient.ts:183](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L183)

Imperative (non-reactive) way to retrieve data for a QueryKey.
Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.

Hint: Do not use this function inside a component, because it won't receive updates.
Use `useQuery` to create a `QueryObserver` that subscribes to changes.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TInferredQueryFnData

`TInferredQueryFnData` = [`InferDataFromTag`](../type-aliases/InferDataFromTag.md)\<`TQueryFnData`, `TTaggedQueryKey`\>

#### Parameters

##### queryKey

`TTaggedQueryKey`

#### Returns

`TInferredQueryFnData` \| `undefined`

#### See

[QueryClient#getQueriesData](#getqueriesdata)

***

### getQueryDefaults()

```ts
getQueryDefaults(queryKey): OmitKeyof<QueryObserverOptions<any, any, any, any, any>, "queryKey">;
```

Defined in: [packages/query-core/src/queryClient.ts:888](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L888)

Returns the default options registered for queries whose query key partially matches the
given `queryKey`, via [QueryClient#setQueryDefaults](#setquerydefaults). If multiple registered defaults
match, they are merged together in registration order.

#### Parameters

##### queryKey

readonly `unknown`[]

#### Returns

[`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`any`, `any`, `any`, `any`, `any`\>, `"queryKey"`\>

#### Example

```ts
const defaultOptions = queryClient.getQueryDefaults(['posts'])
```

***

### getQueryState()

```ts
getQueryState<TQueryFnData, TError, TTaggedQueryKey, TInferredQueryFnData, TInferredError>(queryKey):
  | QueryState<TInferredQueryFnData, TInferredError>
  | undefined;
```

Defined in: [packages/query-core/src/queryClient.ts:350](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L350)

Imperative (non-reactive) way to retrieve an existing query's state. If the query does not
exist, `undefined` is returned.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TInferredQueryFnData

`TInferredQueryFnData` = [`InferDataFromTag`](../type-aliases/InferDataFromTag.md)\<`TQueryFnData`, `TTaggedQueryKey`\>

##### TInferredError

`TInferredError` = [`InferErrorFromTag`](../type-aliases/InferErrorFromTag.md)\<`TError`, `TTaggedQueryKey`\>

#### Parameters

##### queryKey

`TTaggedQueryKey`

#### Returns

  \| [`QueryState`](../interfaces/QueryState.md)\<`TInferredQueryFnData`, `TInferredError`\>
  \| `undefined`

#### Example

```ts
const state = queryClient.getQueryState(['posts'])
console.log(state?.dataUpdatedAt)
```

***

### infiniteQuery()

```ts
infiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<TData[] extends InfiniteData<TQueryFnData, unknown>[] ? InfiniteData<TQueryFnData, TPageParam> : TData>;
```

Defined in: [packages/query-core/src/queryClient.ts:666](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L666)

Asynchronous method to fetch and cache an infinite query, resolving with an
[InfiniteData](../interfaces/InfiniteData.md) object or throwing with the error.

Behaves like [QueryClient#query](#query), accepting the same options (minus
`initialPageParam`), plus the required `initialPageParam`, and an optional `pages` /
`getNextPageParam` pair used to refetch a fixed number of pages from the start.

This method replaces the deprecated `fetchInfiniteQuery`, and — combined with
`{ staleTime: 'static' }` — the deprecated `ensureInfiniteQueryData`.

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `unknown`

#### Parameters

##### options

[`InfiniteQueryExecuteOptions`](../type-aliases/InfiniteQueryExecuteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`Promise`\<`TData`[] *extends* [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>[] ? [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> : `TData`\>

#### Example

```ts
try {
  const data = await queryClient.infiniteQuery({ queryKey, queryFn, initialPageParam: 0 })
  console.log(data.pages)
} catch (error) {
  console.log(error)
}
```

***

### invalidateQueries()

```ts
invalidateQueries<TTaggedQueryKey>(filters?, options?): Promise<void>;
```

Defined in: [packages/query-core/src/queryClient.ts:460](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L460)

Marks queries matching the given filters as invalidated. Unlike
[QueryClient#removeQueries](#removequeries), invalidated queries stay in the cache.

Unless `filters.refetchType` is `'none'`, matching queries are then refetched via
[QueryClient#refetchQueries](#refetchqueries), using `filters.refetchType` if set, otherwise
`filters.type`, otherwise `'active'`.

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

[`InvalidateQueryFilters`](../interfaces/InvalidateQueryFilters.md)\<`TTaggedQueryKey`\>

##### options?

[`InvalidateOptions`](../interfaces/InvalidateOptions.md) = `{}`

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await queryClient.invalidateQueries({ queryKey: ['posts'], refetchType: 'active' })
```

***

### isFetching()

```ts
isFetching<TQueryFilters>(filters?): number;
```

Defined in: [packages/query-core/src/queryClient.ts:150](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L150)

Returns the number of queries in the cache that are currently fetching, optionally
matching a set of filters. This includes background-fetching, loading new pages, and
loading more infinite query results.

#### Type Parameters

##### TQueryFilters

`TQueryFilters` *extends* [`QueryFilters`](../interfaces/QueryFilters.md)\<`any`\> = [`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>

#### Parameters

##### filters?

`TQueryFilters`

#### Returns

`number`

#### Example

```ts
if (queryClient.isFetching()) {
  console.log('At least one query is fetching!')
}
```

***

### isMutating()

```ts
isMutating<TMutationFilters>(filters?): number;
```

Defined in: [packages/query-core/src/queryClient.ts:168](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L168)

Returns the number of mutations in the cache that are currently pending, optionally
matching a set of filters.

#### Type Parameters

##### TMutationFilters

`TMutationFilters` *extends* [`MutationFilters`](../interfaces/MutationFilters.md)\<`any`, `any`, `unknown`, `unknown`\> = [`MutationFilters`](../interfaces/MutationFilters.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

#### Parameters

##### filters?

`TMutationFilters`

#### Returns

`number`

#### Example

```ts
if (queryClient.isMutating()) {
  console.log('At least one mutation is pending!')
}
```

***

### mount()

```ts
mount(): void;
```

Defined in: [packages/query-core/src/queryClient.ts:104](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L104)

Called by a framework adapter's `QueryClientProvider`-equivalent when it mounts, to start
listening for focus/online events and resume paused mutations. Ref-counted via an internal
mount count, so nested or multiple providers sharing the same `QueryClient` don't tear down
the shared listeners until the last one unmounts.

#### Returns

`void`

***

### ~~prefetchInfiniteQuery()~~

```ts
prefetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<void>;
```

Defined in: [packages/query-core/src/queryClient.ts:714](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L714)

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `unknown`

#### Parameters

##### options

[`FetchInfiniteQueryOptions`](../type-aliases/FetchInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`Promise`\<`void`\>

#### Deprecated

Use queryClient.infiniteQuery(options) instead. You can swallow errors with `.catch(noop)`. This method will be removed in the next major version.

***

### ~~prefetchQuery()~~

```ts
prefetchQuery<TQueryFnData, TError, TData, TQueryKey>(options): Promise<void>;
```

Defined in: [packages/query-core/src/queryClient.ts:634](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L634)

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

##### options

[`FetchQueryOptions`](../interfaces/FetchQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

#### Returns

`Promise`\<`void`\>

#### Deprecated

Use queryClient.query(options) instead. You can swallow errors with `.catch(noop)`. This method will be removed in the next major version.

***

### query()

```ts
query<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam>(options): Promise<TData>;
```

Defined in: [packages/query-core/src/queryClient.ts:554](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L554)

Asynchronous method to fetch and cache a query, resolving with the data or throwing with
the error.

If the query already exists in the cache and its data is not stale (per the given
`staleTime`), the cached data is returned without fetching. Otherwise, the query is fetched
and the promise resolves once the fetch settles. If a `select` function is provided, it is
applied to the data in both cases (cached or freshly fetched) before it is returned.

Unlike a reactive observer, retries are disabled by default here (`retry: false`) unless
explicitly configured, since there is no component to catch a thrown error and retry through
re-render.

The accepted options are `QueryObserverOptions` minus the fields that only make sense for a
reactive observer — `enabled`, `refetchInterval`, `refetchIntervalInBackground`,
`refetchOnWindowFocus`, `refetchOnReconnect`, `refetchOnMount`, `retryOnMount`,
`notifyOnChangeProps`, `throwOnError`, `suspense`, and `placeholderData` are not part of this
method's options.

This method replaces the deprecated `fetchQuery`, and — combined with
`{ staleTime: 'static' }` — the deprecated `ensureQueryData`.

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryData

`TQueryData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `never`

#### Parameters

##### options

[`QueryExecuteOptions`](../interfaces/QueryExecuteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`, `TPageParam`\>

#### Returns

`Promise`\<`TData`\>

#### Example

```ts
try {
  const data = await queryClient.query({ queryKey, queryFn, staleTime: 10000 })
} catch (error) {
  console.log(error)
}
```

***

### refetchQueries()

```ts
refetchQueries<TTaggedQueryKey>(filters?, options?): Promise<void>;
```

Defined in: [packages/query-core/src/queryClient.ts:497](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L497)

Refetches queries matching the given filters, regardless of whether they are stale. Without
filters, every query in the cache is refetched. Queries that are disabled, or static (only
have observers with a static `staleTime`), are never refetched.

By default (`cancelRefetch: true`), a currently running fetch is cancelled before the new
one starts. The returned promise resolves once all matching queries have settled; it does
not reject on individual query failures unless `throwOnError` is set.

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

[`RefetchQueryFilters`](../interfaces/RefetchQueryFilters.md)\<`TTaggedQueryKey`\>

##### options?

[`RefetchOptions`](../interfaces/RefetchOptions.md) = `{}`

#### Returns

`Promise`\<`void`\>

#### Example

```ts
// refetch all active queries partially matching a query key:
await queryClient.refetchQueries({ queryKey: ['posts'], type: 'active' })
```

***

### removeQueries()

```ts
removeQueries<TTaggedQueryKey>(filters?): void;
```

Defined in: [packages/query-core/src/queryClient.ts:376](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L376)

Removes queries from the cache that match the given filters. Unlike
[QueryClient#invalidateQueries](#invalidatequeries) or [QueryClient#refetchQueries](#refetchqueries), this removes
matching queries from the cache instead of refetching them. Without filters, every query in
the cache is removed.

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

[`QueryFilters`](../interfaces/QueryFilters.md)\<`TTaggedQueryKey`\>

#### Returns

`void`

#### Example

```ts
queryClient.removeQueries({ queryKey: ['posts'], exact: true })
```

***

### resetQueries()

```ts
resetQueries<TTaggedQueryKey>(filters?, options?): Promise<void>;
```

Defined in: [packages/query-core/src/queryClient.ts:397](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L397)

Resets queries matching the given filters back to their initial state (e.g. any
`initialData`), notifying subscribers rather than removing them. Active queries among the
matched set are then refetched, and the returned promise resolves once that refetch settles.

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

[`QueryFilters`](../interfaces/QueryFilters.md)\<`TTaggedQueryKey`\>

##### options?

[`ResetOptions`](../interfaces/ResetOptions.md)

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await queryClient.resetQueries({ queryKey: ['posts'], exact: true })
```

***

### resumePausedMutations()

```ts
resumePausedMutations(): Promise<unknown>;
```

Defined in: [packages/query-core/src/queryClient.ts:767](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L767)

Resumes mutations that were paused because there was no network connection. Does nothing
(resolving immediately) if the client is currently offline.

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
import { QueryClient } from '@tanstack/query-core'

const queryClient = new QueryClient()
await queryClient.resumePausedMutations()
```

***

### setDefaultOptions()

```ts
setDefaultOptions(options): void;
```

Defined in: [packages/query-core/src/queryClient.ts:839](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L839)

Dynamically sets the default options for this client, overwriting any previously defined
default options.

#### Parameters

##### options

[`DefaultOptions`](../interfaces/DefaultOptions.md)

#### Returns

`void`

#### See

[QueryClient#getDefaultOptions](#getdefaultoptions)

#### Example

```ts
import { QueryClient } from '@tanstack/query-core'

const queryClient = new QueryClient()
queryClient.setDefaultOptions({
  queries: {
    staleTime: Infinity,
  },
})
```

***

### setMutationDefaults()

```ts
setMutationDefaults<TData, TError, TVariables, TOnMutateResult>(mutationKey, options): void;
```

Defined in: [packages/query-core/src/queryClient.ts:917](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L917)

Sets default options for mutations whose mutation key partially matches the given
`mutationKey`. As with [QueryClient#setQueryDefaults](#setquerydefaults), the order of registration
matters when several registered defaults match the same mutation key.

#### Type Parameters

##### TData

`TData` = `unknown`

##### TError

`TError` = `Error`

##### TVariables

`TVariables` = `void`

##### TOnMutateResult

`TOnMutateResult` = `unknown`

#### Parameters

##### mutationKey

readonly `unknown`[]

##### options

[`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`MutationObserverOptions`](../interfaces/MutationObserverOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

#### Returns

`void`

#### See

[QueryClient#getMutationDefaults](#getmutationdefaults)

#### Example

```ts
queryClient.setMutationDefaults(['addPost'], { mutationFn: addPost })
```

***

### setQueriesData()

```ts
setQueriesData<TQueryFnData, TQueryFilters>(
   filters,
   updater,
   options?): [readonly unknown[], TQueryFnData | undefined][];
```

Defined in: [packages/query-core/src/queryClient.ts:319](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L319)

Synchronous way to immediately update the cached data of multiple queries at once, using
filters or partial query key matching. Only queries that already exist and match the given
filters are updated; no new cache entries are created. Internally this calls
[QueryClient#setQueryData](#setquerydata) for each matching query.

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TQueryFilters

`TQueryFilters` *extends* [`QueryFilters`](../interfaces/QueryFilters.md)\<`any`\> = [`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>

#### Parameters

##### filters

`TQueryFilters`

##### updater

[`Updater`](../type-aliases/Updater.md)\<`NoInfer`\<`TQueryFnData`\> \| `undefined`, `NoInfer`\<`TQueryFnData`\> \| `undefined`\>

##### options?

[`SetDataOptions`](../interfaces/SetDataOptions.md)

#### Returns

\[readonly `unknown`[], `TQueryFnData` \| `undefined`\][]

#### Example

```ts
queryClient.setQueriesData({ queryKey: ['posts'] }, (oldPosts) =>
  oldPosts ? oldPosts.filter((post) => post.id !== deletedId) : oldPosts,
)
```

***

### setQueryData()

```ts
setQueryData<TQueryFnData, TTaggedQueryKey, TInferredQueryFnData>(
   queryKey,
   updater,
   options?): NoInfer<TInferredQueryFnData> | undefined;
```

Defined in: [packages/query-core/src/queryClient.ts:271](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L271)

Synchronous way to immediately update a query's cached data. If the updater (or the value
passed) resolves to `undefined`, the cache is left untouched and no query is created;
otherwise, if the query does not exist yet, it will be created. To update multiple queries
at once by partially matching query keys, use [QueryClient#setQueriesData](#setqueriesdata) instead.

Updates must be performed immutably: do not mutate `oldData`, or data previously retrieved
via [QueryClient#getQueryData](#getquerydata), in place.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TInferredQueryFnData

`TInferredQueryFnData` = [`InferDataFromTag`](../type-aliases/InferDataFromTag.md)\<`TQueryFnData`, `TTaggedQueryKey`\>

#### Parameters

##### queryKey

`TTaggedQueryKey`

The query key to set data for.

##### updater

[`Updater`](../type-aliases/Updater.md)\<`NoInfer`\<`TInferredQueryFnData`\> \| `undefined`, `NoInfer`\<`TInferredQueryFnData`\> \| `undefined`\>

Either the new data, or a function that receives the current data (which
may be `undefined`) and returns the new data.

##### options?

[`SetDataOptions`](../interfaces/SetDataOptions.md)

#### Returns

`NoInfer`\<`TInferredQueryFnData`\> \| `undefined`

#### Example

```ts
queryClient.setQueryData(['posts'], newPosts)

// Or, using an updater function that receives the current data:
queryClient.setQueryData(['posts'], (oldPosts) => [...oldPosts, newPost])
```

***

### setQueryDefaults()

```ts
setQueryDefaults<TQueryFnData, TError, TData, TQueryData>(queryKey, options): void;
```

Defined in: [packages/query-core/src/queryClient.ts:858](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L858)

Sets default options for queries whose query key partially matches the given `queryKey`.

If several registered query defaults match a given query key, they are merged together in
registration order by [QueryClient#getQueryDefaults](#getquerydefaults), so register defaults from the
most generic key to the least generic one — more specific defaults should be registered
after more generic ones so they take precedence.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryData

`TQueryData` = `TQueryFnData`

#### Parameters

##### queryKey

readonly `unknown`[]

##### options

`Partial`\<[`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`\>, `"queryKey"`\>\>

#### Returns

`void`

#### Example

```ts
queryClient.setQueryDefaults(['posts'], { queryFn: fetchPosts })

await queryClient.query({ queryKey: ['posts'] })
```

***

### unmount()

```ts
unmount(): void;
```

Defined in: [packages/query-core/src/queryClient.ts:127](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L127)

The inverse of [QueryClient#mount](#mount) — called by a framework adapter's
`QueryClientProvider`-equivalent when it unmounts. Only tears down the focus/online
listeners once the mount count returns to `0`.

#### Returns

`void`
