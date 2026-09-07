---
id: usePrefetchInfiniteQuery
title: usePrefetchInfiniteQuery
---

```ts
function usePrefetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): void;
```

Defined in: [packages/vue-query/src/usePrefetchInfiniteQuery.ts:94](https://github.com/TanStack/query/blob/main/packages/vue-query/src/usePrefetchInfiniteQuery.ts#L94)

`usePrefetchInfiniteQuery` does not return anything — it fires a prefetch as a reactive side effect, useful
for kicking off a fetch ahead of the component that will actually render the data with `useInfiniteQuery`.
You can pass everything to `usePrefetchInfiniteQuery` that you can pass to `queryClient.infiniteQuery`,
though `queryKey`, `initialPageParam`, and `getNextPageParam` are always required, and `queryFn` is required
unless a default query function has been defined.

`getNextPageParam` receives both the last page of the infinite list of data and the full array of all pages,
as well as pageParam information, and should return a single variable that will be passed to your query
function as `context.pageParam`. Return `undefined` or `null` to indicate there is no next page available.

The prefetch is skipped if the query already has any cached state — including a `pending`/`error` state left
over from a previous attempt — so it won't refetch data that's already there or already in flight. It
re-runs whenever a reactive dependency in `options` (built with `infiniteQueryOptions`, for example) changes.

Fire this during render, before a suspense boundary that wraps a component using `useInfiniteQuery`'s
`suspense()` — see the [Suspense guide](https://tanstack.com/query/latest/docs/framework/vue/guides/suspense).

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `Error`

### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### TPageParam

`TPageParam` = `unknown`

## Parameters

### options

`MaybeRefOrGetter`\<`MaybeRefDeep`\<[`UsePrefetchInfiniteQueryOptions`](../type-aliases/UsePrefetchInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>\>

A `ref`, plain value, or reactive getter resolving to the
[UsePrefetchInfiniteQueryOptions](../type-aliases/UsePrefetchInfiniteQueryOptions.md) to use — everything you can pass to `queryClient.infiniteQuery`.

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
will be used.

## Returns

`void`

`void` — nothing is returned.

## Example

```vue
<script setup lang="ts">
import { infiniteQueryOptions, usePrefetchInfiniteQuery } from '@tanstack/vue-query'
import Projects from './Projects.vue'

const projectsOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
})

// Fire the prefetch as soon as this component runs, before `Projects` mounts and calls `useInfiniteQuery`.
usePrefetchInfiniteQuery(projectsOptions)
</script>

<template>
  <Projects />
</template>
```
