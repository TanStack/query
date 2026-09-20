---
id: injectQuery
title: injectQuery
---

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(optionsFn: () => DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): DefinedCreateQueryResult<TData, TError>;
```

Defined in: [packages/angular-query/src/inject-query.ts:61](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-query.ts#L61)

This overload is selected when `initialData` is set on the options returned by `optionsFn`, so the
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

#### optionsFn

() => [`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function returning the [DefinedInitialDataOptions](../type-aliases/DefinedInitialDataOptions.md) to use — everything you
can pass to `injectQuery`, with `initialData` set. Similar to `computed` from Angular, this function runs
in the reactive context, so signals read inside it (in `queryKey`, `enabled`, etc.) drive the query.

### Returns

[`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`TData`, `TError`\>

The query result, typed so that `data` is never `undefined` (unless a `select` changes `TData` to
include `undefined`).

### See

 - https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 - [queryOptions](queryOptions.md) to share these options between `injectQuery` and imperative APIs like
`queryClient.query`.

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

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(optionsFn: () => UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): CreateQueryResult<TData, TError>;
```

Defined in: [packages/angular-query/src/inject-query.ts:147](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-query.ts#L147)

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

#### optionsFn

() => [`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function returning the [UndefinedInitialDataOptions](../type-aliases/UndefinedInitialDataOptions.md) to use — everything
you can pass to `injectQuery`. Similar to `computed` from Angular, this function runs in the reactive
context, so signals read inside it (in `queryKey`, `enabled`, etc.) drive the query.

### Returns

[`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>

The query result. `status()` is `'pending'` if there is no cached data to display, `'error'` if
the last fetch attempt failed, or `'success'` if the query has data to display. `isPending`/`isSuccess`/
`isError` are type-guard methods for convenience.

### See

 - https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 - [queryOptions](queryOptions.md) to share these options between `injectQuery` and imperative APIs like
`queryClient.query`.

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
    enabled: !!this.filter(),
  }))
}
```

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(optionsFn: () => CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>): CreateQueryResult<TData, TError>;
```

Defined in: [packages/angular-query/src/inject-query.ts:171](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-query.ts#L171)

This overload accepts the general [CreateQueryOptions](../type-aliases/CreateQueryOptions.md) shape rather than the `initialData`-aware
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

#### optionsFn

() => [`CreateQueryOptions`](../type-aliases/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function that returns query options. Similar to `computed` from Angular, this
function runs in the reactive context, so signals read inside it drive the query.

### Returns

[`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>

The query result.

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries
