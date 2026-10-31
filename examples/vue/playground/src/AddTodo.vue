<script setup lang="ts">
import { ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { todosMutations, todosQueries } from './services/todos/queries'

const queryClient = useQueryClient()
const name = ref('')

const { status, error, mutate } = useMutation({
  ...todosMutations.create(),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: todosQueries.lists() })
  },
})
</script>

<template>
  <div>
    <input v-model="name" :disabled="status === 'pending'" />
    <button
      type="button"
      :disabled="status === 'pending' || !name"
      @click="mutate({ name, notes: 'These are some notes' })"
    >
      Add Todo
    </button>
    <div>
      {{
        status === 'pending'
          ? 'Saving...'
          : status === 'error'
            ? error?.message
            : status === 'success'
              ? 'Saved!'
              : null
      }}
    </div>
  </div>
</template>
