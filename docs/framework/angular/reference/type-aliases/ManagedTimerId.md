---
id: ManagedTimerId
title: ManagedTimerId
---

```ts
type ManagedTimerId = 
  | number
  | {
  [toPrimitive]: () => number;
};
```

Defined in: packages/query-core/dist-ts/src/timeoutManager.d.ts:16

Wrapping `setTimeout` is awkward from a typing perspective because platform
typings may extend the return type of `setTimeout`. For example, NodeJS
typings add `NodeJS.Timeout`; but a non-default `timeoutManager` may not be
able to return such a type.
