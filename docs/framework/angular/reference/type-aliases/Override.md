---
id: Override
title: Override
---

```ts
type Override<TTargetA, TTargetB> = { [AKey in keyof TTargetA]: AKey extends keyof TTargetB ? TTargetB[AKey] : TTargetA[AKey] };
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:12

## Type Parameters

### TTargetA

`TTargetA`

### TTargetB

`TTargetB`
