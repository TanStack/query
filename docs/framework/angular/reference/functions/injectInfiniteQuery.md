---
id: injectInfiniteQuery
title: injectInfiniteQuery
---

## Overview

```ts
function injectInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(injectInfiniteQueryFn: () => DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, options?: InjectInfiniteQueryOptions): DefinedCreateInfiniteQueryResult<TData, TError>;
function injectInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(injectInfiniteQueryFn: () => UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, options?: InjectInfiniteQueryOptions): CreateInfiniteQueryResult<TData, TError>;
function injectInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(injectInfiniteQueryFn: () => CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, options?: InjectInfiniteQueryOptions): CreateInfiniteQueryResult<TData, TError>;
```

- [`() => DefinedInitialDataInfiniteOptions` → `DefinedCreateInfiniteQueryResult`](#call-signature-1): The options for `injectInfiniteQuery` are identical to `injectQuery`, with the addition of `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`. Infinite queries can additively "load more" data onto an existing set of data, or "infinite scroll".
- [`() => UndefinedInitialDataInfiniteOptions` → `CreateInfiniteQueryResult`](#call-signature-2): Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key. Infinite queries can additively "load more" data onto an existing set of data, or "infinite scroll".
- [`() => CreateInfiniteQueryOptions` → `CreateInfiniteQueryResult`](#call-signature-3): This overload accepts the general [CreateInfiniteQueryOptions](../interfaces/CreateInfiniteQueryOptions.md) shape rather than the `initialData`-aware overloads above, so whether `data` is defined can't be inferred from the call site — useful when wrapping `injectInfiniteQuery` in your own helper function that forwards caller-provided options.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function injectInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(injectInfiniteQueryFn: () => DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, options?: InjectInfiniteQueryOptions): DefinedCreateInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/angular-query-experimental/src/inject-infinite-query.ts:85](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-infinite-query.ts#L85)

The options for `injectInfiniteQuery` are identical to `injectQuery`, with the addition of
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`. Infinite queries can
additively "load more" data onto an existing set of data, or "infinite scroll".

This overload is selected when `initialData` is set on the options returned by `injectInfiniteQueryFn`,
so the resulting `data` signal is never `undefined` (unless a `select` changes `TData` to include `undefined`).

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### injectInfiniteQueryFn

() => [`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

A function returning the [DefinedInitialDataInfiniteOptions](../type-aliases/DefinedInitialDataInfiniteOptions.md) to use —
everything you can pass to `injectInfiniteQuery`, with `initialData` set. Similar to `computed` from
Angular, this function runs in the reactive context, so signals read inside it drive the query.

#### options?

[`InjectInfiniteQueryOptions`](../interfaces/InjectInfiniteQueryOptions.md)

Additional configuration.

### Returns

[`DefinedCreateInfiniteQueryResult`](../type-aliases/DefinedCreateInfiniteQueryResult.md)\<`TData`, `TError`\>

The same signals as `injectQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
`hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data().pages` and
`data().pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
`InfiniteData<TQueryFnData>` shape.

### Remarks

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
actions, or add conditions like `hasNextPage() && !isFetching()`.

### See

[infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `injectInfiniteQuery` and imperative APIs
like `queryClient.fetchInfiniteQuery`.

### Example

```angular-ts
@Component({
  selector: 'projects',
  template: `
    <!-- `projectsQuery.data()` is never `undefined`, thanks to `initialData` — even if a
    refetch fails, so the list stays visible alongside the error. -->
    <ul>
      @for (page of projectsQuery.data().pages; track $index) {
        @for (project of page.projects; track project.id) {
          <li>{{ project.name }}</li>
        }
      }
    </ul>
  `,
})
export class Projects {
  readonly projectsQuery = injectInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
    initialData: { pages: [], pageParams: [] },
  }))
}
```

<a id="call-signature-2"></a>

## Call Signature

```ts
function injectInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(injectInfiniteQueryFn: () => UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, options?: InjectInfiniteQueryOptions): CreateInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/angular-query-experimental/src/inject-infinite-query.ts:237](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-infinite-query.ts#L237)

Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a
unique key. Infinite queries can additively "load more" data onto an existing set of data, or
"infinite scroll".

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### injectInfiniteQueryFn

() => [`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

A function returning the [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use
— everything you can pass to `injectInfiniteQuery`. Similar to `computed` from Angular, this function runs
in the reactive context, so signals read inside it drive the query.

#### options?

[`InjectInfiniteQueryOptions`](../interfaces/InjectInfiniteQueryOptions.md)

Additional configuration.

### Returns

[`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>

The same signals as `injectQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
`hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data().pages` and
`data().pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
`InfiniteData<TQueryFnData>` shape.

### Remarks

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
actions, or add conditions like `hasNextPage() && !isFetching()`. This is the only overload that accepts
`queryFn: skipToken`, shown below.

### See

[infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `injectInfiniteQuery` and imperative APIs
like `queryClient.fetchInfiniteQuery`.

### Examples

Fetching the next page from a button click:
```angular-ts
@Component({
  selector: 'projects-list',
  template: `
    <ul>
      @for (page of projectsQuery.data()?.pages; track $index) {
        @for (project of page.projects; track project.id) {
          <li>{{ project.name }}</li>
        }
      }
    </ul>
    <button
      [disabled]="!projectsQuery.hasNextPage() || projectsQuery.isFetching()"
      (click)="projectsQuery.fetchNextPage()"
    >
      Load More
    </button>
  `,
})
export class ProjectsList {
  readonly projectsQuery = injectInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  }))
}
```

Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a sentinel
element after the list:
```angular-ts
@Component({
  selector: 'projects-list',
  template: `
    <ul>
      @for (page of projectsQuery.data()?.pages; track $index) {
        @for (project of page.projects; track project.id) {
          <li>{{ project.name }}</li>
        }
      }
    </ul>
    <div #sentinel>{{ projectsQuery.isFetchingNextPage() ? 'Loading more...' : '' }}</div>
  `,
})
export class ProjectsList {
  readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel')

  readonly projectsQuery = injectInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  }))

  constructor() {
    effect((onCleanup) => {
      const sentinel = this.sentinel()?.nativeElement
      if (
        sentinel == null ||
        !this.projectsQuery.hasNextPage() ||
        this.projectsQuery.isFetching()
      ) {
        return
      }

      const observer = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) this.projectsQuery.fetchNextPage()
      })
      observer.observe(sentinel)

      onCleanup(() => observer.disconnect())
    })
  }
}
```

A query that's disabled, type safe, until `postId` is set — pass `skipToken` as `queryFn` instead of
setting `enabled: false`:
```angular-ts
@Component({
  selector: 'comments',
  template: `
    @if (postId() == null) {
      Select a post
    } @else if (commentsQuery.isPending()) {
      Loading...
    } @else if (commentsQuery.isError()) {
      <span>Error: {{ commentsQuery.error()?.message }}</span>
    } @else {
      <ul>
        @for (page of commentsQuery.data().pages; track $index) {
          @for (comment of page.comments; track comment.id) {
            <li>{{ comment.text }}</li>
          }
        }
      </ul>
    }
  `,
})
export class Comments {
  readonly postId = signal<string | undefined>(undefined)

