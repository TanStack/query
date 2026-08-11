---
'@tanstack/solid-query': patch
'@tanstack/solid-query-devtools': patch
'@tanstack/solid-query-persist-client': patch
---

chore: upgrade to solid v2 beta 33. `@tanstack/solid-query` now requires solid-js >= 2.0.0-beta.33 (peer range floor raised): the provider-owned hydration channel depends on beta.33's `normalizeIterator` buffered-replay conflation fix — on beta.32 and earlier, hydration that begins after multiple stream chunks have arrived silently drops later channel yields, leaving queries never primed and their components frozen.
