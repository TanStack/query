---
id: provideIsRestoring
title: provideIsRestoring
---

```ts
function provideIsRestoring(isRestoring): Provider;
```

Defined in: [inject-is-restoring.ts:48](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-restoring.ts#L48)

Registers a provider for the restore state read by `injectIsRestoring`. Wire this up wherever you drive a
restore yourself — e.g. a persist-client integration — so `injectQuery` and friends can defer subscribing
to their observer (avoiding a race with the restore) until the restore signal flips back to `false`.

## Parameters

### isRestoring

`Signal`\<`boolean`\>

A readonly `Signal<boolean>` that tracks the restore state.

## Returns

`Provider`

A provider for the `isRestoring` signal.
