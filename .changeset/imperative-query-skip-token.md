---
'@tanstack/query-core': minor
'@tanstack/vue-query': minor
---

Allow shared options that contain `skipToken` in `queryClient.query` and `queryClient.infiniteQuery`. When `queryFn` is `skipToken`, the call skips fetching and returns existing data or `undefined`. If the options type allows `skipToken`, the result type includes `undefined`.
