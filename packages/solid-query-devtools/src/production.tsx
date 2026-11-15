import clientOnly from './clientOnly'
import type SolidQueryDevtoolsComp from './devtools'
import type SolidQueryDevtoolsCompPanel from './devtoolsPanel'

export const SolidQueryDevtools: typeof SolidQueryDevtoolsComp = clientOnly(
  () => import('./devtools'),
)

export const SolidQueryDevtoolsPanel: typeof SolidQueryDevtoolsCompPanel =
  clientOnly(() => import('./devtoolsPanel'))

export type { DevtoolsPanelOptions } from './devtoolsPanel'
