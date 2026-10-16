---
'@tanstack/angular-query': patch
---

Improve Angular migration and typing:

- Replace experimental npm aliases for query and devtools packages and preserve exact dependency pins, including opted-in query-core migrations.
- Discover application and test sources across Angular, Nx, manually configured runners, and standalone libraries, including project references. Respect explicit test configurations and TypeScript exclusions after merging project declarations.
- Fix status-helper calls on heterogeneous `injectQueries` results while preserving signal typing and status-based narrowing. Keep optional initial data undefined-capable.
- Document gradual migration, shared ngneat clients, import restrictions, and asynchronous testing patterns. Run Zone.js regression tests alongside zoneless library tests by default.
