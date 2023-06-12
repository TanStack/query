'use client'

import * as devtools from './devtools'

export const ReactQueryDevtools: typeof devtools['ReactQueryDevtools'] =
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : devtools.ReactQueryDevtools

export const ReactQueryDevtoolsPanel: typeof devtools['ReactQueryDevtoolsPanel'] =
  process.env.NODE_ENV !== 'development'
    ? (function () {
        return null
      } as any)
    : devtools.ReactQueryDevtoolsPanel
