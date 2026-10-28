<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { messagesQueries } from './services/messages/queries'

import Message from './Message.vue'

const props = defineProps<{ id: string; question: string }>()

const { error, data, isFetching } = useQuery(() =>
  messagesQueries.detail(props.id, props.question),
)
</script>

<template>
  <template v-if="error">An error has occurred: {{ error.message }}</template>
  <div v-else>
    <Message :message="{ content: question, isQuestion: true }" />
    <Message
      :inProgress="isFetching"
      :message="{ content: (data ?? []).join(' '), isQuestion: false }"
    />
  </div>
</template>
