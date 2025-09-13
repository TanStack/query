---
id: InjectQueryOptions
title: InjectQueryOptions
---

# Interface: InjectQueryOptions

## Properties

### injector?

```ts
optional injector: Injector;
```

The `Injector` in which to create the query.

If this is not provided, the current injection context will be used instead (via `inject`).

#### Defined in

[inject-query.ts:26](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L26)