  readonly commentsQuery = injectInfiniteQuery(() => ({
    queryKey: ['post', this.postId(), 'comments'],
    queryFn:
      this.postId() != null
        ? ({ pageParam }) => fetchComments(this.postId()!, pageParam)
        : skipToken,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  }))
}
```

<a id="call-signature-3"></a>

## Call Signature

```ts
function injectInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(injectInfiniteQueryFn: () => CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, options?: InjectInfiniteQueryOptions): CreateInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/angular-query-experimental/src/inject-infinite-query.ts:264](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-infinite-query.ts#L264)

This overload accepts the general [CreateInfiniteQueryOptions](../interfaces/CreateInfiniteQueryOptions.md) shape rather than the
`initialData`-aware overloads above, so whether `data` is defined can't be inferred from the call site —
useful when wrapping `injectInfiniteQuery` in your own helper function that forwards caller-provided
options.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### injectInfiniteQueryFn

() => [`CreateInfiniteQueryOptions`](../interfaces/CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

A function that returns infinite query options. Similar to `computed` from
Angular, this function runs in the reactive context, so signals read inside it drive the query.

#### options?

[`InjectInfiniteQueryOptions`](../interfaces/InjectInfiniteQueryOptions.md)

Additional configuration.

### Returns

[`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>

The infinite query result.

<a id="parameters-summary"></a>

## Parameters

### injectInfiniteQueryFn

() => [`CreateInfiniteQueryOptions`](../interfaces/CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

A function that returns infinite query options. Similar to `computed` from
Angular, this function runs in the reactive context, so signals read inside it drive the query.

<a id="injectInfiniteQueryFn-properties"></a>

#### `injectInfiniteQueryFn` properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="injectInfiniteQueryFn-property-enabled"></a> `enabled?` | \| `false` \| `true` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean`) | `true` | Set this to `false` or a function that returns `false` to disable automatic refetching when the query mounts or changes query keys. To refetch the query, use the `refetch` method returned from the `useQuery` instance. Accepts a boolean or function that returns a boolean. |
| <a id="injectInfiniteQueryFn-property-gctime"></a> `gcTime?` | `number` | `undefined` | The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration. When different garbage collection times are specified, the longest one will be used. Setting it to `Infinity` will disable garbage collection. Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR. Note: the maximum allowed time is about 24 days, imposed by `setTimeout`'s 32-bit signed integer delay — see `timeoutManager.setTimeoutProvider` for a workaround. |
| <a id="injectInfiniteQueryFn-property-getnextpageparam"></a> `getNextPageParam` | (`lastPage`: `TQueryFnData`, `allPages`: `TQueryFnData`[], `lastPageParam`: `TPageParam`, `allPageParams`: `TPageParam`[]) => `TPageParam` \| `null` \| `undefined` | `undefined` | This function can be set to automatically get the next cursor for infinite queries. The result will also be used to determine the value of `hasNextPage`. |
| <a id="injectInfiniteQueryFn-property-getpreviouspageparam"></a> `getPreviousPageParam?` | (`firstPage`: `TQueryFnData`, `allPages`: `TQueryFnData`[], `firstPageParam`: `TPageParam`, `allPageParams`: `TPageParam`[]) => `TPageParam` \| `null` \| `undefined` | `undefined` | This function can be set to automatically get the previous cursor for infinite queries. The result will also be used to determine the value of `hasPreviousPage`. |
| <a id="injectInfiniteQueryFn-property-initialdata"></a> `initialData?` | \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| (() => \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| `undefined`) | `undefined` | If set, this value will be used as the initial data for the query cache (as long as the query hasn't been created or cached yet). If set to a function, the function will be called **once** during the shared/root query initialization, and be expected to synchronously return the initial data. Initial data is considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the cache. |
| <a id="injectInfiniteQueryFn-property-initialdataupdatedat"></a> `initialDataUpdatedAt?` | `number` \| (() => `number` \| `undefined`) | `undefined` | If set, this value will be used as the time (in milliseconds) of when the `initialData` itself was last updated. |
| <a id="injectInfiniteQueryFn-property-initialpageparam"></a> `initialPageParam` | `TPageParam` | `undefined` | The page param to start from when an infinite query has no pages yet. It is passed to `queryFn` as `pageParam` for the first page; every page after that gets the value returned by `getNextPageParam` or `getPreviousPageParam`. It only applies while the query has no pages: once a first page exists, refetching starts from that page's own param instead. |
| <a id="injectInfiniteQueryFn-property-maxpages"></a> `maxPages?` | `number` | `undefined` | Maximum number of pages to store in the data of an infinite query. |
| <a id="injectInfiniteQueryFn-property-meta"></a> `meta?` | `Record`\<`string`, `unknown`\> | `undefined` | Additional payload to be stored on each query. Use this property to pass information that can be used in other places. |
| <a id="injectInfiniteQueryFn-property-networkmode"></a> `networkMode?` | `"online"` \| `"always"` \| `"offlineFirst"` | `'online'` | Controls whether a query is allowed to run based on the current network connectivity. **See** [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="injectInfiniteQueryFn-property-notifyonchangeprops"></a> `notifyOnChangeProps?` | \| ( \| `"error"` \| `"data"` \| `"isError"` \| `"isPending"` \| `"isLoading"` \| `"isLoadingError"` \| `"isRefetchError"` \| `"isSuccess"` \| `"isPlaceholderData"` \| `"status"` \| `"dataUpdatedAt"` \| `"errorUpdatedAt"` \| `"failureCount"` \| `"failureReason"` \| `"errorUpdateCount"` \| `"isFetched"` \| `"isFetchedAfterMount"` \| `"isFetching"` \| `"isInitialLoading"` \| `"isPaused"` \| `"isRefetching"` \| `"isStale"` \| `"isEnabled"` \| `"refetch"` \| `"fetchStatus"` \| `"fetchNextPage"` \| `"fetchPreviousPage"` \| `"hasNextPage"` \| `"hasPreviousPage"` \| `"isFetchNextPageError"` \| `"isFetchingNextPage"` \| `"isFetchPreviousPageError"` \| `"isFetchingPreviousPage"`)[] \| `"all"` \| (() => \| `"all"` \| ( \| `"error"` \| `"data"` \| `"isError"` \| `"isPending"` \| `"isLoading"` \| `"isLoadingError"` \| `"isRefetchError"` \| `"isSuccess"` \| `"isPlaceholderData"` \| `"status"` \| `"dataUpdatedAt"` \| `"errorUpdatedAt"` \| `"failureCount"` \| `"failureReason"` \| `"errorUpdateCount"` \| `"isFetched"` \| `"isFetchedAfterMount"` \| `"isFetching"` \| `"isInitialLoading"` \| `"isPaused"` \| `"isRefetching"` \| `"isStale"` \| `"isEnabled"` \| `"refetch"` \| `"fetchStatus"` \| `"fetchNextPage"` \| `"fetchPreviousPage"` \| `"hasNextPage"` \| `"hasPreviousPage"` \| `"isFetchNextPageError"` \| `"isFetchingNextPage"` \| `"isFetchPreviousPageError"` \| `"isFetchingPreviousPage"`)[] \| `undefined`) | `undefined` | If set, the component will only re-render if any of the listed properties change. When set to `['data', 'error']`, the component will only re-render when the `data` or `error` properties change. When set to `'all'`, the component will re-render whenever a query is updated. When set to a function, the function will be executed to compute the list of properties. Defaults to `undefined`, in which case property access is tracked automatically, and the component only re-renders when one of the tracked properties changes. |
| <a id="injectInfiniteQueryFn-property-persister"></a> `persister?` | (`queryFn`: (`context`: [`QueryFunctionContext`](../type-aliases/QueryFunctionContext.md)\<`NoInfer`\<`TQueryKey`\>, `TPageParam`\>) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\>, `context`: `object`, `query`: [`Query`](../classes/Query.md)) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\> | `undefined` | This option can be used to persist the result of a query to an external storage, bypassing the need to actually call the `queryFn`. Useful for persisting a query's data across e.g. server/client boundaries. |
| <a id="injectInfiniteQueryFn-property-placeholderdata"></a> `placeholderData?` | \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| ((`previousData`: \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| `undefined`, `previousQuery`: \| [`Query`](../classes/Query.md)\<[`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\> \| `undefined`) => \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| `undefined`) | `undefined` | If set, this value will be used as the placeholder data for this particular query observer while the query is still in the `loading` data and no initialData has been provided. |
| <a id="injectInfiniteQueryFn-property-queryfn"></a> `queryFn?` | \| *typeof* [`skipToken`](../variables/skipToken.md) \| ((`context`: [`QueryFunctionContext`](../type-aliases/QueryFunctionContext.md)\<`TQueryKey`, `TPageParam`\>) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\>) | `undefined` | The function that the query will use to request data. Required, unless a default query function has been set via `queryClient.setQueryDefaults` or `queryClient.setDefaultOptions`. Receives a [QueryFunctionContext](../type-aliases/QueryFunctionContext.md). Must return a promise that will either resolve data or throw an error. The data cannot be `undefined`. |
| <a id="injectInfiniteQueryFn-property-queryhash"></a> `queryHash?` | `string` | `undefined` | The hashed form of `queryKey`, computed with `queryKeyHashFn` (or the default hashing function otherwise). Used as the actual cache key internally. |
| <a id="injectInfiniteQueryFn-property-querykey"></a> `queryKey` | `TQueryKey` & `object` | `undefined` | The query key to use for this query. The query key will be hashed into a stable hash. See [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) for more information. The query will automatically update when this key changes (as long as `enabled` is not set to `false`). |
| <a id="injectInfiniteQueryFn-property-querykeyhashfn"></a> `queryKeyHashFn?` | (`queryKey`: `TQueryKey`) => `string` | `undefined` | If specified, this function is used to hash the `queryKey` to a string. |
| <a id="injectInfiniteQueryFn-property-refetchinterval"></a> `refetchInterval?` | \| `number` \| `false` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `number` \| `false` \| `undefined`) | `false` | If set to a number, the query will continuously refetch at this frequency in milliseconds. If set to a function, the function will be executed with the latest data and query to compute a frequency |
| <a id="injectInfiniteQueryFn-property-refetchintervalinbackground"></a> `refetchIntervalInBackground?` | `boolean` | `false` | If set to `true`, the query will continue to refetch while their tab/window is in the background. |
| <a id="injectInfiniteQueryFn-property-refetchonmount"></a> `refetchOnMount?` | \| `boolean` \| `"always"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` \| `"always"`) | `true` | If set to `true`, the query will refetch on mount if the data is stale. If set to `false`, will disable additional instances of a query to trigger background refetch. If set to `'always'`, the query will always refetch on mount (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value |
| <a id="injectInfiniteQueryFn-property-refetchonreconnect"></a> `refetchOnReconnect?` | \| `boolean` \| `"always"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` \| `"always"`) | `undefined` | If set to `true`, the query will refetch on reconnect if the data is stale. If set to `false`, the query will not refetch on reconnect. If set to `'always'`, the query will always refetch on reconnect (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value. Defaults to `true` unless `networkMode` is `'always'`. |
| <a id="injectInfiniteQueryFn-property-refetchonwindowfocus"></a> `refetchOnWindowFocus?` | \| `boolean` \| `"always"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` \| `"always"`) | `true` | If set to `true`, the query will refetch on window focus if the data is stale. If set to `false`, the query will not refetch on window focus. If set to `'always'`, the query will always refetch on window focus (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value. |
| <a id="injectInfiniteQueryFn-property-retry"></a> `retry?` | \| `number` \| `false` \| `true` \| ((`failureCount`: `number`, `error`: `TError`) => `boolean`) | `undefined` | If `false`, failed queries will not retry by default. If `true`, failed queries will retry infinitely. If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number. If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false. Defaults to `3` on the client and `0` on the server. |
| <a id="injectInfiniteQueryFn-property-retrydelay"></a> `retryDelay?` | `number` \| ((`failureCount`: `number`, `error`: `TError`) => `number`) | `undefined` | This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the next attempt in milliseconds. A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff. A function like `attempt => attempt * 1000` applies linear backoff. Defaults to a function that applies exponential backoff, capped at 30 seconds. |
| <a id="injectInfiniteQueryFn-property-retryonmount"></a> `retryOnMount?` | \| `false` \| `true` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean`) | `true` | If set to `false`, the query will not be retried on mount if it contains an error. If set to a function, the function will be executed with the query to compute the value. |
| <a id="injectInfiniteQueryFn-property-select"></a> `select?` | (`data`: [`InfiniteData`](../interfaces/InfiniteData.md)) => `TData` | `undefined` | This option can be used to transform or select a part of the data returned by the query function. It affects the returned `data` value, but does not affect what gets stored in the query cache. The `select` function will only run if `data` changed, or if the reference to the `select` function itself changes. To optimize, memoize the function so its reference stays stable across calls. |
| <a id="injectInfiniteQueryFn-property-staletime"></a> `staleTime?` | \| `number` \| `"static"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `number` \| `"static"`) | `0` | The time in milliseconds after data is considered stale. If set to `Infinity`, the data will never be considered stale. If set to `'static'`, the data will never be considered stale. If set to a function, the function will be executed with the query to compute a `staleTime`. |
| <a id="injectInfiniteQueryFn-property-structuralsharing"></a> `structuralSharing?` | `boolean` \| ((`oldData`: `unknown`, `newData`: `unknown`) => `unknown`) | `true` | Set this to `false` to disable structural sharing between query results. Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic. |
| <a id="injectInfiniteQueryFn-property-throwonerror"></a> `throwOnError?` | \| `false` \| `true` \| ((`error`: `TError`, `query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean`) | `false` | Whether errors should be thrown instead of setting the `error` property. If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary. If set to `false` and `suspense` is `false`, errors are returned as state. If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`). |

### options?

[`InjectInfiniteQueryOptions`](../interfaces/InjectInfiniteQueryOptions.md)

Additional configuration.

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="options-property-injector"></a> `injector?` | `Injector` | The `Injector` in which to create the infinite query. If this is not provided, the current injection context will be used instead (via `inject`). |

<a id="returns-summary"></a>

## Returns

[`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>

The infinite query result.

<a id="result-properties"></a>

### Result properties

Built from [`BaseQueryNarrowing`](../interfaces/BaseQueryNarrowing.md#properties), [`InfiniteQueryObserverBaseResult`](../interfaces/InfiniteQueryObserverBaseResult.md#properties). See the type above for what it changes.
