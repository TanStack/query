<script setup lang="ts">
import { onlineManager, useQueryClient } from '@tanstack/vue-query'
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import { onMounted, onScopeDispose, ref, watchEffect } from 'vue'
import { reactive } from 'vue-demi'
import type { DevtoolsPanelOptions } from './types'

const props = defineProps<DevtoolsPanelOptions>()

const styleObject = reactive({
  height: '500px',
  ...props.style,
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
  onClose: props.onClose,
})

watchEffect(() => {
  devtools.setOnClose(props.onClose ?? (() => {}))
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
  <div :style="styleObject" className="tsqd-parent-container" ref="div"></div>
</template>
