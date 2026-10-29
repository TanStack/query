<script setup lang="ts">
import { ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { todosMutations, todosQueries } from './services/todos/queries'

const queryClient = useQueryClient()
const intervalMs = ref(1000)
const value = ref('')

const { status, data, error, isFetching } = useQuery(() => ({
  ...todosQueries.list(),
  // Refetch the data every second
  refetchInterval: intervalMs.value,
}))

const { mutate: addTodo } = useMutation({
  ...todosMutations.create(),
  onSuccess: () =>
    queryClient.invalidateQueries({ queryKey: todosQueries.all() }),
})

const { mutate: clearTodos } = useMutation({
  ...todosMutations.deleteAll(),
  onSuccess: () =>
    queryClient.invalidateQueries({ queryKey: todosQueries.all() }),
})

const onSubmit = () => {
  addTodo(value.value, {
    onSuccess: () => {
      value.value = ''
    },
  })
}
</script>

<template>
  <h1 v-if="status === 'pending'">Loading...</h1>
  <span v-else-if="status === 'error'">Error: {{ error?.message }}</span>
  <div v-else>
    <h1>Auto Refetch with refetchInterval set to {{ intervalMs }}ms</h1>
    <p>
      This example is best experienced on your own machine, where you can open
      multiple tabs to the same localhost server and see your changes propagate
      between the two.
    </p>
    <label>
      Query Interval speed (ms):
      <input v-model.number="intervalMs" type="number" step="100" />
      {{ ' ' }}
      <span
        :style="{
          display: 'inline-block',
          marginLeft: '.5rem',
          width: '10px',
          height: '10px',
          background: isFetching ? 'green' : 'transparent',
          transition: !isFetching ? 'all .3s ease' : 'none',
          borderRadius: '100%',
          transform: 'scale(2)',
        }"
      />
    </label>
    <h2>Todo List</h2>
    <form @submit.prevent="onSubmit">
      <input v-model="value" placeholder="enter something" />
    </form>
    <ul>
      <li v-for="item in data" :key="item">{{ item }}</li>
    </ul>
    <div>
      <button @click="clearTodos()">Clear All</button>
    </div>
    <VueQueryDevtools initialIsOpen />
  </div>
</template>
