<script setup lang="ts">
import { isFetching as queryIsFetching, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import MessageBubble from './MessageBubble.vue'
import { messagesQueries } from './services/messages/queries'

const props = defineProps<{ id: string; question: string }>()

const {
  state: queryState,
  error,
  data,
} = useQuery(() => messagesQueries.detail(props.id, props.question))
const isFetching = computed(() => queryIsFetching(queryState))
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
