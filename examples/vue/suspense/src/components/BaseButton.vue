<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue'
import { isPendingKey } from '../transition'
import BaseSpinner from './BaseSpinner.vue'

const emit = defineEmits<{ click: [] }>()

const isPending = inject(isPendingKey, ref(false))
const isStarted = ref(false)
const isLoading = computed(() => isStarted.value && isPending.value)

watch(isPending, (pending) => {
  if (!pending) {
    isStarted.value = false
  }
})

const handleClick = async () => {
  isStarted.value = true
  emit('click')
  await nextTick()
  if (!isPending.value) {
    isStarted.value = false
  }
}
</script>

<template>
  <button :disabled="isLoading" @click="handleClick">
    <slot />
    <BaseSpinner v-if="isLoading" />
  </button>
</template>
