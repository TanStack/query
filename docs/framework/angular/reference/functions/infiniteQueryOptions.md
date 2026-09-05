---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [infinite-query-options.ts:181](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/infinite-query-options.ts#L181)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to
`injectInfiniteQuery`. These options can be shared across functions and imperative APIs such as
`queryClient.fetchInfiniteQuery`. `options.queryKey` is required and is the query key to generate options
for.

This overload is selected when `initialData` is set.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [DefinedInitialDataInfiniteOptions](../type-aliases/DefinedInitialDataInfiniteOptions.md) to use — everything you can pass to
`injectInfiniteQuery`, with `initialData` set.

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[injectInfiniteQuery](injectInfiniteQuery.md) to run an infinite query with these options.

### Remarks

See [injectInfiniteQuery](injectInfiniteQuery.md) for examples that fetch further pages, from a button click or
automatically as the user scrolls.

### Example

```angular-ts
import { infiniteQueryOptions, injectInfiniteQuery } from '@tanstack/angular-query-experimental'

export const projectsOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
  initialData: { pages: [], pageParams: [] },
})

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
  projectsQuery = injectInfiniteQuery(() => projectsOptions)
}
```

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): OmitKeyof<CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [infinite-query-options.ts:255](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/infinite-query-options.ts#L255)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to
`injectInfiniteQuery`. These options can be shared across functions and imperative APIs such as
`queryClient.fetchInfiniteQuery`. `options.queryKey` is required and is the query key to generate options
for.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`UnusedSkipTokenInfiniteOptions`](../type-aliases/UnusedSkipTokenInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UnusedSkipTokenInfiniteOptions](../type-aliases/UnusedSkipTokenInfiniteOptions.md) to use — everything you can pass to
`injectInfiniteQuery`.

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### Remarks

See [injectInfiniteQuery](injectInfiniteQuery.md) for examples that fetch further pages, from a button click or
automatically as the user scrolls.

### Example

A parameterized factory, so the same options object can be reused per `postId`:
```angular-ts
import { infiniteQueryOptions, injectInfiniteQuery } from '@tanstack/angular-query-experimental'

export const commentsOptions = (postId: string) =>
  infiniteQueryOptions({
    queryKey: ['post', postId, 'comments'],
    queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  })

@Component({
  selector: 'comments',
  template: `
    @if (commentsQuery.isPending()) {
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
  postId = signal('1')
  commentsQuery = injectInfiniteQuery(() => commentsOptions(this.postId()))
}
```

### See

[injectInfiniteQuery](injectInfiniteQuery.md) to run an infinite query with these options.

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [infinite-query-options.ts:329](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/infinite-query-options.ts#L329)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to
`injectInfiniteQuery`. These options can be shared across functions and imperative APIs such as
`queryClient.fetchInfiniteQuery`. `options.queryKey` is required and is the query key to generate options
for.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything you can pass to
`injectInfiniteQuery`.

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### Remarks

See [injectInfiniteQuery](injectInfiniteQuery.md) for examples that fetch further pages (from a button click or
automatically as the user scrolls) and that use `skipToken` to disable the query until `postId` is set.

### Example

A parameterized factory, so the same options object can be reused per `postId`:
```angular-ts
import { infiniteQueryOptions, injectInfiniteQuery } from '@tanstack/angular-query-experimental'

export const commentsOptions = (postId: string) =>
  infiniteQueryOptions({
    queryKey: ['post', postId, 'comments'],
    queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  })

@Component({
  selector: 'comments',
  template: `
    @if (commentsQuery.isPending()) {
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
  postId = signal('1')
  commentsQuery = injectInfiniteQuery(() => commentsOptions(this.postId()))
}
```

### See

[injectInfiniteQuery](injectInfiniteQuery.md) to run an infinite query with these options.
