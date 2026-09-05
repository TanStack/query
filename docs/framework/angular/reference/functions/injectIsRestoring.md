---
id: injectIsRestoring
title: injectIsRestoring
---

```ts
function injectIsRestoring(options?): Signal<boolean>;
```

Defined in: [inject-is-restoring.ts:35](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-restoring.ts#L35)

Injects a signal that tracks whether a restore (e.g. from a persisted client, wired up via
`provideIsRestoring`) is currently in progress. `injectQuery` and friends also check this internally to
avoid race conditions between the restore and initializing queries.

## Parameters

### options?

`InjectIsRestoringOptions`

Additional configuration

## Returns

`Signal`\<`boolean`\>

A readonly `Signal<boolean>` — `true` while a restore is in progress, `false` otherwise (the
default when no `provideIsRestoring` provider is registered).
