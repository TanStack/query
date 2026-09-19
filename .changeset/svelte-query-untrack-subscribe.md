---
'@tanstack/svelte-query': patch
---

Run the observer subscription inside `untrack()` so that reactive state read by a `queryFn` before its first `await` can no longer become a dependency of the subscription effect, which tore the observer down (cancelling the in-flight fetch) and re-subscribed on every write to that state.
