---
id: injectQuery
title: injectQuery
---

## Overview

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(injectQueryFn: () => DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, options?: InjectQueryOptions): DefinedCreateQueryResult<TData, TError>;
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(injectQueryFn: () => UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, options?: InjectQueryOptions): CreateQueryResult<TData, TError>;
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(injectQueryFn: () => CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>, options?: InjectQueryOptions): CreateQueryResult<TData, TError>;
```

- [`DefinedInitialDataOptions` → `DefinedCreateQueryResult`](#call-signature-1): This overload is selected when `initialData` is set on the options returned by `injectQueryFn`, so the resulting `data` signal is never `undefined` (unless a `select` changes `TData` to include `undefined`).
- [`UndefinedInitialDataOptions` → `CreateQueryResult`](#call-signature-2): Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
- [`CreateQueryOptions` → `CreateQueryResult`](#call-signature-3): This overload accepts the general [CreateQueryOptions](../interfaces/CreateQueryOptions.md) shape rather than the `initialData`-aware overloads above, so whether `data` is defined can't be inferred from the call site — useful when wrapping `injectQuery` in your own helper function that forwards caller-provided options.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(injectQueryFn: () => DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, options?: InjectQueryOptions): DefinedCreateQueryResult<TData, TError>;
```

Defined in: [packages/angular-query-experimental/src/inject-query.ts:70](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L70)

This overload is selected when `initialData` is set on the options returned by `injectQueryFn`, so the
resulting `data` signal is never `undefined` (unless a `select` changes `TData` to include `undefined`).

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### injectQueryFn

() => [`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function returning the [DefinedInitialDataOptions](../type-aliases/DefinedInitialDataOptions.md) to use — everything you
can pass to `injectQuery`, with `initialData` set. Similar to `computed` from Angular, this function runs
in the reactive context, so signals read inside it (in `queryKey`, `enabled`, etc.) drive the query.

#### options?

[`InjectQueryOptions`](../interfaces/InjectQueryOptions.md)

Additional configuration

### Returns

[`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`TData`, `TError`\>

The query result, typed so that `data` is never `undefined` (unless a `select` changes `TData` to
include `undefined`).

### See

 - https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 - [queryOptions](queryOptions.md) to share these options between `injectQuery` and imperative APIs like
`queryClient.fetchQuery`.

### Example

```angular-ts
@Component({
  selector: 'posts',
  template: `
    <!-- `postsQuery.data()` is `Post[]`, never `undefined`, thanks to `initialData` — even if a
    refetch fails, so the list stays visible alongside the error. -->
    @if (postsQuery.isError()) {
      <span>Error: {{ postsQuery.error()?.message }}</span>
    }
    <ul>
      @for (post of postsQuery.data(); track post.id) {
        <li>{{ post.title }}</li>
      }
    </ul>
  `,
})
export class Posts {
  readonly postsQuery = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    initialData: [],
  }))
}
```

<a id="call-signature-2"></a>

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(injectQueryFn: () => UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, options?: InjectQueryOptions): CreateQueryResult<TData, TError>;
```

Defined in: [packages/angular-query-experimental/src/inject-query.ts:156](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L156)

Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### injectQueryFn

() => [`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function returning the [UndefinedInitialDataOptions](../type-aliases/UndefinedInitialDataOptions.md) to use — everything
you can pass to `injectQuery`. Similar to `computed` from Angular, this function runs in the reactive
context, so signals read inside it (in `queryKey`, `enabled`, etc.) drive the query.

#### options?

[`InjectQueryOptions`](../interfaces/InjectQueryOptions.md)

Additional configuration

### Returns

[`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>

The query result. `status()` is `'pending'` if there is no cached data to display, `'error'` if
the last fetch attempt failed, or `'success'` if the query has data to display. `isPending`/`isSuccess`/
`isError` are type-guard methods for convenience.

### See

 - https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 - [queryOptions](queryOptions.md) to share these options between `injectQuery` and imperative APIs like
`queryClient.fetchQuery`.

### Examples

```angular-ts
@Component({
  selector: 'posts',
  template: `
    @if (postsQuery.isPending()) {
      Loading...
    } @else if (postsQuery.isError()) {
      <span>Error: {{ postsQuery.error()?.message }}</span>
    } @else {
      <ul>
        @for (post of postsQuery.data(); track post.id) {
          <li>{{ post.title }}</li>
        }
      </ul>
    }
  `,
})
export class Posts {
  readonly postsQuery = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  }))
}
```

Similar to `computed` from Angular, the function passed to `injectQuery` runs in the reactive context. In
the example below, the query is automatically enabled and executed when the filter signal changes to a
truthy value. When the filter signal changes back to a falsy value, the query is disabled.
```angular-ts
@Component({
  selector: 'posts',
  template: `
    <input [ngModel]="filter()" (ngModelChange)="filter.set($event)" />
    @if (postsQuery.isPending()) {
      Loading...
    } @else if (postsQuery.isError()) {
      <span>Error: {{ postsQuery.error()?.message }}</span>
    } @else {
      <ul>
        @for (post of postsQuery.data(); track post.id) {
          <li>{{ post.title }}</li>
        }
      </ul>
    }
  `,
})
export class Posts {
  readonly filter = signal('')

