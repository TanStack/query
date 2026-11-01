<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Contact } from './services/contacts/types'

defineProps<{ contact?: Contact }>()
const emit = defineEmits<{ submit: [formData: FormData] }>()

const router = useRouter()

const onSubmit = (event: SubmitEvent) => {
  emit('submit', new FormData(event.currentTarget as HTMLFormElement))
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
      <button type="button" @click="router.back()">Cancel</button>
    </p>
  </form>
</template>
