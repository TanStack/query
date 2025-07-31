<script setup lang="ts">
import { onMounted, onScopeDispose, ref, watchEffect } from 'vue'
import { onlineManager, useQueryClient } from '@tanstack/vue-query'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import type { DevtoolsOptions } from './types'

const props = defineProps<DevtoolsOptions>()

const div = ref<HTMLElement>()
const client = props.client || useQueryClient()
const devtools = new TanstackQueryDevtools({
  client,
  queryFlavor: 'Vue Query',
  version: '5',
  onlineManager,
  buttonPosition: props.buttonPosition,
  position: props.position,
  initialIsOpen: props.initialIsOpen,
  errorTypes: props.errorTypes,
  styleNonce: props.styleNonce,
  shadowDOMTarget: props.shadowDOMTarget,
  hideDisabledQueries: props.hideDisabledQueries,
})

watchEffect(() => {
  devtools.setButtonPosition(props.buttonPosition || 'bottom-right')
  devtools.setPosition(props.position || 'bottom')
  devtools.setInitialIsOpen(props.initialIsOpen)
  devtools.setErrorTypes(props.errorTypes || [])
})

onMounted(() => {
  devtools.mount(div.value as HTMLElement)
})

onScopeDispose(() => {
  devtools.unmount()
})
</script>

<template>
  <div className="tsqd-parent-container" ref="div"></div>
</template>
