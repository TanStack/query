---
'@tanstack/react-query': minor
---

Add optional `serverSnapshot` and `serverSnapshotOptions` props to `QueryClientProvider`. When supplied with the same state and hydration options used to hydrate the client, `useQuery` and the other hooks built on `useBaseQuery` replay the frozen, deserialized server-rendered result during hydration (through `useSyncExternalStore`'s server snapshot) before switching to the live cache. This prevents hydration mismatches when a streamed query promise resolves before the browser hydrates, which previously made the first client render differ from the server markup.
