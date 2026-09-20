---
id: injectInfiniteQuery
title: injectInfiniteQuery
---

## Call Signature

```ts
function injectInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(optionsFn: () => DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): DefinedCreateInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/angular-query/src/inject-infinite-query.ts:39](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-infinite-query.ts#L39)

This overload is selected when `initialData` is set, so the resulting `data` signal is never `undefined`
(unless a `select` changes `TData` to include `undefined`).

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

#### optionsFn

() => [`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

A function returning infinite-query options with `initialData` set. Similar to
`computed` from Angular, this function runs in the reactive context.

### Returns

[`DefinedCreateInfiniteQueryResult`](../type-aliases/DefinedCreateInfiniteQueryResult.md)\<`TData`, `TError`\>

The infinite query result, typed so that `data` is never `undefined`.

### See

 - https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
 - [infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `injectInfiniteQuery` and
`queryClient.infiniteQuery`.

## Call Signature

```ts
function injectInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(optionsFn: () => UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): CreateInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/angular-query/src/inject-infinite-query.ts:95](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-infinite-query.ts#L95)

Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
Infinite queries can additively "load more" data onto an existing set of data or support infinite scroll.

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

#### optionsFn

() => [`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

A function that returns infinite query options. Similar to `computed` from Angular,
this function runs in the reactive context, so signals read inside it drive the query.

### Returns

[`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>

The infinite query result.

### See

 - https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
 - [infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `injectInfiniteQuery` and
`queryClient.infiniteQuery`.

### Example

```angular-ts
@Component({
  selector: 'projects',
  template: `
    @if (query.isPending()) {
      Loading...
    } @else if (query.isError()) {
      <span>Error: {{ query.error()?.message }}</span>
    } @else {
      @for (page of query.data().pages; track $index) {
        @for (project of page; track project.id) {
          <p>{{ project.name }}</p>
        }
      }
      <button (click)="query.fetchNextPage()">Load more</button>
    }
  `,
})
export class Projects {
  readonly query = injectInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }))
}
```

## Call Signature

```ts
function injectInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(optionsFn: () => CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): CreateInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/angular-query/src/inject-infinite-query.ts:121](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-infinite-query.ts#L121)

This overload accepts the general [CreateInfiniteQueryOptions](../interfaces/CreateInfiniteQueryOptions.md) shape rather than the
`initialData`-aware overloads above, so whether `data` is defined can't be inferred from the call
site — useful when wrapping `injectInfiniteQuery` in your own helper.

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

#### optionsFn

() => [`CreateInfiniteQueryOptions`](../interfaces/CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

A function that returns infinite query options. Similar to `computed` from Angular,
this function runs in the reactive context, so signals read inside it drive the query.

### Returns

[`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>

The infinite query result.

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
