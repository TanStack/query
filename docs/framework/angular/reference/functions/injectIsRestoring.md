---
id: injectIsRestoring
title: injectIsRestoring
---

```ts
function injectIsRestoring(): Signal<boolean>;
```

Defined in: [packages/angular-query/src/inject-is-restoring.ts:21](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-is-restoring.ts#L21)

Injects a readonly signal that is true while the persistence integration restores
cached query data. Returns false when no restoration is in progress.

## Returns

`Signal`\<`boolean`\>

The current restoration state.
