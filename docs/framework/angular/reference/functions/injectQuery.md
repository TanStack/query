---
id: injectQuery
title: injectQuery
---

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(injectQueryFn, options?): DefinedCreateQueryResult<TData, TError>;
```

Defined in: [inject-query.ts:69](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L69)

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
  postsQuery = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    initialData: [],
  }))
}
```

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(injectQueryFn, options?): CreateQueryResult<TData, TError>;
```

Defined in: [inject-query.ts:158](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L158)

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
  postsQuery = injectQuery(() => ({
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
  filter = signal('')

  postsQuery = injectQuery(() => ({
    queryKey: ['posts', this.filter()],
    queryFn: () => fetchPosts(this.filter()),
    // Signals can be combined with expressions
    enabled: !!this.filter(),
  }))
}
```

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(injectQueryFn, options?): CreateQueryResult<TData, TError>;
```

Defined in: [inject-query.ts:185](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L185)

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
