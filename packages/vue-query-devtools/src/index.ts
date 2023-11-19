import devtools from './devtools.vue'
import type { DefineComponent } from 'vue'
import type { DevtoolsOptions } from './types'

export const VueQueryDevtools = (
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : devtools
) as DefineComponent<DevtoolsOptions, {}, unknown>
