---
id: getIsRestoringContext
title: getIsRestoringContext
---

```ts
function getIsRestoringContext(): Box<boolean>;
```

Defined in: [packages/svelte-query/src/context.ts:53](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/context.ts#L53)

Retrieves a `isRestoring` from Svelte's context

## Returns

`Box`\<`boolean`\>

The `isRestoring` box set on context, or a box holding `false` if none was set or the
context is unavailable.
