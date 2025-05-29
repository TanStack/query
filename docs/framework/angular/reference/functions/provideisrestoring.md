---
id: provideIsRestoring
title: provideIsRestoring
---

# Function: provideIsRestoring()

```ts
function provideIsRestoring(isRestoring): Provider
```

Used by TanStack Query Angular persist client plugin to provide the signal that tracks the restore state

## Parameters

### isRestoring

`Signal`\<`boolean`\>

a readonly signal that returns a boolean

## Returns

`Provider`

Provider for the `isRestoring` signal

## Defined in

[inject-is-restoring.ts:47](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-restoring.ts#L47)
