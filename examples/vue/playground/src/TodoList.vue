<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { todosQueries } from './services/todos/queries'

const props = withDefaults(defineProps<{ initialFilter?: string }>(), {
  initialFilter: '',
})
defineEmits<{ setEditingIndex: [editingIndex: number | null] }>()

const filter = ref(props.initialFilter)

const { status, data, isFetching, error, failureCount, refetch } = useQuery(
  () => todosQueries.list(filter.value),
)
</script>

<template>
  <div>
    <div>
      <label>
        Filter:
        <input v-model="filter" />
      </label>
    </div>
    <span v-if="status === 'pending'">
      Loading... (Attempt: {{ failureCount + 1 }})
    </span>
    <span v-else-if="status === 'error'">
      Error: {{ error?.message }}
      <br />
      <button type="button" @click="refetch()">Retry</button>
    </span>
    <template v-else>
      <ul>
        <li v-for="todo in data" :key="todo.id">
          {{ todo.name }}
          <button type="button" @click="$emit('setEditingIndex', todo.id)">
            Edit
          </button>
        </li>
      </ul>
      <div>
        <span v-if="isFetching">
          Background Refreshing... (Attempt: {{ failureCount + 1 }})
        </span>
        <span v-else>&nbsp;</span>
      </div>
    </template>
  </div>
</template>
