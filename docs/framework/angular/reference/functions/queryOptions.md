---
id: queryOptions
title: queryOptions
---

## Overview

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey>): UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

- [`DefinedInitialDataOptions` → `DefinedInitialDataOptions & QueryKeyWithDataTag`](#call-signature-1): You can generally pass everything to `queryOptions` that you can also pass to `injectQuery`. These options can be shared across functions and imperative APIs such as `queryClient.fetchQuery`. `options.queryKey` is required and is the query key to generate options for.
- [`UnusedSkipTokenOptions` → `UnusedSkipTokenOptions & QueryKeyWithDataTag`](#call-signature-2): You can generally pass everything to `queryOptions` that you can also pass to `injectQuery`. These options can be shared across functions and imperative APIs such as `queryClient.fetchQuery`. `options.queryKey` is required and is the query key to generate options for.
- [`UndefinedInitialDataOptions` → `UndefinedInitialDataOptions & QueryKeyWithDataTag`](#call-signature-3): You can generally pass everything to `queryOptions` that you can also pass to `injectQuery`. These options can be shared across functions and imperative APIs such as `queryClient.fetchQuery`. `options.queryKey` is required and is the query key to generate options for.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/angular-query-experimental/src/query-options.ts:146](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L146)

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

[`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>

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

<a id="call-signature-2"></a>

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey>): UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/angular-query-experimental/src/query-options.ts:193](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L193)

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

[`UnusedSkipTokenOptions`](../type-aliases/UnusedSkipTokenOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>

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

<a id="call-signature-3"></a>

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/angular-query-experimental/src/query-options.ts:271](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L271)

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

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### Remarks

This is the only overload that accepts `queryFn: skipToken`, shown below.

### See

 - [injectQuery](injectQuery.md) to run a query with these options.
 - [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) for more on this pattern.

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

<a id="parameters-summary"></a>

## Parameters

### options

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UndefinedInitialDataOptions](../type-aliases/UndefinedInitialDataOptions.md) to use — everything you can pass to `injectQuery`.

<a id="options-properties"></a>

#### `options` properties

Built from [`CreateQueryOptions`](../interfaces/CreateQueryOptions.md#properties). See the type above for what it changes.

<a id="returns-summary"></a>

## Returns

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

<a id="result-properties"></a>

### Result properties

Built from [`CreateQueryOptions`](../interfaces/CreateQueryOptions.md#properties), [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md#properties). See the type above for what it changes.
