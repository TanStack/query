import * as devtools from './devtools'

export let ReactQueryDevtools: typeof devtools['ReactQueryDevtools'] =
  function () {
    return null
  }

export let ReactQueryDevtoolsPanel: typeof devtools['ReactQueryDevtoolsPanel'] =
  function () {
    return null
  } as any

if (process.env.NODE_ENV !== 'production') {
  ReactQueryDevtools = devtools.ReactQueryDevtools
  ReactQueryDevtoolsPanel = devtools.ReactQueryDevtoolsPanel
}
