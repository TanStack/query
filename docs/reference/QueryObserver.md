---
id: QueryObserver
title: QueryObserver
---

The `QueryObserver` can be used to observe and switch between queries.

```tsx
const observer = new QueryObserver(queryClient, { queryKey: ['posts'] })

const unsubscribe = observer.subscribe((result) => {
  console.log(result)
  unsubscribe()
})
```

**Options**

The options for the `QueryObserver` are exactly the same as those of [`useQuery`](../framework/react/reference/useQuery).
