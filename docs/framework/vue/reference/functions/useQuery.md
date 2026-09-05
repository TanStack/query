---
id: useQuery
title: useQuery
---

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryDefinedReturnType<TData, TError>;
```

Defined in: [vue-query/src/useQuery.ts:137](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQuery.ts#L137)

This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.

`queryKey` and `enabled` track reactive dependencies automatically — pass a `ref`, a plain value, or a
reactive getter (`() => ...`) and the query reacts to changes without any extra wiring. Other options are
read once and are not reactive.

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

[`DefinedInitialQueryOptions`](../type-aliases/DefinedInitialQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [DefinedInitialQueryOptions](../type-aliases/DefinedInitialQueryOptions.md) to use — everything you can pass to `useQuery`, with
`initialData` set.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
will be used.

### Returns

[`UseQueryDefinedReturnType`](../type-aliases/UseQueryDefinedReturnType.md)\<`TData`, `TError`\>

The current query result, typed so that `data` is never `undefined` (`status` never resolves to
`pending` in this overload's type, since `initialData` guarantees data upfront).

### Example

```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

// `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
// so the list stays visible alongside the error.
const { data, isError, error } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  initialData: [],
})
</script>

<template>
  <span v-if="isError">Error: {{ error.message }}</span>
  <ul>
    <li v-for="post in data" :key="post.id">{{ post.title }}</li>
  </ul>
</template>
```

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryReturnType<TData, TError>;
```

Defined in: [vue-query/src/useQuery.ts:179](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQuery.ts#L179)

`queryKey` and `enabled` track reactive dependencies automatically — pass a `ref`, a plain value, or a
reactive getter (`() => ...`) and the query reacts to changes without any extra wiring. Other options are
read once and are not reactive.

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

[`UndefinedInitialQueryOptions`](../type-aliases/UndefinedInitialQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UndefinedInitialQueryOptions](../type-aliases/UndefinedInitialQueryOptions.md) to use — everything you can pass to `useQuery`.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
will be used.

### Returns

[`UseQueryReturnType`](../type-aliases/UseQueryReturnType.md)\<`TData`, `TError`\>

The current query result. `status` is `pending` if there is no cached data to display, `error` if
the last fetch attempt failed, or `success` if the query has data to display.

### Example

A query key built from a reactive `ref` — the query refetches whenever `postId` changes:
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'

const postId = ref(1)
const { status, data, error } = useQuery({
  queryKey: ['post', postId],
  queryFn: () => fetchPost(postId.value),
})
</script>

<template>
  <span v-if="status === 'pending'">Loading...</span>
  <span v-else-if="status === 'error'">Error: {{ error.message }}</span>
  <h1 v-else>{{ data.title }}</h1>
</template>
```

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryReturnType<TData, TError>;
```

Defined in: [vue-query/src/useQuery.ts:205](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQuery.ts#L205)

Fallback overload for options whose `initialData` presence isn't statically known — for example, a
`ref`/reactive object built up conditionally, rather than a plain object literal. Prefer one of the other
overloads when possible, since they infer whether `data` can be `undefined` from `initialData` directly.

`queryKey` and `enabled` track reactive dependencies automatically — pass a `ref`, a plain value, or a
reactive getter (`() => ...`) and the query reacts to changes without any extra wiring.

When `options` itself is a reactive getter, the whole object is re-evaluated on every change to its
dependencies, so any option inside it — not just `queryKey` and `enabled` — can change over time.

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

`MaybeRefOrGetter`\<[`UseQueryOptions`](../type-aliases/UseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`\>\>

A `ref`, plain value, or reactive getter resolving to the [UseQueryOptions](../type-aliases/UseQueryOptions.md) to use.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
will be used.

### Returns

[`UseQueryReturnType`](../type-aliases/UseQueryReturnType.md)\<`TData`, `TError`\>

The current query result, with `data` typed as possibly `undefined`.
