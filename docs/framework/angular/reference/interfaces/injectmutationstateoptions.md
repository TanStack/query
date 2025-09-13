---
id: InjectMutationStateOptions
title: InjectMutationStateOptions
---

# Interface: InjectMutationStateOptions

## Properties

### injector?

```ts
optional injector: Injector;
```

The `Injector` in which to create the mutation state signal.

If this is not provided, the current injection context will be used instead (via `inject`).

#### Defined in

[inject-mutation-state.ts:54](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation-state.ts#L54)
