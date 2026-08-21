---
id: queryOptions
title: queryOptions
---

```tsx
queryOptions({
  queryKey,
  ...options,
})
```

**Options**

You can generally pass everything to `queryOptions` that you can also pass to [`useQuery`](./useQuery.md). Some options will have no effect when then forwarded to a function like `queryClient.prefetchQuery`, but TypeScript will still be fine with those excess properties.

- `queryKey: QueryKey`
  - **Required**
  - The query key to generate options for.
[//]: # 'Materials'

## Further reading

To learn more about `QueryOptions`, have a look at [this article by TkDodo The Query Options API](https://tkdodo.eu/blog/the-query-options-api).

[//]: # 'Materials'
