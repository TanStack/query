import devtools from './devtools.vue'
import devtoolsPanel from './devtoolsPanel.vue'
import type { DefineComponent } from 'vue'
import type { DevtoolsOptions, DevtoolsPanelOptions } from './types'

export const VueQueryDevtools = devtools as DefineComponent<
  DevtoolsOptions,
  {},
  unknown
>

export const VueQueryDevtoolsPanel = devtoolsPanel as DefineComponent<
  DevtoolsPanelOptions,
  {},
  unknown
>
