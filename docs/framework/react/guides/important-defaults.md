---
id: important-defaults
title: Important Defaults
---

Out of the box, TanStack Query is configured with **aggressive but sane** defaults. **Sometimes these defaults can catch new users off guard or make learning/debugging difficult if they are unknown by the user.** Keep them in mind as you continue to learn and use TanStack Query:

- Query instances via `useQuery` or `useInfiniteQuery` by default **consider cached data as stale**.

> To change this behavior, you can configure your queries both globally and per-query using the `staleTime` option. Specifying a longer `staleTime` means queries will not refetch their data as often

- A Query that has a `staleTime` set is considered **fresh** until that `staleTime` has elapsed.

  - set `staleTime` to e.g. `2 * 60 * 1000` to make sure data is read from the cache, without triggering any kinds of refetches, for 2 minutes, or until the Query is [invalidated manually](../query-invalidation.md).
  - set `staleTime` to `Infinity` to never trigger a refetch until the Query is [invalidated manually](../query-invalidation.md).
  - set `staleTime` to `'static'` to **never** trigger a refetch, even if the Query is [invalidated manually](../query-invalidation.md).

- Stale queries are refetched automatically in the background when:
  - New instances of the query mount
  - The window is refocused
  - The network is reconnected

> Setting `staleTime` is the recommended way to avoid excessive refetches, but you can also customize the points in time for refetches by setting options like `refetchOnMount`, `refetchOnWindowFocus` and `refetchOnReconnect`.

- Queries can optionally be configured with a `refetchInterval` to trigger refetches periodically, which is independent of the `staleTime` setting.

- Query results that have no more active instances of `useQuery`, `useInfiniteQuery` or query observers are labeled as "inactive" and remain in the cache in case they are used again at a later time.
- By default, "inactive" queries are garbage collected after **5 minutes**.

  > To change this, you can alter the default `gcTime` for queries to something other than `1000 * 60 * 5` milliseconds.

- Queries that fail are **silently retried 3 times, with exponential backoff delay** before capturing and displaying an error to the UI.

  > To change this, you can alter the default `retry` and `retryDelay` options for queries to something other than `3` and the default exponential backoff function.

- Query results by default are **structurally shared to detect if data has actually changed** and if not, **the data reference remains unchanged** to better help with value stabilization with regards to useMemo and useCallback. If this concept sounds foreign, then don't worry about it! 99.9% of the time you will not need to disable this and it makes your app more performant at zero cost to you.

  > Structural sharing only works with JSON-compatible values, any other value types will always be considered as changed. If you are seeing performance issues because of large responses for example, you can disable this feature with the `config.structuralSharing` flag. If you are dealing with non-JSON compatible values in your query responses and still want to detect if data has changed or not, you can provide your own custom function as `config.structuralSharing` to compute a value from the old and new responses, retaining references as required.

[//]: # 'Materials'

## Further Reading

Have a look at the following articles from our Community Resources for further explanations of the defaults:

- [Practical React Query](../../community/tkdodos-blog.md#1-practical-react-query)
- [React Query as a State Manager](../../community/tkdodos-blog.md#10-react-query-as-a-state-manager)

[//]: # 'Materials'
