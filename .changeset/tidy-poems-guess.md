---
'@tanstack/react-query': minor
---

Add an optional `serverSnapshot` prop to `QueryClientProvider`. When supplied with the same `DehydratedState` used to hydrate the client, `useQuery` and the other hooks built on `useBaseQuery` replay the frozen server-rendered result during hydration (through `useSyncExternalStore`'s server snapshot) before switching to the live cache. This prevents hydration mismatches when a streamed query promise resolves before the browser hydrates, which previously made the first client render differ from the server markup.
