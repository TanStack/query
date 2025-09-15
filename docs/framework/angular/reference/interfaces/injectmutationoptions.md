---
id: InjectMutationOptions
title: InjectMutationOptions
---

# Interface: InjectMutationOptions

## Properties

### injector?

```ts
optional injector: Injector;
```

The `Injector` in which to create the mutation.

If this is not provided, the current injection context will be used instead (via `inject`).

#### Defined in

[inject-mutation.ts:30](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation.ts#L30)
