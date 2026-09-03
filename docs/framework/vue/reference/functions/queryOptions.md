---
id: queryOptions
title: queryOptions
---

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): DefinedInitialQueryOptionsWithDataTag<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [vue-query/src/queryOptions.ts:162](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L162)

You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
is the query key to generate options for.

This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.

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

`DefinedInitialQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [DefinedInitialQueryOptions](../type-aliases/DefinedInitialQueryOptions.md) to use — everything you can pass to `useQuery`, with
`initialData` set.

### Returns

[`DefinedInitialQueryOptionsWithDataTag`](../type-aliases/DefinedInitialQueryOptionsWithDataTag.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[useQuery](useQuery.md) to run a query with these options.

### Example

```vue
<script setup lang="ts">
import { queryOptions, useQuery } from '@tanstack/vue-query'

const postsOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  initialData: [],
})

// `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
// so the list stays visible alongside the error.
const { data, isError, error } = useQuery(postsOptions)
</script>
```

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): () => DefinedInitialQueryOptionsWithDataTag<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [vue-query/src/queryOptions.ts:198](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L198)

Same as the plain-object overload, but for options that close over reactive state (`ref`s read inside the
function body). Wrap them in a getter so `queryClient` methods like `invalidateQueries`/`fetchQuery` always
read the current values instead of the ones captured when the options were created.

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

() => `DefinedInitialQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function returning the [DefinedInitialQueryOptions](../type-aliases/DefinedInitialQueryOptions.md) to use, re-evaluated on demand.

### Returns

A function that returns the same options object, typed so that `queryKey` carries the inferred data
type.

```ts
(): DefinedInitialQueryOptionsWithDataTag<TQueryFnData, TError, TData, TQueryKey>;
```

#### Returns

[`DefinedInitialQueryOptionsWithDataTag`](../type-aliases/DefinedInitialQueryOptionsWithDataTag.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### See

[useQuery](useQuery.md) to run a query with these options.

### Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { queryOptions, useQuery } from '@tanstack/vue-query'

const postId = ref(1)
const postOptions = queryOptions(() => ({
  queryKey: ['post', postId.value],
  queryFn: () => fetchPost(postId.value),
  initialData: { id: postId.value, title: '' },
}))

const { data } = useQuery(postOptions())
</script>
```

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): UndefinedInitialQueryOptionsWithDataTag<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [vue-query/src/queryOptions.ts:243](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L243)

You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
is the query key to generate options for.

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

`UndefinedInitialQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UndefinedInitialQueryOptions](../type-aliases/UndefinedInitialQueryOptions.md) to use — everything you can pass to `useQuery`.

### Returns

[`UndefinedInitialQueryOptionsWithDataTag`](../type-aliases/UndefinedInitialQueryOptionsWithDataTag.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[useQuery](useQuery.md) to run a query with these options.

### Example

A parameterized factory, so the same options object can be reused per `id`:
```vue
<script setup lang="ts">
import { queryOptions, useQuery } from '@tanstack/vue-query'

function postOptions(id: string) {
  return queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })
}

const { data, isPending, isError, error } = useQuery(postOptions('1'))
</script>
```

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): () => UndefinedInitialQueryOptionsWithDataTag<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [vue-query/src/queryOptions.ts:288](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L288)

Same as the plain-object overload, but for options that close over reactive state (`ref`s read inside the
function body). Wrap them in a getter so the `queryKey` — and anything else derived from a `ref` — reacts
to changes, and so `queryClient` methods like `invalidateQueries`/`fetchQuery` always read the current
values instead of the ones captured when the options were created.

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

() => `UndefinedInitialQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function returning the [UndefinedInitialQueryOptions](../type-aliases/UndefinedInitialQueryOptions.md) to use, re-evaluated on
demand.

### Returns

A function that returns the same options object, typed so that `queryKey` carries the inferred
data type.

```ts
(): UndefinedInitialQueryOptionsWithDataTag<TQueryFnData, TError, TData, TQueryKey>;
```

#### Returns

[`UndefinedInitialQueryOptionsWithDataTag`](../type-aliases/UndefinedInitialQueryOptionsWithDataTag.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### See

[useQuery](useQuery.md) to run a query with these options.

### Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { queryOptions, useQuery } from '@tanstack/vue-query'

const postId = ref(1)
const postOptions = queryOptions(() => ({
  queryKey: ['post', postId.value],
  queryFn: () => fetchPost(postId.value),
}))

// Reacts to changes on postId.value, and reads the current queryKey when invalidating.
const { data } = useQuery(postOptions())
const queryClient = useQueryClient()
queryClient.invalidateQueries(postOptions())
</script>
```
