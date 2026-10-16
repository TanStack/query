# @tanstack/angular-query

## 5.0.0-rc.4

### Patch Changes

- [#12033](https://github.com/TanStack/query/pull/12033) [`46da583`](https://github.com/TanStack/query/commit/46da583fa3760715d9fb13677bbe022f901e0730) - Fix the `migrate-from-experimental` schematic aborting with `Path "…" is a file.` when a project source imports a package subpath that names a file, such as `@noble/hashes/sha3.js`.

- [#12027](https://github.com/TanStack/query/pull/12027) [`1a2f6b3`](https://github.com/TanStack/query/commit/1a2f6b38d534245b957c7ea87ac830cc1e06d7f1) - Improve Angular migration and typing:
  - Replace experimental npm aliases for query and devtools packages and preserve exact dependency pins, including opted-in query-core migrations.
  - Discover application and test sources across Angular, Nx, manually configured runners, and standalone libraries, including project references. Respect explicit test configurations and TypeScript exclusions after merging project declarations.
  - Fix status-helper calls on heterogeneous `injectQueries` results while preserving signal typing and status-based narrowing. Keep optional initial data undefined-capable.
  - Document gradual migration, shared ngneat clients, import restrictions, and asynchronous testing patterns. Run Zone.js regression tests alongside zoneless library tests by default.

## 5.0.0-rc.3

### Minor Changes

- [#11787](https://github.com/TanStack/query/pull/11787) [`d83eef6`](https://github.com/TanStack/query/commit/d83eef68ae3484ec8254a9c28582ed41af30035b) - Bundle an Angular 20.1-compatible migrate-from-experimental schematic that updates imports, migrates Angular and Nx workspace dependencies, and reports remaining API changes. Include opt-in migrations for ambiguous client references and query-core imports, with optional peer dependencies for schematic tooling.

## 5.0.0-rc.2

## 5.0.0-rc.1

## 5.0.0-rc.0

### Major Changes

- [#11516](https://github.com/TanStack/query/pull/11516) [`7da5a24`](https://github.com/TanStack/query/commit/7da5a24becd506c0d121c4c1d264251e62e53d96) - Add the stable Angular Query adapter for Angular 20.1+. It includes SSR support, Resource API interoperability, persistence integration, improved internal subscription and pending tasks management, stable `injectQueries` and consistency improvements in the API.
