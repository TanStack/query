---
'@tanstack/solid-query': patch
---

Fix `useQuery` holding the first streamed chunk until the stream ends: when a cache write lands while a fetch is in flight, serve the fresh cache data instead of waiting on the in-flight fetch promise. Fixes #12665.
