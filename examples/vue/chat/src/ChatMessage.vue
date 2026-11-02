<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { messagesQueries } from './services/messages/queries'

import MessageBubble from './MessageBubble.vue'

const props = defineProps<{ id: string; question: string }>()

const { error, data, isFetching } = useQuery(() =>
  messagesQueries.detail(props.id, props.question),
)
</script>

<template>
  <template v-if="error">An error has occurred: {{ error.message }}</template>
  <div v-else>
    <MessageBubble :message="{ content: question, isQuestion: true }" />
    <MessageBubble
      :in-progress="isFetching"
      :message="{ content: (data ?? []).join(' '), isQuestion: false }"
    />
  </div>
</template>
