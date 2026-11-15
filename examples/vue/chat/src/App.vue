<script setup lang="ts">
import { ref } from 'vue'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

import ChatMessage from './ChatMessage.vue'

const questions = ref<Array<{ id: string; question: string }>>([])
const currentQuestion = ref('')

const submitMessage = () => {
  questions.value = [
    ...questions.value,
    { id: crypto.randomUUID(), question: currentQuestion.value },
  ]
  currentQuestion.value = ''
}
</script>

<template>
  <VueQueryDevtools />
  <div class="flex flex-col h-screen max-w-3xl mx-auto p-4">
    <h1 class="text-3xl font-bold text-gray-800">TanStack Chat Example</h1>
    <div class="overflow-y-auto mb-4 space-y-4">
      <ChatMessage
        v-for="{ id, question } in questions"
        :id="id"
        :key="id"
        :question="question"
      />
    </div>

    <form class="flex items-center space-x-2" @submit.prevent="submitMessage">
      <input
        v-model="currentQuestion"
        class="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
        placeholder="Type your message..."
      />
      <button
        type="submit"
        :disabled="!currentQuestion.trim()"
        class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-2xl shadow-md transition"
      >
        <span>Send</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
          />
          <path d="m21.854 2.147-10.94 10.939" />
        </svg>
      </button>
    </form>
  </div>
</template>
