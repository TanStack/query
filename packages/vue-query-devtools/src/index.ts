import devtools from './devtools.vue'
import devtoolsPanel from './devtoolsPanel.vue'
import type { DefineComponent } from 'vue'
import type { DevtoolsOptions, DevtoolsPanelOptions } from './types'

export const VueQueryDevtools = (
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : devtools
) as DefineComponent<DevtoolsOptions, {}, unknown>

export const VueQueryDevtoolsPanel = (
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : devtoolsPanel
) as DefineComponent<DevtoolsPanelOptions, {}, unknown>
