---
id: QueryObserver
title: QueryObserver
---

## `QueryObserver`

The `QueryObserver` can be used to observe and switch between queries.

```js
const observer = new QueryObserver(queryClient, { queryKey: 'posts' })

const unsubscribe = observer.subscribe(result => {
  console.log(result)
  unsubscribe()
})
```

**Options**

The options for the `QueryObserver` are exactly the same as those of [`useQuery`](/reference/useQuery).
