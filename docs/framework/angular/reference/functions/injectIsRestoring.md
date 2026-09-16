---
id: injectIsRestoring
title: injectIsRestoring
---

```ts
function injectIsRestoring(): Signal<boolean>;
```

Defined in: [packages/angular-query/src/inject-is-restoring.ts:22](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-is-restoring.ts#L22)

Returns a readonly signal that is true while the persistence integration restores cached query data. It is false when no restoration is in progress.

## Returns

`Signal`\<`boolean`\>

A readonly `Signal<boolean>` — `true` while a restore is in progress, `false` otherwise (the
default when no `provideIsRestoring` provider is registered).
