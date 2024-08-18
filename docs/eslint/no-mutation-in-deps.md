---
id: no-mutation-in-deps
title: Disallow putting the result of `useMutation` directly in a React hook dependency array
---

The object returned from `useMutation` is **not** referentially stable, so it should **not** be put directly into the dependency array of a React hook (e.g. `useEffect`, `useMemo`, `useCallback`).
Instead, destructure the return value of useMutation and pass the destructured values into the dependency array.

## Rule Details

Examples of **incorrect** code for this rule:

```tsx
/* eslint "@tanstack/query/no-mutation-in-deps": "warn" */
import { useCallback } from 'React'
import { useMutation } from '@tanstack/react-query'

function Component() {
  const mutation = useMutation({ mutationFn: (value: string) => value })
  const callback = useCallback(() => {
    mutation.mutate('hello')
  }, [mutation])
  return null
}
```

Examples of **correct** code for this rule:

```tsx
/* eslint "@tanstack/query/no-mutation-in-deps": "warn" */
import { useCallback } from 'React'
import { useMutation } from '@tanstack/react-query'

function Component() {
  const { mutate } = useMutation({ mutationFn: (value: string) => value })
  const callback = useCallback(() => {
    mutate('hello')
  }, [mutate])
  return null
}
```

## Attributes

- [x] ✅ Recommended
- [ ] 🔧 Fixable
