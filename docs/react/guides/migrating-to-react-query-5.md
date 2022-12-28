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

### The minimum required TypeScript version is now 4.7

Mainly because an important fix was shipped around type inference. Please see this [TypeScript issue](https://github.com/microsoft/TypeScript/issues/43371) for more information.

### The `contextSharing` prop has been removed from QueryClientProvider

You could previously use the `contextSharing` property to share the first (and at least one) instance of the query client context across the window. This ensured that if TanStack Query was used across different bundles or microfrontends then they will all use the same instance of the context, regardless of module scoping.

However, isolation is often preferred for microfrontends. In v4 the option to pass a custom context to the `QueryClientProvider` was added, which allows exactly this. If you wish to use the same query client across multiple packages of an application, you can create a `QueryClient` in your application and then let the bundles share this through the `context` property of the `QueryClientProvider`.
