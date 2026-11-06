import SolidQueryDevtoolsComp from './devtools'
import SolidQueryDevtoolsCompPanel from './devtoolsPanel'

export const SolidQueryDevtools: typeof SolidQueryDevtoolsComp =
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : SolidQueryDevtoolsComp

export const SolidQueryDevtoolsPanel: typeof SolidQueryDevtoolsCompPanel =
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : SolidQueryDevtoolsCompPanel

export type { DevtoolsPanelOptions } from './devtoolsPanel'
