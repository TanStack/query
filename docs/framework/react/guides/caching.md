---
id: caching
title: Caching Examples
---

> Please thoroughly read the [Important Defaults](./important-defaults.md) before reading this guide

## Basic Example

This caching example illustrates the story and lifecycle of:

- Query Instances with and without cache data
- Background Refetching
- Inactive Queries
- Garbage Collection

Let's assume we are using the default `gcTime` of **5 minutes** and the default `staleTime` of `0`.

- A new instance of `useQuery({ queryKey: ['todos'], queryFn: fetchTodos })` mounts.
  - Since no other queries have been made with the `['todos']` query key, this query will show a hard loading state and make a network request to fetch the data.
  - When the network request has completed, the returned data will be cached under the `['todos']` key.
    [//]: # 'StaleNote'
  - The data will be marked as stale after the configured `staleTime` (defaults to `0`, or immediately).
    [//]: # 'StaleNote'
- A second instance of `useQuery({ queryKey: ['todos'], queryFn: fetchTodos })` mounts elsewhere.
  - Since the cache already has data for the `['todos']` key from the first query, that data is immediately returned from the cache.
  - The new instance triggers a new network request using its query function.
    - Note that regardless of whether both `fetchTodos` query functions are identical or not, both queries' [`status`](../reference/useQuery.md) are updated (including `isFetching`, `isPending`, and other related values) because they have the same query key.
  - When the request completes successfully, the cache's data under the `['todos']` key is updated with the new data, and both instances are updated with the new data.
- Both instances of the `useQuery({ queryKey: ['todos'], queryFn: fetchTodos })` query are unmounted and no longer in use.
  - Since there are no more active instances of this query, a garbage collection timeout is set using `gcTime` to delete and garbage collect the query (defaults to **5 minutes**).
- Before the cache timeout (gcTime) has completed, another instance of `useQuery({ queryKey: ['todos'], queryFn: fetchTodos })` mounts. The query immediately returns the available cached data while the `fetchTodos` function is being run in the background. When it completes successfully, it will populate the cache with fresh data.
- The final instance of `useQuery({ queryKey: ['todos'], queryFn: fetchTodos })` unmounts.
- No more instances of `useQuery({ queryKey: ['todos'], queryFn: fetchTodos })` appear within **5 minutes**.
  - The cached data under the `['todos']` key is deleted and garbage collected.
