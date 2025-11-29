---
id: Override
title: Override
---

# Type Alias: Override\<TTargetA, TTargetB\>

```ts
type Override<TTargetA, TTargetB> = { [AKey in keyof TTargetA]: AKey extends keyof TTargetB ? TTargetB[AKey] : TTargetA[AKey] };
```

Defined in: [packages/query-core/src/types.ts:31](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L31)

## Type Parameters

### TTargetA

`TTargetA`

### TTargetB

`TTargetB`
