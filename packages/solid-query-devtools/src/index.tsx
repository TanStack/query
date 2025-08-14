import { isDev } from 'solid-js/web'
import clientOnly from './clientOnly'
import type SolidQueryDevtoolsComp from './devtools'
import type SolidQueryDevtoolsCompPanel from './devtoolsPanel'

export const SolidQueryDevtools: typeof SolidQueryDevtoolsComp = isDev
  ? clientOnly(() => import('./devtools'))
  : function () {
      return null
    }

export const SolidQueryDevtoolsPanel: typeof SolidQueryDevtoolsCompPanel =
  clientOnly(() => import('./devtoolsPanel'))

export type { DevtoolsPanelOptions } from './devtoolsPanel'
