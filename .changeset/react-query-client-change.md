---
'@tanstack/react-query': patch
---

fix(react-query): create a new observer in `useQuery` and `useQueries` when the `queryClient` changes, instead of reading from the client they first rendered with
