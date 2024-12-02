---
id: query-keys
title: Query Keys
ref: docs/framework/react/guides/query-keys.md
---

[//]: # 'Example5'

```js
function useTodos(todoId) {
  const queryKey = ['todos', todoId]
  return useQuery(queryKey, () => fetchTodoById(todoId.value))
}
```

[//]: # 'Example5'

### If your query function depends on a props value, include it in your query key using getter syntax

```js
<script setup>
  const props = defineProps([todoId]); const queryKey = ['todos', ()=>
  props.todoId] ; const result = useQuery(queryKey, () =>
  fetchTodoById(props.todoId));
</script>
```
