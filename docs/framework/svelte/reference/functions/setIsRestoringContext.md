---
id: setIsRestoringContext
title: setIsRestoringContext
---

```ts
function setIsRestoringContext(isRestoring: Box<boolean>): void;
```

Defined in: [packages/svelte-query/src/context.ts:68](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/context.ts#L68)

Sets a `isRestoring` on Svelte's context

## Parameters

### isRestoring

`Box`\<`boolean`\>

The box holding whether the cache is being restored, e.g. by a persister.

## Returns

`void`
