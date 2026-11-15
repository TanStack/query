<script setup lang="ts">
import { computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { contactsMutations, contactsQueries } from './services/contacts/queries'
import type { Contact } from './services/contacts/types'

const props = defineProps<{ contact: Contact }>()

const queryClient = useQueryClient()

const { mutate, variables, isPending } = useMutation({
  ...contactsMutations.update(),
  onSettled: () =>
    queryClient.invalidateQueries({ queryKey: contactsQueries.all() }),
})

const favorite = computed(() =>
  isPending.value
    ? Boolean(variables.value?.updates.favorite)
    : props.contact.favorite,
)
</script>

<template>
  <form
    @submit.prevent="
      mutate({ id: contact.id, updates: { favorite: !favorite } })
    "
  >
    <button
      type="submit"
      :title="favorite ? 'Remove from favorites' : 'Add to favorites'"
    >
      {{ favorite ? '★' : '☆' }}
    </button>
  </form>
</template>
