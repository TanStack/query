---
id: useInfiniteQuery
title: useInfiniteQuery
---

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): DefinedUseInfiniteQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useInfiniteQuery.ts:64](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useInfiniteQuery.ts#L64)

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `queryFn`,
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

This overload is selected when `initialData` is set.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [DefinedInitialDataInfiniteOptions](../type-aliases/DefinedInitialDataInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`, with `initialData` set.

#### queryClient?

`QueryClient`

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`DefinedUseInfiniteQueryResult`](../type-aliases/DefinedUseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `data.pages`, `data.pageParams`,
`fetchNextPage`, `fetchPreviousPage`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and
`isFetchingPreviousPage`.

### Remarks

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
actions, or add conditions like `hasNextPage && !isFetching`.

### See

[infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.

### Example

```tsx
import { useInfiniteQuery } from '@tanstack/preact-query'

function Projects() {
  // `data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
  // list stays visible alongside the error.
  const { data, isError, error } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
    initialData: { pages: [], pageParams: [] },
  })

  return (
    <div>
      {isError ? <span>Error: {error.message}</span> : null}
      <ul>
        {data.pages.map((page) => page.projects.map((p) => <li key={p.id}>{p.name}</li>))}
      </ul>
    </div>
  )
}
```

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseInfiniteQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useInfiniteQuery.ts:142](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useInfiniteQuery.ts#L142)

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `queryFn`,
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`.

#### queryClient?

`QueryClient`

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseInfiniteQueryResult`](../type-aliases/UseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `data.pages`, `data.pageParams`,
`fetchNextPage`, `fetchPreviousPage`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and
`isFetchingPreviousPage`.

### Remarks

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
actions, or add conditions like `hasNextPage && !isFetching`.

### See

[infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.

### Example

Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a
sentinel element after the list:
```tsx
import { useInfiniteQuery } from '@tanstack/preact-query'
import { useEffect, useRef } from 'preact/hooks'

function Projects() {
  const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['projects'],
      queryFn: ({ pageParam }) => fetchProjects(pageParam),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextId,
    })

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (sentinel == null || !hasNextPage) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchNextPage()
    })
    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasNextPage, fetchNextPage])

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <>
      <ul>
        {data.pages.map((page) =>
          page.projects.map((project) => <li key={project.id}>{project.name}</li>),
        )}
      </ul>
      <div ref={sentinelRef}>{isFetchingNextPage ? 'Loading more...' : null}</div>
    </>
  )
}
```

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseInfiniteQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useInfiniteQuery.ts:294](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useInfiniteQuery.ts#L294)

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `queryFn`,
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UseInfiniteQueryOptions](../interfaces/UseInfiniteQueryOptions.md) to use — everything you can pass to `useInfiniteQuery`.

#### queryClient?

`QueryClient`

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseInfiniteQueryResult`](../type-aliases/UseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `data.pages`, `data.pageParams`,
`fetchNextPage`, `fetchPreviousPage`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and
`isFetchingPreviousPage`.

### Remarks

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
actions, or add conditions like `hasNextPage && !isFetching`.

### See

[infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.

### Examples

Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a
sentinel element after the list:
```tsx
import { useInfiniteQuery } from '@tanstack/preact-query'
import { useEffect, useRef } from 'preact/hooks'

function Projects() {
  const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['projects'],
      queryFn: ({ pageParam }) => fetchProjects(pageParam),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextId,
    })

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (sentinel == null || !hasNextPage) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchNextPage()
    })
    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasNextPage, fetchNextPage])

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <>
      <ul>
        {data.pages.map((page) =>
          page.projects.map((project) => <li key={project.id}>{project.name}</li>),
        )}
      </ul>
      <div ref={sentinelRef}>{isFetchingNextPage ? 'Loading more...' : null}</div>
    </>
  )
}
```

Warming the cache on hover, so `<Comments>` has data as soon as it's clicked. Requires an
[infiniteQueryOptions](infiniteQueryOptions.md) factory, so the hook and the imperative call share the same cache entry:
```tsx
import {
  infiniteQueryOptions,
  noop,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/preact-query'

const commentsOptions = (postId: string) =>
  infiniteQueryOptions({
    queryKey: ['post', postId, 'comments'],
    queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  })

function Comments({ postId }: { postId: string }) {
  const { data, isPending, isError, error } = useInfiniteQuery(commentsOptions(postId))
  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>
  return (
    <ul>
      {data.pages.map((page) => page.comments.map((c) => <li key={c.id}>{c.text}</li>))}
    </ul>
  )
}

function PostLink({ postId, title }: { postId: string; title: string }) {
  const queryClient = useQueryClient()

  return (
    <a
      href={`/posts/${postId}`}
      onMouseEnter={() => queryClient.infiniteQuery(commentsOptions(postId)).catch(noop)}
    >
      {title}
    </a>
  )
}
```

A query that's disabled, type safe, until `postId` is set — pass `skipToken` as `queryFn`
instead of setting `enabled: false`:
```tsx
import { skipToken, useInfiniteQuery } from '@tanstack/preact-query'

function Comments({ postId }: { postId: string | undefined }) {
  // Use `isLoading`, not `isPending`, so the loading state doesn't show while the query is disabled.
  const { data, isLoading, isError, error } = useInfiniteQuery({
    queryKey: ['post', postId, 'comments'],
    queryFn:
      postId != null
        ? ({ pageParam }) => fetchComments(postId, pageParam)
        : skipToken,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  })

  if (postId == null) return 'Select a post'
  if (isLoading) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data?.pages.map((page) => page.comments.map((c) => <li key={c.id}>{c.text}</li>))}
    </ul>
  )
}
```
