---
id: usePrefetchQuery
title: usePrefetchQuery
---

```ts
function usePrefetchQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey>(options, queryClient?): void;
```

Defined in: [packages/vue-query/src/usePrefetchQuery.ts:86](https://github.com/TanStack/query/blob/main/packages/vue-query/src/usePrefetchQuery.ts#L86)

`usePrefetchQuery` does not return anything — it fires a prefetch as a reactive side effect, useful for
kicking off a fetch ahead of the component that will actually render the data with `useQuery`. You can pass
everything to `usePrefetchQuery` that you can pass to `queryClient.query`, though `queryKey` is always
required, and `queryFn` is required unless a default query function has been defined.

The prefetch is skipped if the query already has any cached state — including a `pending`/`error` state left
over from a previous attempt — so it won't refetch data that's already there or already in flight. It
re-runs whenever a reactive dependency in `options` (built with `queryOptions`, for example) changes.

Fire this during render, before a suspense boundary that wraps a component using `useQuery`'s `suspense()`
— see the [Suspense guide](https://tanstack.com/query/latest/docs/framework/vue/guides/suspense).

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `Error`

### TData

`TData` = `TQueryFnData`

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

## Parameters

### options

`MaybeRefOrGetter`\<`MaybeRefDeep`\<[`UsePrefetchQueryOptions`](../type-aliases/UsePrefetchQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>\>\>

A `ref`, plain value, or reactive getter resolving to the [UsePrefetchQueryOptions](../type-aliases/UsePrefetchQueryOptions.md) to
use — everything you can pass to `queryClient.query`.

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
import { usePrefetchQuery } from '@tanstack/vue-query'
import Posts from './Posts.vue'

// Fire the prefetch as soon as this component runs, before `Posts` mounts and calls `useQuery`.
usePrefetchQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})
</script>

<template>
  <Posts />
</template>
```
