---
'@tanstack/react-query': minor
'@tanstack/preact-query': minor
---

Add `skipToken` support to `useSuspenseQuery`. When `queryFn` can be `skipToken`, the result can have undefined data. Calls with a regular query function still return data of type `TData`.
