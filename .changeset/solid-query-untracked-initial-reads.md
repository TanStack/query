---
'@tanstack/solid-query': patch
---

fix(solid-query): untrack the one-shot client and options reads the hooks make on mount

`useQuery`, `useQueries`, `useMutation`, `useIsFetching`, `useIsMutating` and `useMutationState` each read their `client` memo and their options accessor directly while seeding an observer or a signal. Later changes reach those observers through `setOptions`/`setQueries` and the effects around them, so the initial reads are one-shot by design — but they were still made in a tracking scope. On Solid 2 that makes every hook call log a `[STRICT_READ_UNTRACKED]` diagnostic on mount, and a hook called from inside a computation had that computation re-run and its observer rebuilt whenever the client or the options changed. The reads are now untracked.
