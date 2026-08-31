---
'@tanstack/react-query': patch
---

Hydrate deferred queries in a layout effect so a remounting `useQuery` no longer refetches data the dehydrated state already contains.
