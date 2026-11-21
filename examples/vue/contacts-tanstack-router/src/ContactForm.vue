<script setup lang="ts">
import { useRouter } from '@tanstack/vue-router'
import type { Contact } from './services/contacts/types'

defineProps<{ contact?: Contact }>()
const emit = defineEmits<{
  submit: [
    values: Pick<Contact, 'first' | 'last' | 'twitter' | 'avatar' | 'notes'>,
  ]
}>()

const router = useRouter()

const onSubmit = (event: SubmitEvent) => {
  const formData = new FormData(event.currentTarget as HTMLFormElement)
  emit('submit', {
    first: String(formData.get('first')),
    last: String(formData.get('last')),
    twitter: String(formData.get('twitter')),
    avatar: String(formData.get('avatar')),
    notes: String(formData.get('notes')),
  })
}
</script>

<template>
  <form id="contact-form" @submit.prevent="onSubmit">
    <p>
      <span>Name</span>
      <input
        placeholder="First"
        aria-label="First name"
        type="text"
        name="first"
        :value="contact?.first"
      />
      <input
        placeholder="Last"
        aria-label="Last name"
        type="text"
        name="last"
        :value="contact?.last"
      />
    </p>
    <label>
      <span>Twitter</span>
      <input
        type="text"
        name="twitter"
        placeholder="@jack"
        :value="contact?.twitter"
      />
    </label>
    <label>
      <span>Avatar URL</span>
      <input
        placeholder="https://example.com/avatar.jpg"
        type="text"
        name="avatar"
        :value="contact?.avatar"
      />
    </label>
    <label>
      <span>Notes</span>
      <textarea name="notes" :value="contact?.notes" rows="6" />
    </label>
    <p>
      <button type="submit">Save</button>
      <button type="button" @click="router.history.back()">Cancel</button>
    </p>
  </form>
</template>
