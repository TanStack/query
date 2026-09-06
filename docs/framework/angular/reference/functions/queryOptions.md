---
id: queryOptions
title: queryOptions
---

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): Omit<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [query-options.ts:151](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L151)

You can generally pass everything to `queryOptions` that you can also pass to `injectQuery`. These options
can be shared across functions and imperative APIs such as `queryClient.fetchQuery`. `options.queryKey` is
required and is the query key to generate options for.

This overload is selected when `initialData` is set, so the resulting `data` is never `undefined` (unless
a `select` changes `TData` to include `undefined`).

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

#### options

[`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [DefinedInitialDataOptions](../type-aliases/DefinedInitialDataOptions.md) to use — everything you can pass to `injectQuery`,
with `initialData` set.

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### See

 - [injectQuery](injectQuery.md) to run a query with these options.
 - [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) for more on this pattern.

### Example

```angular-ts
import { queryOptions, injectQuery } from '@tanstack/angular-query-experimental'

export const postsOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  initialData: [],
})

@Component({
  selector: 'posts',
  template: `
    <!-- `postsQuery.data()` is never `undefined`, thanks to `initialData` — even if a refetch
    fails, so the list stays visible alongside the error. -->
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
  readonly postsQuery = injectQuery(() => postsOptions)
}
```

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): OmitKeyof<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [query-options.ts:200](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L200)

You can generally pass everything to `queryOptions` that you can also pass to `injectQuery`. These options
can be shared across functions and imperative APIs such as `queryClient.fetchQuery`. `options.queryKey` is
required and is the query key to generate options for.

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

#### options

[`UnusedSkipTokenOptions`](../type-aliases/UnusedSkipTokenOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UnusedSkipTokenOptions](../type-aliases/UnusedSkipTokenOptions.md) to use — everything you can pass to `injectQuery`.

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### See

 - [injectQuery](injectQuery.md) to run a query with these options.
 - [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) for more on this pattern.

### Example

A parameterized factory, so the same options object can be reused per `id`:
```angular-ts
import { queryOptions, injectQuery } from '@tanstack/angular-query-experimental'

export const postOptions = (id: string) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

@Component({
  selector: 'post',
  template: `
    @if (postQuery.isPending()) {
      Loading...
    } @else if (postQuery.isError()) {
      <span>Error: {{ postQuery.error()?.message }}</span>
    } @else {
      <h1>{{ postQuery.data().title }}</h1>
    }
  `,
})
export class Post {
  readonly id = signal('1')
  readonly postQuery = injectQuery(() => postOptions(this.id()))
}
```

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [query-options.ts:281](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L281)

You can generally pass everything to `queryOptions` that you can also pass to `injectQuery`. These options
can be shared across functions and imperative APIs such as `queryClient.fetchQuery`. `options.queryKey` is
required and is the query key to generate options for.

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

#### options

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UndefinedInitialDataOptions](../type-aliases/UndefinedInitialDataOptions.md) to use — everything you can pass to `injectQuery`.

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### See

 - [injectQuery](injectQuery.md) to run a query with these options.
 - [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) for more on this pattern.

### Remarks

This is the only overload that accepts `queryFn: skipToken`, shown below.

### Examples

A parameterized factory, so the same options object can be reused per `id`:
```angular-ts
import { queryOptions, injectQuery } from '@tanstack/angular-query-experimental'

export const postOptions = (id: string) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

@Component({
  selector: 'post',
  template: `
    @if (postQuery.isPending()) {
      Loading...
    } @else if (postQuery.isError()) {
      <span>Error: {{ postQuery.error()?.message }}</span>
    } @else {
      <h1>{{ postQuery.data().title }}</h1>
    }
  `,
})
export class Post {
  readonly id = signal('1')
  readonly postQuery = injectQuery(() => postOptions(this.id()))
}
```

A factory that disables the query, type safe, until `postId` is set:
```angular-ts
import { queryOptions, skipToken, injectQuery } from '@tanstack/angular-query-experimental'

export const postOptions = (postId: number | undefined) =>
  queryOptions({
    queryKey: ['post', postId],
    queryFn: postId != null ? () => fetchPost(postId) : skipToken,
  })

@Component({
  selector: 'post',
  template: `
    @if (postId() == null) {
      Select a post
    } @else if (postQuery.isPending()) {
      Loading...
    } @else if (postQuery.isError()) {
      <span>Error: {{ postQuery.error()?.message }}</span>
    } @else {
      <h1>{{ postQuery.data().title }}</h1>
    }
  `,
})
export class Post {
  readonly postId = signal<number | undefined>(undefined)
  readonly postQuery = injectQuery(() => postOptions(this.postId()))
}
```
