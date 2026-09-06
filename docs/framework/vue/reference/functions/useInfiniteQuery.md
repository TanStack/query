---
id: useInfiniteQuery
title: useInfiniteQuery
---

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseInfiniteQueryReturnType<TData, TError>;
```

Defined in: [packages/vue-query/src/useInfiniteQuery.ts:117](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useInfiniteQuery.ts#L117)

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.

`enabled` tracks reactive dependencies automatically as a `ref`, a plain value, or a reactive getter
(`() => ...`). `queryKey` reacts through a `ref` for the array itself, or `ref`s and reactive getters as
individual entries — the array itself can't be a bare getter.

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

#### options

`MaybeRefOrGetter`\<[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

The [DefinedInitialDataInfiniteOptions](../type-aliases/DefinedInitialDataInfiniteOptions.md) to use — everything you can pass to
`useInfiniteQuery`, with `initialData` set.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
will be used.

### Returns

[`UseInfiniteQueryReturnType`](../type-aliases/UseInfiniteQueryReturnType.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
`hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.value.pages` and
`data.value.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
`InfiniteData<TQueryFnData>` shape.

### Remarks

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
actions, or add conditions like `hasNextPage && !isFetching`.

### Example

```vue
<script setup lang="ts">
import { useInfiniteQuery } from '@tanstack/vue-query'

// `data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
// list stays visible alongside the error.
const { data, isError, error } = useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
  initialData: { pages: [], pageParams: [] },
})
</script>

<template>
  <span v-if="isError">Error: {{ error.message }}</span>
  <ul>
    <template v-for="page in data.pages" :key="page.nextId">
      <li v-for="project in page.projects" :key="project.id">{{ project.name }}</li>
    </template>
  </ul>
</template>
```

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseInfiniteQueryReturnType<TData, TError>;
```

Defined in: [packages/vue-query/src/useInfiniteQuery.ts:251](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useInfiniteQuery.ts#L251)

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

`enabled` tracks reactive dependencies automatically as a `ref`, a plain value, or a reactive getter
(`() => ...`). `queryKey` reacts through a `ref` for the array itself, or `ref`s and reactive getters as
individual entries — the array itself can't be a bare getter.

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

#### options

`MaybeRefOrGetter`\<[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

The [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything you can pass to
`useInfiniteQuery`.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
will be used.

### Returns

[`UseInfiniteQueryReturnType`](../type-aliases/UseInfiniteQueryReturnType.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
`hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.value.pages` and
`data.value.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
`InfiniteData<TQueryFnData>` shape.

### Remarks

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
actions, or add conditions like `hasNextPage && !isFetching`.

### Examples

Fetching the next page from a "Load More" button click:
```vue
<script setup lang="ts">
import { useInfiniteQuery } from '@tanstack/vue-query'

const {
  data,
  isPending,
  isError,
  error,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
})
</script>

<template>
  <span v-if="isPending">Loading...</span>
  <span v-else-if="isError">Error: {{ error.message }}</span>
  <template v-else>
    <ul>
      <template v-for="page in data.pages" :key="page.nextId">
        <li v-for="project in page.projects" :key="project.id">{{ project.name }}</li>
      </template>
    </ul>
    <button @click="fetchNextPage()" :disabled="!hasNextPage || isFetching">
      {{ isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load More' : 'Nothing more to load' }}
    </button>
  </template>
</template>
```

Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a
sentinel element after the list:
```vue
<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { useInfiniteQuery } from '@tanstack/vue-query'

const {
  data,
  isPending,
  isError,
  error,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
})

const sentinel = ref<HTMLElement>()
let observer: IntersectionObserver | undefined

watch(sentinel, (el) => {
  observer?.disconnect()
  if (el == null) return

  observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting && hasNextPage.value && !isFetching.value) {
      fetchNextPage()
    }
  })
  observer.observe(el)
})

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <span v-if="isPending">Loading...</span>
  <span v-else-if="isError">Error: {{ error.message }}</span>
  <template v-else>
    <ul>
      <template v-for="page in data.pages" :key="page.nextId">
        <li v-for="project in page.projects" :key="project.id">{{ project.name }}</li>
      </template>
    </ul>
    <div ref="sentinel">{{ isFetchingNextPage ? 'Loading more...' : '' }}</div>
  </template>
</template>
```

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseInfiniteQueryReturnType<TData, TError>;
```

Defined in: [packages/vue-query/src/useInfiniteQuery.ts:347](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useInfiniteQuery.ts#L347)

Fallback overload for options whose `initialData` presence isn't statically known — for example, a
`ref`/reactive object built up conditionally, rather than a plain object literal. Prefer one of the other
overloads when possible, since they infer whether `data` can be `undefined` from `initialData` directly.

`enabled` tracks reactive dependencies automatically as a `ref`, a plain value, or a reactive getter
(`() => ...`). `queryKey` reacts through a `ref` for the array itself, or `ref`s and reactive getters as
individual entries — the array itself can't be a bare getter.

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

#### options

`MaybeRefOrGetter`\<[`UseInfiniteQueryOptions`](../type-aliases/UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

A `ref`, plain value, or reactive getter resolving to the [UseInfiniteQueryOptions](../type-aliases/UseInfiniteQueryOptions.md) to
use.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
will be used.

### Returns

[`UseInfiniteQueryReturnType`](../type-aliases/UseInfiniteQueryReturnType.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
`hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`.

### Examples

Passing a whole-options getter so `maxPages` reacts to a setting stored elsewhere, not just `queryKey`:
```vue
<script setup lang="ts">
import { useInfiniteQuery } from '@tanstack/vue-query'

const props = defineProps<{ projectId: number; maxPages: number }>()

const { data } = useInfiniteQuery(() => ({
  queryKey: ['project', props.projectId, 'issues'],
  queryFn: ({ pageParam }) => fetchIssues(props.projectId, pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
  maxPages: props.maxPages,
}))
</script>

<template>
  <template v-for="page in data?.pages" :key="page.nextId">
    <li v-for="issue in page.issues" :key="issue.id">{{ issue.title }}</li>
  </template>
</template>
```

A query that's disabled, type-safe, until `postId` is set — pass `skipToken` as `queryFn` instead of
setting `enabled: false`. This requires a whole-options getter: `queryFn` isn't itself reactive, so the
getter is what re-evaluates it on every change to `props.postId`:
```vue
<script setup lang="ts">
import { skipToken, useInfiniteQuery } from '@tanstack/vue-query'

const props = defineProps<{ postId: string | undefined }>()

// Use `isLoading`, not `isPending`, so the loading state doesn't show while the query is disabled.
const { data, isLoading, isError, error } = useInfiniteQuery(() => {
  const postId = props.postId
  return {
    queryKey: ['post', postId, 'comments'],
    queryFn:
      postId != null
        ? ({ pageParam }) => fetchComments(postId, pageParam)
        : skipToken,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  }
})
</script>

<template>
  <span v-if="props.postId == null">Select a post</span>
  <span v-else-if="isLoading">Loading...</span>
  <span v-else-if="isError">Error: {{ error.message }}</span>
  <ul v-else>
    <template v-for="page in data.pages" :key="page.nextId">
      <li v-for="comment in page.comments" :key="comment.id">{{ comment.text }}</li>
    </template>
  </ul>
</template>
```
