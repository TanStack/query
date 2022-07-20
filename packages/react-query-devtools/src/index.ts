import * as devtools from './devtools'

export const ReactQueryDevtools: typeof devtools['ReactQueryDevtools'] =
  process.env.NODE_ENV !== 'production'
    ? devtools.ReactQueryDevtools
    : function () {
        return null
      }

export const ReactQueryDevtoolsPanel: typeof devtools['ReactQueryDevtoolsPanel'] =
  process.env.NODE_ENV !== 'production'
    ? devtools.ReactQueryDevtoolsPanel
    : (function () {
        return null
      } as any)
