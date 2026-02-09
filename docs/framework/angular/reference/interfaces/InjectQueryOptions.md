---
id: InjectQueryOptions
title: InjectQueryOptions
---

# Interface: InjectQueryOptions

Defined in: [inject-query.ts:25](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L25)

## Properties

### injector?

```ts
optional injector: Injector;
```

Defined in: [inject-query.ts:31](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L31)

The `Injector` in which to create the query.

If this is not provided, the current injection context will be used instead (via `inject`).
