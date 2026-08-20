---
"@tanstack/query-broadcast-client-experimental": patch
---

Fix unhandled `DataCloneError` rejections in `broadcastQueryClient` when `postMessage` fails due to non-cloneable query data (e.g. `ReadableStream`, `Response`, Vue reactive proxies). Adds an optional `onBroadcastError` callback to handle errors explicitly; falls back to `console.warn` in development when not provided.
