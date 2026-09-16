---
'@tanstack/solid-query': patch
---

The single-flight consumer applies `X-Revalidate` on responses that carried no slice for the query cache (no collector registered, a redirect leaving the app) instead of throwing on the missing payload — nothing is covered, so the declared scope is swept in full. The header's three states are three scopes: absent leaves the cache alone, an empty declaration (`revalidate: []`) sweeps nothing, and the reserved key `*` (`revalidate: '*'`) invalidates every query the payload did not cover.