  readonly postsQuery = injectQuery(() => ({
    queryKey: ['posts', this.filter()],
    queryFn: () => fetchPosts(this.filter()),
    // Signals can be combined with expressions
    enabled: !!this.filter(),
  }))
}
```

<a id="call-signature-3"></a>

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(injectQueryFn: () => CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>, options?: InjectQueryOptions): CreateQueryResult<TData, TError>;
```

Defined in: [packages/angular-query-experimental/src/inject-query.ts:182](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L182)

This overload accepts the general [CreateQueryOptions](../interfaces/CreateQueryOptions.md) shape rather than the `initialData`-aware
overloads above, so whether `data` is defined can't be inferred from the call site — useful when wrapping
`injectQuery` in your own helper function that forwards caller-provided options.

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### injectQueryFn

() => [`CreateQueryOptions`](../interfaces/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function that returns query options. Similar to `computed` from Angular, this
function runs in the reactive context, so signals read inside it (in `queryKey`, `enabled`, etc.) drive
the query.

#### options?

[`InjectQueryOptions`](../interfaces/InjectQueryOptions.md)

Additional configuration

### Returns

[`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>

The query result.

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

<a id="parameters-summary"></a>

## Parameters

### injectQueryFn

() => [`CreateQueryOptions`](../interfaces/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function that returns query options. Similar to `computed` from Angular, this
function runs in the reactive context, so signals read inside it (in `queryKey`, `enabled`, etc.) drive
the query.

<a id="injectQueryFn-properties"></a>

#### `injectQueryFn` properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="injectQueryFn-property-enabled"></a> `enabled?` | \| `false` \| `true` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `boolean`) | `true` | Set this to `false` or a function that returns `false` to disable automatic refetching when the query mounts or changes query keys. To refetch the query, use the `refetch` method returned from the `useQuery` instance. Accepts a boolean or function that returns a boolean. |
| <a id="injectQueryFn-property-gctime"></a> `gcTime?` | `number` | `undefined` | The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration. When different garbage collection times are specified, the longest one will be used. Setting it to `Infinity` will disable garbage collection. Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR. Note: the maximum allowed time is about 24 days, imposed by `setTimeout`'s 32-bit signed integer delay — see `timeoutManager.setTimeoutProvider` for a workaround. |
| <a id="injectQueryFn-property-initialdata"></a> `initialData?` | `TQueryFnData` \| (() => `TQueryFnData` \| `undefined`) | `undefined` | If set, this value will be used as the initial data for the query cache (as long as the query hasn't been created or cached yet). If set to a function, the function will be called **once** during the shared/root query initialization, and be expected to synchronously return the initial data. Initial data is considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the cache. |
| <a id="injectQueryFn-property-initialdataupdatedat"></a> `initialDataUpdatedAt?` | `number` \| (() => `number` \| `undefined`) | `undefined` | If set, this value will be used as the time (in milliseconds) of when the `initialData` itself was last updated. |
| <a id="injectQueryFn-property-maxpages"></a> `maxPages?` | `number` | `undefined` | Maximum number of pages to store in the data of an infinite query. |
| <a id="injectQueryFn-property-meta"></a> `meta?` | `Record`\<`string`, `unknown`\> | `undefined` | Additional payload to be stored on each query. Use this property to pass information that can be used in other places. |
| <a id="injectQueryFn-property-networkmode"></a> `networkMode?` | `"online"` \| `"always"` \| `"offlineFirst"` | `'online'` | Controls whether a query is allowed to run based on the current network connectivity. **See** [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="injectQueryFn-property-notifyonchangeprops"></a> `notifyOnChangeProps?` | \| ( \| `"error"` \| `"data"` \| `"isError"` \| `"isPending"` \| `"isLoading"` \| `"isLoadingError"` \| `"isRefetchError"` \| `"isSuccess"` \| `"isPlaceholderData"` \| `"status"` \| `"dataUpdatedAt"` \| `"errorUpdatedAt"` \| `"failureCount"` \| `"failureReason"` \| `"errorUpdateCount"` \| `"isFetched"` \| `"isFetchedAfterMount"` \| `"isFetching"` \| `"isInitialLoading"` \| `"isPaused"` \| `"isRefetching"` \| `"isStale"` \| `"isEnabled"` \| `"refetch"` \| `"fetchStatus"` \| `"fetchNextPage"` \| `"fetchPreviousPage"` \| `"hasNextPage"` \| `"hasPreviousPage"` \| `"isFetchNextPageError"` \| `"isFetchingNextPage"` \| `"isFetchPreviousPageError"` \| `"isFetchingPreviousPage"`)[] \| `"all"` \| (() => \| `"all"` \| ( \| `"error"` \| `"data"` \| `"isError"` \| `"isPending"` \| `"isLoading"` \| `"isLoadingError"` \| `"isRefetchError"` \| `"isSuccess"` \| `"isPlaceholderData"` \| `"status"` \| `"dataUpdatedAt"` \| `"errorUpdatedAt"` \| `"failureCount"` \| `"failureReason"` \| `"errorUpdateCount"` \| `"isFetched"` \| `"isFetchedAfterMount"` \| `"isFetching"` \| `"isInitialLoading"` \| `"isPaused"` \| `"isRefetching"` \| `"isStale"` \| `"isEnabled"` \| `"refetch"` \| `"fetchStatus"` \| `"fetchNextPage"` \| `"fetchPreviousPage"` \| `"hasNextPage"` \| `"hasPreviousPage"` \| `"isFetchNextPageError"` \| `"isFetchingNextPage"` \| `"isFetchPreviousPageError"` \| `"isFetchingPreviousPage"`)[] \| `undefined`) | `undefined` | If set, the component will only re-render if any of the listed properties change. When set to `['data', 'error']`, the component will only re-render when the `data` or `error` properties change. When set to `'all'`, the component will re-render whenever a query is updated. When set to a function, the function will be executed to compute the list of properties. Defaults to `undefined`, in which case property access is tracked automatically, and the component only re-renders when one of the tracked properties changes. |
| <a id="injectQueryFn-property-persister"></a> `persister?` | (`queryFn`: (`context`: `object`) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\>, `context`: `object`, `query`: [`Query`](../classes/Query.md)) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\> | `undefined` | This option can be used to persist the result of a query to an external storage, bypassing the need to actually call the `queryFn`. Useful for persisting a query's data across e.g. server/client boundaries. |
| <a id="injectQueryFn-property-placeholderdata"></a> `placeholderData?` | \| `NonFunctionGuard`\<`TQueryFnData`\> \| ((`previousData`: `NonFunctionGuard`\<`TQueryFnData`\> \| `undefined`, `previousQuery`: \| [`Query`](../classes/Query.md)\<`NonFunctionGuard`\<`TQueryFnData`\>, `TError`, `NonFunctionGuard`\<`TQueryFnData`\>, `TQueryKey`\> \| `undefined`) => `NonFunctionGuard`\<`TQueryFnData`\> \| `undefined`) | `undefined` | If set, this value will be used as the placeholder data for this particular query observer while the query is still in the `loading` data and no initialData has been provided. |
| <a id="injectQueryFn-property-queryfn"></a> `queryFn?` | \| *typeof* [`skipToken`](../variables/skipToken.md) \| ((`context`: `object`) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\>) | `undefined` | The function that the query will use to request data. Required, unless a default query function has been set via `queryClient.setQueryDefaults` or `queryClient.setDefaultOptions`. Receives a [QueryFunctionContext](../type-aliases/QueryFunctionContext.md). Must return a promise that will either resolve data or throw an error. The data cannot be `undefined`. |
| <a id="injectQueryFn-property-queryhash"></a> `queryHash?` | `string` | `undefined` | The hashed form of `queryKey`, computed with `queryKeyHashFn` (or the default hashing function otherwise). Used as the actual cache key internally. |
| <a id="injectQueryFn-property-querykey"></a> `queryKey` | `TQueryKey` & `object` | `undefined` | The query key to use for this query. The query key will be hashed into a stable hash. See [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) for more information. The query will automatically update when this key changes (as long as `enabled` is not set to `false`). |
| <a id="injectQueryFn-property-querykeyhashfn"></a> `queryKeyHashFn?` | (`queryKey`: `TQueryKey`) => `string` | `undefined` | If specified, this function is used to hash the `queryKey` to a string. |
| <a id="injectQueryFn-property-refetchinterval"></a> `refetchInterval?` | \| `number` \| `false` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `number` \| `false` \| `undefined`) | `false` | If set to a number, the query will continuously refetch at this frequency in milliseconds. If set to a function, the function will be executed with the latest data and query to compute a frequency |
| <a id="injectQueryFn-property-refetchintervalinbackground"></a> `refetchIntervalInBackground?` | `boolean` | `false` | If set to `true`, the query will continue to refetch while their tab/window is in the background. |
| <a id="injectQueryFn-property-refetchonmount"></a> `refetchOnMount?` | \| `boolean` \| `"always"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `boolean` \| `"always"`) | `true` | If set to `true`, the query will refetch on mount if the data is stale. If set to `false`, will disable additional instances of a query to trigger background refetch. If set to `'always'`, the query will always refetch on mount (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value |
| <a id="injectQueryFn-property-refetchonreconnect"></a> `refetchOnReconnect?` | \| `boolean` \| `"always"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `boolean` \| `"always"`) | `undefined` | If set to `true`, the query will refetch on reconnect if the data is stale. If set to `false`, the query will not refetch on reconnect. If set to `'always'`, the query will always refetch on reconnect (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value. Defaults to `true` unless `networkMode` is `'always'`. |
| <a id="injectQueryFn-property-refetchonwindowfocus"></a> `refetchOnWindowFocus?` | \| `boolean` \| `"always"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `boolean` \| `"always"`) | `true` | If set to `true`, the query will refetch on window focus if the data is stale. If set to `false`, the query will not refetch on window focus. If set to `'always'`, the query will always refetch on window focus (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value. |
| <a id="injectQueryFn-property-retry"></a> `retry?` | \| `number` \| `false` \| `true` \| ((`failureCount`: `number`, `error`: `TError`) => `boolean`) | `undefined` | If `false`, failed queries will not retry by default. If `true`, failed queries will retry infinitely. If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number. If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false. Defaults to `3` on the client and `0` on the server. |
| <a id="injectQueryFn-property-retrydelay"></a> `retryDelay?` | `number` \| ((`failureCount`: `number`, `error`: `TError`) => `number`) | `undefined` | This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the next attempt in milliseconds. A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff. A function like `attempt => attempt * 1000` applies linear backoff. Defaults to a function that applies exponential backoff, capped at 30 seconds. |
| <a id="injectQueryFn-property-retryonmount"></a> `retryOnMount?` | \| `false` \| `true` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `boolean`) | `true` | If set to `false`, the query will not be retried on mount if it contains an error. If set to a function, the function will be executed with the query to compute the value. |
| <a id="injectQueryFn-property-select"></a> `select?` | (`data`: `TQueryFnData`) => `TData` | `undefined` | This option can be used to transform or select a part of the data returned by the query function. It affects the returned `data` value, but does not affect what gets stored in the query cache. The `select` function will only run if `data` changed, or if the reference to the `select` function itself changes. To optimize, memoize the function so its reference stays stable across calls. |
| <a id="injectQueryFn-property-staletime"></a> `staleTime?` | \| `number` \| `"static"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `number` \| `"static"`) | `0` | The time in milliseconds after data is considered stale. If set to `Infinity`, the data will never be considered stale. If set to `'static'`, the data will never be considered stale. If set to a function, the function will be executed with the query to compute a `staleTime`. |
| <a id="injectQueryFn-property-structuralsharing"></a> `structuralSharing?` | `boolean` \| ((`oldData`: `unknown`, `newData`: `unknown`) => `unknown`) | `true` | Set this to `false` to disable structural sharing between query results. Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic. |
| <a id="injectQueryFn-property-throwonerror"></a> `throwOnError?` | \| `false` \| `true` \| ((`error`: `TError`, `query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `boolean`) | `false` | Whether errors should be thrown instead of setting the `error` property. If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary. If set to `false` and `suspense` is `false`, errors are returned as state. If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`). |

### options?

[`InjectQueryOptions`](../interfaces/InjectQueryOptions.md)

Additional configuration

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="options-property-injector"></a> `injector?` | `Injector` | The `Injector` in which to create the query. If this is not provided, the current injection context will be used instead (via `inject`). |

<a id="returns-summary"></a>

## Returns

[`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>

The query result.
