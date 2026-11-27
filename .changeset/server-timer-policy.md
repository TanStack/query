---
'@tanstack/query-core': major
'@tanstack/query-async-storage-persister': patch
---

The default timeout provider skips timers on the server, even with finite `gcTime` or explicit `retry` options. A long-lived server can install a custom provider with `timeoutManager.setTimeoutProvider()`. With a provider that schedules timers, unused entries expire after five minutes by default. Its scheduling methods can return `undefined` to skip a timer. The async storage persister uses a platform timer if the provider skips a delay, so queued writes still finish.
