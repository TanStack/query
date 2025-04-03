---
id: invalidations-from-mutations
title: Invalidations from Mutations
---

Invalidating queries is only half the battle. Knowing **when** to invalidate them is the other half. Usually when a mutation in your app succeeds, it's VERY likely that there are related queries in your application that need to be invalidated and possibly refetched to account for the new changes from your mutation.

For example, assume we have a mutation to post a new todo:

[//]: # 'Example'

```tsx
const mutation = useMutation({ mutationFn: postTodo })
```

[//]: # 'Example'

When a successful `postTodo` mutation happens, we likely want all `todos` queries to get invalidated and possibly refetched to show the new todo item. To do this, you can use `useMutation`'s `onSuccess` options and the `client`'s `invalidateQueries` function:

[//]: # 'Example2'

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

// When this mutation succeeds, invalidate any queries with the `todos` or `reminders` query key
const mutation = useMutation({
  mutationFn: addTodo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
    queryClient.invalidateQueries({ queryKey: ['reminders'] })
  },
})
```

[//]: # 'Example2'

You can wire up your invalidations to happen using any of the callbacks available in the [`useMutation` hook](./mutations.md)
