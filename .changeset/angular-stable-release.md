---
'@tanstack/angular-query': major
'@tanstack/angular-query-devtools': major
'@tanstack/angular-query-persist-client': major
---

Introduce the Angular packages at `5.0.0-rc.0`. Add the stable Angular Query adapter for Angular 20.1+, with effect-managed subscriptions, factory-based providers, SSR hydration controls, Resource interoperability, and an Angular CLI schematic. Add standalone Angular devtools and connect the persistence integration to the stable adapter.

The experimental adapter remains available during migration. Existing persistence integration users must switch their adapter imports to `@tanstack/angular-query` and pass factories to `provideTanStackQuery` and `withPersistQueryClient`.
