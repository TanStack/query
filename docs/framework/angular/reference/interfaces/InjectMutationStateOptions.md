---
id: InjectMutationStateOptions
title: InjectMutationStateOptions
---

# Interface: InjectMutationStateOptions

Defined in: [inject-mutation-state.ts:45](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation-state.ts#L45)

## Properties

### injector?

```ts
optional injector: Injector;
```

Defined in: [inject-mutation-state.ts:51](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation-state.ts#L51)

The `Injector` in which to create the mutation state signal.

If this is not provided, the current injection context will be used instead (via `inject`).
