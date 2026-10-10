import '@lit-labs/ssr-client/lit-element-hydrate-support.js'

import { QueryClient, hydrate } from '@tanstack/lit-query'
import { QUERY_STALE_TIME } from './api.js'
import type { DehydratedState } from '@tanstack/lit-query'

type HydratableSsrApp = HTMLElement & {
  queryClient?: QueryClient
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: QUERY_STALE_TIME,
      },
    },
  })
}

function readDehydratedState(): DehydratedState {
  const stateElement = document.getElementById('__QUERY_STATE__')
  if (!stateElement) {
    throw new Error('Missing dehydrated state script.')
  }

  const stateText = (stateElement.textContent || 'null').trim()
  return JSON.parse(stateText) as DehydratedState
}

async function bootstrap() {
  if (document.readyState === 'loading') {
    await new Promise<void>((resolve) => {
      document.addEventListener('DOMContentLoaded', () => resolve(), {
        once: true,
      })
    })
  }

  const appElement = document.querySelector(
    'ssr-app',
  ) as HydratableSsrApp | null
  if (!appElement) {
    throw new Error('Expected the SSR app element to exist before hydration.')
  }

  const queryClient = createQueryClient()
  queryClient.mount()
  hydrate(queryClient, readDehydratedState())
  appElement.queryClient = queryClient

  window.addEventListener(
    'pagehide',
    () => {
      queryClient.unmount()
    },
    { once: true },
  )

  await import('./app.js')
}

void bootstrap()
