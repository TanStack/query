---
'@tanstack/solid-query': patch
---

fix: attach `useQueries` through the provider's hydration channel, so a hydrated `useQueries` waits for its entries to be primed instead of refetching data that is still streaming in from the server.
