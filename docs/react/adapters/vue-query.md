---
title: Vue Query
---

The `vue-query` package offers a 1st-class API for using TanStack Query via Vue. However, all of the primitives you receive from these hooks are core APIs that are shared across all of the TanStack Adapters including the Query Client, query results, query subscriptions, etc.

## Example

This example very briefly illustrates the 3 core concepts of Vue Query:

- [Queries](guides/queries)
- [Mutations](guides/mutations)
- [Query Invalidation](guides/query-invalidation)

```vue
<script setup>
import { useQueryClient, useQuery, useMutation } from "@tanstack/vue-query";

// Access QueryClient instance
const queryClient = useQueryClient();

// Query
const { isPending, isError, data, error } = useQuery({ queryKey: ['todos'], queryFn: getTodos });

// Mutation
const mutation = useMutation({
  mutationFn: postTodo,
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});

function onButtonClick() {
  mutation.mutate({
    id: Date.now(),
    title: "Do Laundry",
  });
}
</script>

<template>
  <span v-if="isPending">Loading...</span>
  <span v-else-if="isError">Error: {{ error.message }}</span>
  <!-- We can assume by this point that `isSuccess === true` -->
  <ul v-else>
    <li v-for="todo in data" :key="todo.id">{{ todo.title }}</li>
  </ul>
  <button @click="onButtonClick">Add Todo</button>
</template>
```

These three concepts make up most of the core functionality of Vue Query. The next sections of the documentation will go over each of these core concepts in great detail.
