---
'@tanstack/query-core': patch
---

Prevent cancelled streamed queries from writing to the cache or starting a delayed stream, even when the stream does not consume the abort signal.
