<script setup lang="ts">
import { ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { todosMutations, todosQueries } from '../services/todos/queries'

const queryClient = useQueryClient()
const inputValue = ref('')

const { data: todos, suspense } = useQuery(todosQueries.list())

const { mutate, isPending, isError, error, variables } = useMutation({
  ...todosMutations.create(),
  onSettled: () =>
    queryClient.invalidateQueries({ queryKey: todosQueries.list().queryKey }),
})

await suspense()

const handleSubmit = () => {
  const text = inputValue.value.trim()
  if (!text) return
  mutate(text)
  inputValue.value = ''
}
</script>

<template>
  <div>
    <p style="font-size: 0.875rem; color: #555; margin-bottom: 1rem">
      <strong>Approach 1 — via UI variables:</strong> The pending item is
      rendered directly from <code>mutation.variables</code>. No cache
      manipulation needed. On error the pending item simply disappears.
    </p>

    <form
      style="display: flex; gap: 8px; margin-bottom: 1rem"
      @submit.prevent="handleSubmit"
    >
      <input
        v-model="inputValue"
        placeholder="New todo…"
        style="flex: 1; padding: 0.4rem 0.6rem; font-size: 1rem"
      />
      <button type="submit" :disabled="isPending">Add</button>
    </form>

    <p v-if="isError" style="color: red; margin-bottom: 0.5rem">
      {{ error?.message }}
    </p>

    <ul style="list-style: none; padding: 0">
      <li
        v-for="todo in todos"
        :key="todo.id"
        style="padding: 0.4rem 0; border-bottom: 1px solid #eee"
      >
        {{ todo.text }}
      </li>
      <li
        v-if="isPending"
        style="padding: 0.4rem 0; border-bottom: 1px solid #eee; opacity: 0.5"
      >
        {{ variables }} <em>(saving…)</em>
      </li>
    </ul>
  </div>
</template>
