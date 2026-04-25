import * as Devtools from './PreactQueryDevtools'
import * as DevtoolsPanel from './PreactQueryDevtoolsPanel'

export const PreactQueryDevtools: (typeof Devtools)['PreactQueryDevtools'] =
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : Devtools.PreactQueryDevtools

export const PreactQueryDevtoolsPanel: (typeof DevtoolsPanel)['PreactQueryDevtoolsPanel'] =
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : DevtoolsPanel.PreactQueryDevtoolsPanel

export type DevtoolsPanelOptions = DevtoolsPanel.DevtoolsPanelOptions
