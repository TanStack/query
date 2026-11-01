<script setup lang="ts">
import { ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { todosMutations, todosQueries } from '../services/todos/queries'
import type { Todo } from '../services/todos/types'

interface MutationContext {
  previousTodos: Array<Todo> | undefined
  optimisticId: string
}

const queryClient = useQueryClient()
const inputValue = ref('')
const lastError = ref<string | null>(null)

const { data: todos, suspense } = useQuery(todosQueries.list())

const { mutate, isPending } = useMutation<Todo, Error, string, MutationContext>(
  {
    ...todosMutations.create(),
    onMutate: async (text) => {
      lastError.value = null
      await queryClient.cancelQueries({
        queryKey: todosQueries.list().queryKey,
      })

      const previousTodos = queryClient.getQueryData(
        todosQueries.list().queryKey,
      )

      const optimisticId = `optimistic-${Date.now()}`
      const optimisticTodo: Todo = {
        id: optimisticId,
        text,
        createdAt: Date.now(),
      }

      queryClient.setQueryData(todosQueries.list().queryKey, (old = []) => [
        ...old,
        optimisticTodo,
      ])

      return { previousTodos, optimisticId }
    },
    onError: (_err, _text, context) => {
      lastError.value = _err.message
      if (context?.previousTodos !== undefined) {
        queryClient.setQueryData(
          todosQueries.list().queryKey,
          context.previousTodos,
        )
      } else if (context?.optimisticId) {
        queryClient.setQueryData(todosQueries.list().queryKey, (old = []) =>
          old.filter((todo) => todo.id !== context.optimisticId),
        )
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: todosQueries.list().queryKey }),
  },
)

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
      <strong>Approach 2 — via cache manipulation:</strong>
      <code>onMutate</code> snapshots the cache and writes the optimistic item
      in. <code>onError</code> restores the snapshot on failure.
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

    <p v-if="lastError" style="color: red; margin-bottom: 0.5rem">
      {{ lastError }}
    </p>

    <ul style="list-style: none; padding: 0">
      <li
        v-for="todo in todos"
        :key="todo.id"
        :style="{
          padding: '0.4rem 0',
          borderBottom: '1px solid #eee',
          opacity: todo.id.startsWith('optimistic-') ? 0.5 : 1,
        }"
      >
        {{ todo.text }}
        <em v-if="todo.id.startsWith('optimistic-')"> (saving…)</em>
      </li>
    </ul>
  </div>
</template>
