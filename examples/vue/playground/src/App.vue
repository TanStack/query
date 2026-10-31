<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { serverConfig } from './services/todos/api'

import TodoList from './TodoList.vue'
import EditTodo from './EditTodo.vue'
import AddTodo from './AddTodo.vue'

const queryClient = useQueryClient()

const staleTime = ref(1000)
const gcTime = ref(3000)
const localErrorRate = ref(serverConfig.errorRate)
const localFetchTimeMin = ref(serverConfig.queryTimeMin)
const localFetchTimeMax = ref(serverConfig.queryTimeMax)

watchEffect(() => {
  serverConfig.errorRate = localErrorRate.value
  serverConfig.queryTimeMin = localFetchTimeMin.value
  serverConfig.queryTimeMax = localFetchTimeMax.value
})

watchEffect(() => {
  queryClient.setDefaultOptions({
    queries: {
      staleTime: staleTime.value,
      gcTime: gcTime.value,
    },
  })
})

const onNumberChange = (event: Event, setValue: (value: number) => void) => {
  const value = (event.currentTarget as HTMLInputElement).valueAsNumber
  if (!Number.isNaN(value)) {
    setValue(value)
  }
}

const editingIndex = ref<number | null>(null)
const views = ref(['', 'fruit', 'grape'])

const setEditingIndex = (index: number | null) => {
  editingIndex.value = index
}
</script>

<template>
  <p>
    The "staleTime" and "gcTime" durations have been altered in this example to
    show how query stale-ness and query caching work on a granular level
  </p>
  <div>
    Stale Time:
    <input
      type="number"
      min="0"
      step="1000"
      :value="staleTime"
      :style="{ width: '100px' }"
      @input="onNumberChange($event, (value) => (staleTime = value))"
    />
  </div>
  <div>
    Garbage collection Time:
    <input
      type="number"
      min="0"
      step="1000"
      :value="gcTime"
      :style="{ width: '100px' }"
      @input="onNumberChange($event, (value) => (gcTime = value))"
    />
  </div>
  <br />
  <div>
    Error Rate:
    <input
      type="number"
      min="0"
      max="1"
      step=".05"
      :value="localErrorRate"
      :style="{ width: '100px' }"
      @input="onNumberChange($event, (value) => (localErrorRate = value))"
    />
  </div>
  <div>
    Fetch Time Min:
    <input
      type="number"
      min="1"
      step="500"
      :value="localFetchTimeMin"
      :style="{ width: '60px' }"
      @input="onNumberChange($event, (value) => (localFetchTimeMin = value))"
    />
  </div>
  <div>
    Fetch Time Max:
    <input
      type="number"
      min="1"
      step="500"
      :value="localFetchTimeMax"
      :style="{ width: '60px' }"
      @input="onNumberChange($event, (value) => (localFetchTimeMax = value))"
    />
  </div>
  <br />
  <div class="App">
    <div>
      <button type="button" @click="queryClient.invalidateQueries()">
        Force Refetch All
      </button>
    </div>
    <br />
    <hr />
    <div v-for="(view, index) in views" :key="index">
      <TodoList :initial-filter="view" @set-editing-index="setEditingIndex" />
      <br />
    </div>
    <button type="button" @click="views = [...views, '']">
      Add Filter List
    </button>
    <hr />
    <template v-if="editingIndex !== null">
      <EditTodo
        :key="editingIndex"
        :editing-index="editingIndex"
        @set-editing-index="setEditingIndex"
      />
      <hr />
    </template>
    <AddTodo />
  </div>
  <br />
  <VueQueryDevtools initial-is-open />
</template>
