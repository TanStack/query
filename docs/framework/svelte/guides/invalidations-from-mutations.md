---
id: invalidations-from-mutations
title: Invalidations from Mutations
ref: docs/framework/react/guides/invalidations-from-mutations.md
replace:
  {
    'React': 'Svelte',
    '@tanstack/react-query': '@tanstack/svelte-query',
    'useMutation[(]': 'createMutation(() => ',
    'hook': 'function',
    'tsx': 'ts',
  }
---

[//]: # 'Example'

```ts
const mutation = createMutation(() => ({ mutationFn: postTodo }))
```

[//]: # 'Example'
