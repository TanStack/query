---
id: mutation-property-order
title: Ensure correct order of inference-sensitive properties in useMutation()
---

For the following functions, the property order of the passed in object matters due to type inference:

- `useMutation()`

The correct property order is as follows:

- `onMutate`
- `onError`
- `onSettled`

All other properties are insensitive to the order as they do not depend on type inference.

## Rule Details

Examples of **incorrect** code for this rule:

```tsx
/* eslint "@tanstack/query/mutation-property-order": "warn" */
import { useMutation } from '@tanstack/react-query'

const mutation = useMutation({
  mutationFn: () => Promise.resolve('success'),
  onSettled: () => {
    results.push('onSettled-promise')
    return Promise.resolve('also-ignored') // Promise<string> (should be ignored)
  },
  onMutate: async () => {
    results.push('onMutate-async')
    await sleep(1)
    return { backup: 'async-data' }
  },
  onError: async () => {
    results.push('onError-async-start')
    await sleep(1)
    results.push('onError-async-end')
  },
})
```

Examples of **correct** code for this rule:

```tsx
/* eslint "@tanstack/query/mutation-property-order": "warn" */
import { useMutation } from '@tanstack/react-query'

const mutation = useMutation({
  mutationFn: () => Promise.resolve('success'),
  onMutate: async () => {
    results.push('onMutate-async')
    await sleep(1)
    return { backup: 'async-data' }
  },
  onError: async () => {
    results.push('onError-async-start')
    await sleep(1)
    results.push('onError-async-end')
  },
  onSettled: () => {
    results.push('onSettled-promise')
    return Promise.resolve('also-ignored') // Promise<string> (should be ignored)
  },
})
```

## Attributes

- [x] ✅ Recommended
- [x] 🔧 Fixable
