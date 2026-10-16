---
id: Override
title: Override
---

```ts
type Override<TTargetA, TTargetB> = { [AKey in keyof TTargetA]: AKey extends keyof TTargetB ? TTargetB[AKey] : TTargetA[AKey] };
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:27

Replaces the types of the properties of `TTargetA` that also exist in `TTargetB` with their types
in `TTargetB`. Properties that only exist in `TTargetB` are not added.

## Type Parameters

### TTargetA

`TTargetA`

### TTargetB

`TTargetB`
