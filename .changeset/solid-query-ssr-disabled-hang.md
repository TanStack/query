---
'@tanstack/solid-query': patch
---

Fix `renderToStringAsync` hanging during SSR when a query is disabled: strip the unserializable `experimental_prefetchInRender` promise from the hydratable observer result, since a disabled query's promise never settles and the SSR serializer would await it forever.
