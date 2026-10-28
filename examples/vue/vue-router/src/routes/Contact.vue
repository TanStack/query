<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import ErrorPage from '../ErrorPage.vue'
import Favorite from '../Favorite.vue'
import { contactsAPI } from '../services/contacts/api'
import { contactsQueries } from '../services/contacts/queries'

const props = defineProps<{ contactId: string }>()

const router = useRouter()
const queryClient = useQueryClient()

const { data: contact, error } = useQuery(() => ({
  ...contactsQueries.detail(props.contactId),
  retryOnMount: false,
}))

const { mutate: destroy } = useMutation({
  mutationFn: (contactId: string) => contactsAPI.deleteContact(contactId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
    router.push('/')
  },
})

const onDestroy = (contactId: string) => {
  if (confirm('Please confirm you want to delete this record.')) {
    destroy(contactId)
  }
}
</script>

<template>
  <ErrorPage v-if="error" :error="error" />
  <div v-else-if="contact" id="contact">
    <div>
      <img :key="contact.avatar" :src="contact.avatar || undefined" />
    </div>

    <div>
      <h1>
        <template v-if="contact.first || contact.last">
          {{ contact.first }} {{ contact.last }}
        </template>
        <i v-else>No Name</i>
        {{ ' ' }}
        <Favorite :contact="contact" />
      </h1>

      <p v-if="contact.twitter">
        <a target="_blank" :href="`https://twitter.com/${contact.twitter}`">
          {{ contact.twitter }}
        </a>
      </p>

      <p v-if="contact.notes">{{ contact.notes }}</p>

      <div>
        <RouterLink :to="`/contacts/${contact.id}/edit`" class="button">
          Edit
        </RouterLink>
        <form @submit.prevent="onDestroy(contact.id)">
          <button type="submit">Delete</button>
        </form>
      </div>
    </div>
  </div>
</template>
