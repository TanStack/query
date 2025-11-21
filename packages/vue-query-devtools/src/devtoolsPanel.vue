<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, watchEffect } from 'vue'
import { onlineManager, useQueryClient } from '@tanstack/vue-query'
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import type { StyleValue } from 'vue'
import type { DevtoolsPanelOptions } from './types'

const props = defineProps<DevtoolsPanelOptions>()
const style = computed<StyleValue>(() => {
  return {
    height: '500px',
    ...props.style,
  }
})

const div = ref<HTMLElement>()
const client = props.client || useQueryClient()
const devtools = new TanstackQueryDevtoolsPanel({
  client,
  queryFlavor: 'Vue Query',
  version: '5',
  onlineManager,
  buttonPosition: 'bottom-left',
  position: 'bottom',
  initialIsOpen: true,
  errorTypes: props.errorTypes,
  styleNonce: props.styleNonce,
  shadowDOMTarget: props.shadowDOMTarget,
  hideDisabledQueries: props.hideDisabledQueries,
  onClose: props.onClose,
  theme: props.theme,
})

watchEffect(() => {
  devtools.setOnClose(props.onClose ?? (() => {}))
  devtools.setErrorTypes(props.errorTypes || [])
  devtools.setTheme(props.theme)
})

onMounted(() => {
  devtools.mount(div.value as HTMLElement)
})

onScopeDispose(() => {
  devtools.unmount()
})
</script>

<template>
  <div :style="style" className="tsqd-parent-container" ref="div"></div>
</template>
