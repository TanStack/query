---
id: invalidations-from-mutations
title: Invalidations from Mutations
ref: docs/framework/react/guides/invalidations-from-mutations.md
replace:
  {
    'react-query': 'angular-query-experimental',
    'useMutation': 'injectMutation',
    'hook': 'function',
  }
---

[//]: # 'Example'

```ts
mutation = injectMutation(() => ({
  mutationFn: postTodo,
}))
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
import {
  injectMutation,
  QueryClient,
} from '@tanstack/angular-query-experimental'

@Component({
  // ...
})
export class TodosComponent {
  queryClient = inject(QueryClient)

  // When this mutation succeeds, invalidate any queries with the `todos` or `reminders` query key
  mutation = injectMutation(() => ({
    mutationFn: addTodo,
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['todos'] })
      this.queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  }))
}
```

[//]: # 'Example2'

You can wire up your invalidations to happen using any of the callbacks available in the [`injectMutation` function](./mutations.md)
