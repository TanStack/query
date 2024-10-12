'use client'

import * as Devtools from './ReactQueryDevtools'
import * as DevtoolsPanel from './ReactQueryDevtoolsPanel'

export const ReactQueryDevtools: (typeof Devtools)['ReactQueryDevtools'] =
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : Devtools.ReactQueryDevtools

export const ReactQueryDevtoolsPanel: (typeof DevtoolsPanel)['ReactQueryDevtoolsPanel'] =
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : DevtoolsPanel.ReactQueryDevtoolsPanel
