---
id: migrating-to-react-query-5
title: Migrating to TanStack Query v5
---

## Breaking Changes

v5 is a major version, so there are some breaking changes to be aware of:

### The `remove` method has been removed from useQuery

Previously, remove method used to remove the query from the queryCache without informing observers about it. It was best used to remove data imperatively that is no longer needed, e.g. when logging a user out.

But It doesn't make much sense to do this while a query is still active, because it will just trigger a hard loading state with the next re-render. 

if you still need to remove a query, you can use `queryClient.removeQueries({queryKey: key})`

```diff
 const queryClient = useQueryClient();
 const query = useQuery({ queryKey, queryFn });

- query.remove()
+ queryClient.removeQueries({ queryKey })
```