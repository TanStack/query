<script setup lang="ts">
import { computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { contactsAPI } from './services/contacts/api'
import { contactsQueries } from './services/contacts/queries'
import type { Contact } from './services/contacts/types'

const props = defineProps<{ contact: Contact }>()

const queryClient = useQueryClient()

const { mutate, variables, isPending } = useMutation({
  mutationFn: (favorite: boolean) =>
    contactsAPI.updateContact(props.contact.id, { favorite }),
  onSuccess: () =>
    queryClient.invalidateQueries({ queryKey: contactsQueries.all() }),
})

const favorite = computed(() =>
  isPending.value ? variables.value : props.contact.favorite,
)
</script>

<template>
  <form @submit.prevent="mutate(!favorite)">
    <button
      type="submit"
      :title="favorite ? 'Remove from favorites' : 'Add to favorites'"
    >
      {{ favorite ? '★' : '☆' }}
    </button>
  </form>
</template>
