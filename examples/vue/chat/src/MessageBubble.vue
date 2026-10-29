<script setup lang="ts">
defineProps<{
  inProgress?: boolean
  message: { content: string; isQuestion: boolean }
}>()
</script>

<template>
  <div
    class="flex"
    :class="message.isQuestion ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[80%] rounded-lg p-3"
      :class="
        message.isQuestion
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-800'
      "
    >
      {{ message.content }}
      {{ inProgress ? '...' : null }}
    </div>
  </div>
</template>
