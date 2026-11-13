import '@lit-labs/ssr-client/lit-element-hydrate-support.js'

import { hydrate } from '@tanstack/lit-query'
import { makeQueryClient } from './makeQueryClient'
import type { DehydratedState } from '@tanstack/lit-query'

declare global {
  interface Window {
    __DEHYDRATED_STATE__: DehydratedState
  }
}

const queryClient = makeQueryClient()
queryClient.mount()
hydrate(queryClient, window.__DEHYDRATED_STATE__)

const appElement = document.querySelector('ssr-app')
if (!appElement) {
  throw new Error('Expected the server-rendered <ssr-app> element')
}

// Assign the hydrated client before the element upgrades, so its controllers
// read the same cache the server rendered with
appElement.queryClient = queryClient
await import('./app')
