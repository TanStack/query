---
id: invalidations-from-mutations
title: Invalidations from Mutations
ref: docs/react/guides/invalidations-from-mutations.md
replace: { 'useMutation': 'injectMutation', 'hook': 'function' }
---

[//]: # 'Example'

```ts
class TodoItemComponent {
  mutation = injectMutation(() => ({
    mutationFn: postTodo,
  }))
}
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
import { injectMutation } from '@tanstack/angular-query-experimental'

export class TodosComponent {
  queryClient = injectQueryClient()

  // When this mutation succeeds, invalidate any queries with the `todos` or `reminders` query key
  mutation = injectMutation((client) => ({
    mutationFn: addTodo,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['todos'] })
      client.invalidateQueries({ queryKey: ['reminders'] })

      // OR use the queryClient that is injected into the component
      // this.queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  }))
}
```

[//]: # 'Example2'

You can wire up your invalidations to happen using any of the callbacks available in the [`injectMutation` function](../guides/mutations)
