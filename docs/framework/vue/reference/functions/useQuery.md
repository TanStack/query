---
id: useQuery
title: useQuery
---

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryDefinedReturnType<TData, TError>;
```

Defined in: [packages/vue-query/src/useQuery.ts:138](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQuery.ts#L138)

This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.

`enabled` tracks reactive dependencies automatically as a `ref`, a plain value, or a reactive getter
(`() => ...`). `queryKey` reacts through a `ref` for the array itself, or `ref`s and reactive getters as
individual entries — the array itself can't be a bare getter. Other options are read once and are not
reactive.

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

Defined in: [packages/vue-query/src/useQuery.ts:279](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQuery.ts#L279)

`enabled` tracks reactive dependencies automatically as a `ref`, a plain value, or a reactive getter
(`() => ...`). `queryKey` reacts through a `ref` for the array itself, or `ref`s and reactive getters as
individual entries — the array itself can't be a bare getter. Other options are read once and are not
reactive.

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

### Examples

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

`select` derives whatever `data` a component needs from the cached value, without changing what's
actually stored in the cache — the cache still holds the full `Post[]`, but `data` here is a `number`:
```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

const { data, isPending, isError, error } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  select: (posts) => posts.length,
})
</script>

<template>
  <span v-if="isPending">Loading...</span>
  <span v-else-if="isError">Error: {{ error.message }}</span>
  <span v-else>{{ data }} posts</span>
</template>
```

A dependent query, only enabled once `postId` is set — use `isLoading`, not `isPending`, so the
loading state doesn't show while the query is disabled:
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'

const props = defineProps<{ postId: number | undefined }>()

const { data, isLoading, isError, error } = useQuery({
  queryKey: ['post', props.postId],
  queryFn: () => fetchPost(props.postId!),
  enabled: () => props.postId != null,
})
</script>

<template>
  <span v-if="props.postId == null">Select a post</span>
  <span v-else-if="isLoading">Loading...</span>
  <span v-else-if="isError">Error: {{ error.message }}</span>
  <h1 v-else>{{ data?.title }}</h1>
</template>
```

Seeding a detail query from an already-cached list, to skip the loading state:
```vue
<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'

const props = defineProps<{ postId: number }>()
const queryClient = useQueryClient()

const { data, isError, error } = useQuery({
  queryKey: ['post', props.postId],
  queryFn: () => fetchPost(props.postId),
  initialData: () =>
    queryClient
      .getQueryData<Array<Post>>(['posts'])
      ?.find((post) => post.id === props.postId),
})
</script>

<template>
  <span v-if="isError">Error: {{ error.message }}</span>
  <h1 v-else>{{ data?.title }}</h1>
</template>
```

Paginated data, keeping the previous page's data visible while the next page loads:
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'

const page = ref(0)

const { data, isPlaceholderData, isError, error } = useQuery({
  queryKey: ['posts', page],
  queryFn: () => fetchPosts(page.value),
  placeholderData: keepPreviousData,
})
</script>

<template>
  <span v-if="isError">Error: {{ error.message }}</span>
  <template v-else>
    <ul>
      <li v-for="post in data" :key="post.id">{{ post.title }}</li>
    </ul>
    <button :disabled="isPlaceholderData" @click="page++">Next Page</button>
  </template>
</template>
```

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryReturnType<TData, TError>;
```

Defined in: [packages/vue-query/src/useQuery.ts:355](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQuery.ts#L355)

Fallback overload for options whose `initialData` presence isn't statically known — for example, a
`ref`/reactive object built up conditionally, rather than a plain object literal. Prefer one of the other
overloads when possible, since they infer whether `data` can be `undefined` from `initialData` directly.

`enabled` tracks reactive dependencies automatically as a `ref`, a plain value, or a reactive getter
(`() => ...`). `queryKey` reacts through a `ref` for the array itself, or `ref`s and reactive getters as
individual entries — the array itself can't be a bare getter.

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

### Examples

Passing a whole-options getter so `staleTime` reacts to a setting stored elsewhere, not just `queryKey`:
```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

const props = defineProps<{ id: number; staleTime: number }>()

const { data } = useQuery(() => ({
  queryKey: ['post', props.id],
  queryFn: () => fetchPost(props.id),
  staleTime: props.staleTime,
}))
</script>

<template>
  <h1 v-if="data">{{ data.title }}</h1>
</template>
```

`skipToken` disables the query in a type-safe way, without a non-null assertion on `props.postId` —
`queryFn` is only ever called when it's defined. This requires a whole-options getter: `queryFn` is a
single value, not `queryKey`/`enabled`, so it isn't itself reactive — the getter is what re-evaluates it
on every change to `props.postId`. `refetch` doesn't work while `queryFn` is `skipToken` — use
`enabled: false` instead if you need to trigger the query manually:
```vue
<script setup lang="ts">
import { skipToken, useQuery } from '@tanstack/vue-query'

const props = defineProps<{ postId: number | undefined }>()

const { data, isLoading, isError, error } = useQuery(() => {
  const postId = props.postId
  return {
    queryKey: ['post', postId],
    queryFn: postId != null ? () => fetchPost(postId) : skipToken,
  }
})
</script>

<template>
  <span v-if="props.postId == null">Select a post</span>
  <span v-else-if="isLoading">Loading...</span>
  <span v-else-if="isError">Error: {{ error.message }}</span>
  <h1 v-else>{{ data?.title }}</h1>
</template>
```
