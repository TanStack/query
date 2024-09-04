import Devtools from './VueQueryDevtools.vue'
import DevtoolsPanel from './VueQueryDevtoolsPanel.vue'
import type { DefineComponent } from 'vue'
import type { DevtoolsOptions, DevtoolsPanelOptions } from './types'

export const VueQueryDevtools = (
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : Devtools
) as DefineComponent<DevtoolsOptions, {}, unknown>

export const VueQueryDevtoolsPanel = (
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : DevtoolsPanel
) as DefineComponent<DevtoolsPanelOptions, {}, unknown>
