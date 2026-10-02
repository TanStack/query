---
'@tanstack/query-core': patch
---

Do not schedule garbage collection on the server. A timer scheduled during server rendering captures the async context it was created in and keeps that whole render alive until it fires, while the client it would clean up is dropped with the response. Only queries and mutations with an explicit finite `gcTime` were affected, since the server default is already `Infinity`.
