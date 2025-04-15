import { DestroyRef, computed, effect } from '@angular/core'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import type { Injector } from '@angular/core'
import type { TanstackQueryDevtools } from '@tanstack/query-devtools'
import type { DevtoolsOptions } from './providers'

declare const ngDevMode: unknown

// This function is lazy loaded to speed up up the initial load time of the application
// and to minimize bundle size
export function setupDevtools(
  injector: Injector,
  withDevtoolsFn?: () => DevtoolsOptions,
) {
  const isDevMode = typeof ngDevMode !== 'undefined' && ngDevMode
  const injectedClient = injector.get(QueryClient, {
    optional: true,
  })
  const destroyRef = injector.get(DestroyRef)

  const options = computed(() => withDevtoolsFn?.() ?? {})

  let devtools: TanstackQueryDevtools | null = null
  let el: HTMLElement | null = null

  const shouldLoadToolsSignal = computed(() => {
    const { loadDevtools } = options()
    return typeof loadDevtools === 'boolean' ? loadDevtools : isDevMode
  })

  const getResolvedQueryClient = () => {
    const client = options().client ?? injectedClient
    if (!client) {
      throw new Error('No QueryClient found')
    }
    return client
  }

  const destroyDevtools = () => {
    devtools?.unmount()
    el?.remove()
    devtools = null
  }

  effect(
    () => {
      const shouldLoadTools = shouldLoadToolsSignal()
      const { client, position, errorTypes, buttonPosition, initialIsOpen } =
        options()

      if (devtools && !shouldLoadTools) {
        destroyDevtools()
        return
      } else if (devtools && shouldLoadTools) {
        client && devtools.setClient(client)
        position && devtools.setPosition(position)
        errorTypes && devtools.setErrorTypes(errorTypes)
        buttonPosition && devtools.setButtonPosition(buttonPosition)
        initialIsOpen && devtools.setInitialIsOpen(initialIsOpen)
        return
      } else if (!shouldLoadTools) {
        return
      }

      el = document.body.appendChild(document.createElement('div'))
      el.classList.add('tsqd-parent-container')

      import('@tanstack/query-devtools').then((queryDevtools) => {
        devtools = new queryDevtools.TanstackQueryDevtools({
          ...options(),
          client: getResolvedQueryClient(),
          queryFlavor: 'Angular Query',
          version: '5',
          onlineManager,
        })

        el && devtools.mount(el)

        // Unmount the devtools on application destroy
        destroyRef.onDestroy(destroyDevtools)
      })
    },
    { injector },
  )
}
