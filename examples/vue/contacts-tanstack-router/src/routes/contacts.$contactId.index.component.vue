<script setup lang="ts">
import { Link, useNavigate, useParams, useSearch } from '@tanstack/vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import FavoriteButton from '../FavoriteButton.vue'
import {
  contactsMutations,
  contactsQueries,
} from '../services/contacts/queries'

const navigate = useNavigate()
const contactId = useParams({
  from: '/contacts/$contactId/',
  select: (params) => params.contactId,
})
const q = useSearch({
  from: '/contacts/$contactId/',
  select: (search) => search.q,
})
const queryClient = useQueryClient()

const { data: contact } = useQuery(() =>
  contactsQueries.detail(contactId.value),
)

const { mutate: destroy } = useMutation({
  ...contactsMutations.delete(),
  onSuccess: async () => {
    await navigate({ to: '/', search: { q: q.value } })
    await queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
  },
})

const onDestroy = (id: string) => {
  if (confirm('Please confirm you want to delete this record.')) {
    destroy(id)
  }
}
</script>

<template>
  <div v-if="contact" id="contact">
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
        <FavoriteButton :contact="contact" />
      </h1>

      <p v-if="contact.twitter">
        <a target="_blank" :href="`https://twitter.com/${contact.twitter}`">
          {{ contact.twitter }}
        </a>
      </p>

      <p v-if="contact.notes">{{ contact.notes }}</p>

      <div>
        <Link
          to="/contacts/$contactId/edit"
          :params="{ contactId: contact.id }"
          :search="{ q }"
          class="button"
        >
          Edit
        </Link>
        <form class="destroy" @submit.prevent="onDestroy(contact.id)">
          <button type="submit">Delete</button>
        </form>
      </div>
    </div>
  </div>
</template>
