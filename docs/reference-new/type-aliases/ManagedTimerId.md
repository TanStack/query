---
id: ManagedTimerId
title: ManagedTimerId
---

# Type Alias: ManagedTimerId

```ts
type ManagedTimerId = 
  | number
  | {
  [toPrimitive]: () => number;
};
```

Defined in: [packages/query-core/src/timeoutManager.ts:17](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L17)

Wrapping `setTimeout` is awkward from a typing perspective because platform
typings may extend the return type of `setTimeout`. For example, NodeJS
typings add `NodeJS.Timeout`; but a non-default `timeoutManager` may not be
able to return such a type.
