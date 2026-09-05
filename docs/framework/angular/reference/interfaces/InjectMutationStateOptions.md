---
id: InjectMutationStateOptions
title: InjectMutationStateOptions
---

Defined in: [inject-mutation-state.ts:40](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation-state.ts#L40)

## Properties

### injector?

```ts
optional injector: Injector;
```

Defined in: [inject-mutation-state.ts:46](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation-state.ts#L46)

The `Injector` in which to create the mutation state signal.

If this is not provided, the current injection context will be used instead (via `inject`).
