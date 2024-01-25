---
id: invalidations-from-mutations
title: Invalidations from Mutations
ref: docs/react/guides/invalidations-from-mutations.md
---

[//]: # 'Example2'

```tsx
import { useMutation, useQueryClient } from '@tanstack/vue-query'

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
