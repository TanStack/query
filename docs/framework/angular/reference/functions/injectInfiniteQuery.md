---
id: injectInfiniteQuery
title: injectInfiniteQuery
---

## Call Signature

```ts
function injectInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(injectInfiniteQueryFn, options?): DefinedCreateInfiniteQueryResult<TData, TError>;
```

Defined in: [inject-infinite-query.ts:83](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-infinite-query.ts#L83)

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

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

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

## Call Signature

```ts
function injectInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(injectInfiniteQueryFn, options?): CreateInfiniteQueryResult<TData, TError>;
```

Defined in: [inject-infinite-query.ts:239](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-infinite-query.ts#L239)

Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a
unique key. Infinite queries can additively "load more" data onto an existing set of data, or
"infinite scroll".

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

## Call Signature

```ts
function injectInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(injectInfiniteQueryFn, options?): CreateInfiniteQueryResult<TData, TError>;
```

Defined in: [inject-infinite-query.ts:267](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-infinite-query.ts#L267)

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

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

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
