---
'@tanstack/solid-query': patch
---

Sweep `X-Revalidate` keys in the single-flight consumer. A mutation can declare its invalidation scope with Solid's `reload`/`redirect` `revalidate` option; the flight payload covers what the server recomputed, and whatever a declared key matches beyond it (parameterized instances only the client holds, queries no loader owns) is now invalidated client-side — active queries refetch in the background, inactive ones are marked stale. Keys match by queryKey prefix, mirroring Solid Router's consumption of the same header.
