---
'@tanstack/solid-query': patch
---

fix: scope useMutation's mutation-cache subscription to the flight. The
hook subscribed at mount with a bare reactive `client()` read (tripping
Solid's STRICT_READ_UNTRACKED dev diagnostic) and held the subscription
for its whole life even though the listener only matters while a mutation
is in flight. The subscription now starts in `run` against the same
client the mutation is built on and ends at settle: nothing reactive is
read at setup, the listener and the mutation can never sit on different
clients, and idle hooks hold no cache subscription.
