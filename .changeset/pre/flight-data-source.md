---
'@tanstack/solid-query': minor
---

Built-in single-flight consumer: `QueryClientProvider` now subscribes the query cache's slice of Solid's multi-source single-flight channel under the exported `FLIGHT_DATA_SOURCE` id (`"sq"`). Mutation responses carrying that slice — a `DehydratedState` produced by a server collector registered with `registerFlightDataSource(FLIGHT_DATA_SOURCE, hook)` — hydrate the provider's client before the mutation's promise resolves, so every mounted query on those keys updates with no follow-up refetches and no per-app wiring. Subscribing is inert when no server collector exists. Requires the `@solidjs/web` release following 2.0.0-rc.4 (the named-source single-flight protocol).
