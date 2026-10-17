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

/**
 * The props of `PreactQueryDevtoolsPanel`, which renders the devtools panel inline.
 */
export type DevtoolsPanelOptions = DevtoolsPanel.DevtoolsPanelOptions
