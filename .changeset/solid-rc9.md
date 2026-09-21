---
'@tanstack/solid-query': patch
'@tanstack/solid-query-devtools': patch
'@tanstack/solid-query-persist-client': patch
---

Follow Solid 2.0.0-rc.9. The packages build with `@solidjs/babel-plugin` (the Solid 2.0 compiler, matching the rc.9 runtime's delegated-event contract) and test under vite 8; the `solid-js` / `@solidjs/web` peer floor is `2.0.0-rc.9`.

`useQuery`'s setup-time snapshots (the meta projection's seed, the mount counts) now read the cache directly instead of through the hook's version signal. Under hydration, priming writes that signal during setup, and a write made during the hydration pass is held: a computation in the pass that reads it — tracked or not — is served the pre-write value and replays when the pass ends. For the hook's own derived nodes that replay is the takeover; for the computation instantiating the component (a `<Loading>` boundary's children) it was a remount, re-creating the hydrated component as a client render and letting cache writes reach the DOM while the stream was still open.
