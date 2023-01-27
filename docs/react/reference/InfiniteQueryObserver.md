---
id: InfiniteQueryObserver
title: InfiniteQueryObserver
---

## `InfiniteQueryObserver`

The `InfiniteQueryObserver` can be used to observe and switch between infinite queries.

```js
const observer = new InfiniteQueryObserver(queryClient, {
  queryKey: 'posts',
  queryFn: fetchPosts,
  getNextPageParam: (lastPage, allPages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, allPages) => firstPage.prevCursor,
})

const unsubscribe = observer.subscribe(result => {
  console.log(result)
  unsubscribe()
})
```

**Options**

The options for the `InfiniteQueryObserver` are exactly the same as those of [`useInfiniteQuery`](/reference/useInfiniteQuery).
