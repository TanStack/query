---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [packages/vue-query/src/infiniteQueryOptions.ts:99](https://github.com/TanStack/query/blob/main/packages/vue-query/src/infiniteQueryOptions.ts#L99)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
`options.queryKey` is required and is the query key to generate options for.

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

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything you can pass to
`useInfiniteQuery`.

### Returns

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[useInfiniteQuery](useInfiniteQuery.md) to run an infinite query with these options.

### Example

```vue
<script setup lang="ts">
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/vue-query'

const projectsOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
})

const { data, isError, error, fetchNextPage } = useInfiniteQuery(projectsOptions)
</script>
```

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [packages/vue-query/src/infiniteQueryOptions.ts:153](https://github.com/TanStack/query/blob/main/packages/vue-query/src/infiniteQueryOptions.ts#L153)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
`options.queryKey` is required and is the query key to generate options for.

This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.

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

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [DefinedInitialDataInfiniteOptions](../type-aliases/DefinedInitialDataInfiniteOptions.md) to use — everything you can pass to
`useInfiniteQuery`, with `initialData` set.

### Returns

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[useInfiniteQuery](useInfiniteQuery.md) to run an infinite query with these options.

### Example

```vue
<script setup lang="ts">
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/vue-query'

const projectsOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
  initialData: { pages: [], pageParams: [] },
})

// `data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
// list stays visible alongside the error.
const { data, isError, error } = useInfiniteQuery(projectsOptions)
</script>
```
