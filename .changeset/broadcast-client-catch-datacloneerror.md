---
'@tanstack/query-broadcast-client-experimental': patch
---

fix(broadcast-client): swallow `postMessage` serialization failures instead of surfacing them as unhandled `DataCloneError` rejections

When a query holds non-serializable data (e.g. a `ReadableStream`, `File`, or a framework proxy), `BroadcastChannel.postMessage` rejects with a `DataCloneError`. These rejections were previously unhandled, showing up in error trackers with an opaque `node_modules` stack trace. They are now caught, with a helpful warning logged in development.
