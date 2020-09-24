---
id: important-defaults
title: Important Defaults
---

Out of the box, React Query is configured with **aggressive but sane** defaults. **Sometimes these defaults can catch new users off guard or make learning/debugging difficult if they are unknown by the user.** Keep them in mind as you continue to learn and use React Query:

- Query results that are _currently rendered on the screen_ (via `useQuery` and similar hooks) will become "stale" immediately after they are resolved and will be refetched automatically in the background when:
  - New instances of the query mount
  - The window is refocused
  - The network is reconnected.

> To change this functionality, you can use options like `refetchOnMount`, `refetchOnWindowFocus` and `refetchOnReconnect`.

- Query results that become unused (all instances of the query are unmounted) will still be cached in case they are used again for a default of 5 minutes before they are garbage collected.

> To change this, you can alter the default `cacheTime` for queries to something other than `1000 * 60 * 5` milliseconds.

- Queries that fail are silently retried **3 times, with exponential backoff delay** before capturing and displaying an error to the UI.

> To change this, you can alter the default `retry` and `retryDelay` options for queries to something other than `3` and the default exponential backoff function.

- Query results by default are **structurally shared to detect if data has actually changed** and if not, **the data reference remains unchanged** to better help with value stabilization with regards to useMemo and useCallback. If this concept sounds foreign, then don't worry about it! 99.9% of the time you will not need to disable this and it makes your app more performant at zero cost to you.

> Structural sharing only works with JSON-compatible values, any other value types will always be considered as changed. If you are seeing performance issues because of large responses for example, you can disable this feature with the `config.structuralSharing` flag. If you are dealing with non-JSON compatible values in your query responses and still want to detect if data has changed or not, you can define a data compare function with `config.isDataEqual`.
