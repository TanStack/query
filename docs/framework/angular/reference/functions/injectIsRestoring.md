---
id: injectIsRestoring
title: injectIsRestoring
---

# Function: injectIsRestoring()

```ts
function injectIsRestoring(options?): Signal<boolean>;
```

Defined in: [inject-is-restoring.ts:32](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-restoring.ts#L32)

Injects a signal that tracks whether a restore is currently in progress. [injectQuery](../injectQuery.md) and friends also check this internally to avoid race conditions between the restore and initializing queries.

## Parameters

### options?

`InjectIsRestoringOptions`

Options for injectIsRestoring.

## Returns

`Signal`\<`boolean`\>

readonly signal with boolean that indicates whether a restore is in progress.
