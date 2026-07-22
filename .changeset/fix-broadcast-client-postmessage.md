---
'@tanstack/query-broadcast-client-experimental': patch
---

fix(query-broadcast-client-experimental): stop leaking `postMessage` rejections as unhandled errors

`BroadcastChannel.postMessage` rejects when a query payload cannot be structured-cloned (e.g. `ReadableStream`, `File`, functions, Vue `reactive` / MobX proxies). Those rejections are now handled internally and surfaced through an optional `onBroadcastError` hook; when the hook is not provided, a development-only `console.warn` reports the offending query so cross-tab sync failures are never silent.
