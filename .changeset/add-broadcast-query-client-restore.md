---
'@tanstack/query-broadcast-client-experimental': minor
'@tanstack/react-query-persist-client': minor
'@tanstack/preact-query-persist-client': minor
'@tanstack/solid-query-persist-client': minor
'@tanstack/svelte-query-persist-client': minor
'@tanstack/angular-query-experimental': minor
'@tanstack/angular-query-persist-client': minor
---

Add opt-in cross-tab QueryClient bootstrap and restore-gate integrations to
prevent duplicate initial requests when a fresh tab opens. Existing
broadcastQueryClient usage remains synchronous and live-sync-only.
