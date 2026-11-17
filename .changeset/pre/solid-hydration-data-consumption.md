---
'@tanstack/solid-query': patch
---

fix: prime the query cache during hydration through a provider-owned dehydration channel, so SSR-fetched queries come up warm instead of refetching on mount. `QueryClientProvider` streams dehydrated cache entries (query-core `dehydrate()` shapes) as each query settles during SSR — entries ride the same flush as the content that awaited them — and applies them on the client via query-core `hydrate()` (newer-wins) as they arrive, attaching each hydrated component's observer as soon as its entry is primed. The vestigial per-observer-result `hydrationData` copy is no longer serialized.
