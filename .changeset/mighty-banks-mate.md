---
'@tanstack/query-devtools': patch
---

`setupStyleSheet` now sets `window.__nonce__` when a `styleNonce` is provided.

The devtools use [goober](https://goober.js.org/) for CSS-in-JS, which reads `window.__nonce__` every time it creates or accesses its style element. Without this, goober overwrote the nonce with `undefined`, causing CSP violations even when `styleNonce` was correctly passed to `<ReactQueryDevtools>`.
