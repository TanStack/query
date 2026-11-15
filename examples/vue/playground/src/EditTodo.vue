<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { todosMutations, todosQueries } from './services/todos/queries'
import type { Todo } from './services/todos/types'

const props = defineProps<{ editingIndex: number }>()
const emit = defineEmits<{ setEditingIndex: [editingIndex: number | null] }>()

const queryClient = useQueryClient()

const { status, data, isFetching, failureCount, refetch } = useQuery(() =>
  todosQueries.detail(props.editingIndex),
)

const draft = ref<Partial<Omit<Todo, 'id'>>>({})

const {
  status: saveStatus,
  error: saveError,
  mutate: save,
} = useMutation({
  ...todosMutations.update(),
  onSuccess: (todo) => {
    // Update `todos` and the individual todo queries when this mutation succeeds
    queryClient.invalidateQueries({ queryKey: todosQueries.lists() })
    queryClient.setQueryData(
      todosQueries.detail(props.editingIndex).queryKey,
      todo,
    )
    draft.value = {}
  },
})

const disableEditSave = computed(
  () => status.value === 'pending' || saveStatus.value === 'pending',
)
</script>

<template>
  <div>
    <div>
      <template v-if="data">
        <button type="button" @click="emit('setEditingIndex', null)">
          Back
        </button>
        Editing Todo "{{ data.name }}" (#{{ editingIndex }})
      </template>
    </div>
    <span v-if="status === 'pending'">
      Loading... (Attempt: {{ failureCount + 1 }})
    </span>
    <span v-else-if="status === 'error'">
      Error! <button type="button" @click="refetch()">Retry</button>
    </span>
    <template v-else-if="data">
      <label>
        Name:
        <input
          :value="draft.name ?? data.name"
          :disabled="disableEditSave"
          @input="
            draft = {
              ...draft,
              name: ($event.currentTarget as HTMLInputElement).value,
            }
          "
        />
      </label>
      <label>
        Notes:
        <input
          :value="draft.notes ?? data.notes"
          :disabled="disableEditSave"
          @input="
            draft = {
              ...draft,
              notes: ($event.currentTarget as HTMLInputElement).value,
            }
          "
        />
      </label>
      <div>
        <button
          type="button"
          :disabled="disableEditSave"
          @click="save({ ...data, ...draft })"
        >
          Save
        </button>
      </div>
      <div>
        {{
          saveStatus === 'pending'
            ? 'Saving...'
            : saveStatus === 'error'
              ? saveError?.message
              : saveStatus === 'success'
                ? 'Saved!'
                : null
        }}
      </div>
      <div>
        <span v-if="isFetching">
          Background Refreshing... (Attempt: {{ failureCount + 1 }})
        </span>
        <span v-else>&nbsp;</span>
      </div>
    </template>
  </div>
</template>
