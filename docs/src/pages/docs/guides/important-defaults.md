---
id: important-defaults
title: Important Defaults
---

Out of the box, React Query is configured with **aggressive but sane** defaults. **Sometimes these defaults can catch new users off guard or make learning/debugging difficult if they are unknown by the user.** Keep them in mind as you continue to learn and use React Query:

- Query results that are _currently rendered on the screen_ (via `useQuery` and similar hooks) will become "stale" immediately after they are resolved and will be refetched automatically in the background when they are rendered or used again. To change this, you can alter the default `staleTime` for queries to something other than `0` milliseconds.
- Query results that become unused (all instances of the query are unmounted) will still be cached in case they are used again for a default of 5 minutes before they are garbage collected. To change this, you can alter the default `cacheTime` for queries to something other than `1000 * 60 * 5` milliseconds.
- Stale queries will automatically be refetched in the background **when the browser window is refocused by the user**. You can disable this using the `refetchOnWindowFocus` option in queries or the global config.
- Queries that fail will silently be retried **3 times, with exponential backoff delay** before capturing and displaying an error to the UI. To change this, you can alter the default `retry` and `retryDelay` options for queries to something other than `3` and the default exponential backoff function.
- Query results by default are deep compared to detect if data has actually changed and if not, the data reference remains unchanged to better help with value stabilization with regards to useMemo and useCallback. The default deep compare function use here (`config.isDataEqual`) only supports comparing JSON-compatible primitives. If you are dealing with any non-json compatible values in your query responses OR are seeing performance issues with the deep compare function, you should probably disable it (`config.isDataEqual = () => false`) or customize it to better fit your needs.
