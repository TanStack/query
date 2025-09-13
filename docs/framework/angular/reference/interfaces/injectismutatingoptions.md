---
id: InjectIsMutatingOptions
title: InjectIsMutatingOptions
---

# Interface: InjectIsMutatingOptions

## Properties

### injector?

```ts
optional injector: Injector;
```

The `Injector` in which to create the isMutating signal.

If this is not provided, the current injection context will be used instead (via `inject`).

#### Defined in

[inject-is-mutating.ts:19](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-mutating.ts#L19)
