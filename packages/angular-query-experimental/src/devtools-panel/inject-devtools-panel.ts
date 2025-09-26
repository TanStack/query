import {
  DestroyRef,
  Injector,
  PLATFORM_ID,
  assertInInjectionContext,
  computed,
  effect,
  inject,
  runInInjectionContext,
  untracked,
} from '@angular/core'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { isPlatformBrowser } from '@angular/common'
import type { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import type {
  DevtoolsPanelOptions,
  InjectDevtoolsPanel,
  InjectDevtoolsPanelOptions,
} from './types'

/**
 * Inject a TanStack Query devtools panel and render it in the DOM.
 *
 * Devtools panel allows programmatic control over the devtools, for example if you want to render
 * the devtools as part of your own devtools.
 *
 * Consider `withDevtools` instead if you don't need this.
 * @param injectDevtoolsPanelFn - A function that returns devtools panel options.
 * @param options - Additional configuration
 * @returns DevtoolsPanelRef
 * @see https://tanstack.com/query/v5/docs/framework/angular/devtools
 */
export const injectDevtoolsPanel: InjectDevtoolsPanel = (
  injectDevtoolsPanelFn: () => DevtoolsPanelOptions,
  options?: InjectDevtoolsPanelOptions,
) => {
  !options?.injector && assertInInjectionContext(injectDevtoolsPanel)
  const currentInjector = options?.injector ?? inject(Injector)

  return runInInjectionContext(currentInjector, () => {
    const destroyRef = inject(DestroyRef)
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
    const injectedClient = inject(QueryClient, { optional: true })

    const queryOptions = computed(injectDevtoolsPanelFn)
    let devtools: TanstackQueryDevtoolsPanel | null = null

    const destroy = () => {
      devtools?.unmount()
      devtools = null
    }

    if (!isBrowser)
      return {
        destroy,
      }

    effect(() => {
      const {
        client = injectedClient,
        errorTypes = [],
        styleNonce,
        shadowDOMTarget,
        onClose,
        hostElement,
      } = queryOptions()

      untracked(() => {
        if (!client) throw new Error('No QueryClient found')
        if (!devtools && hostElement) {
          import('@tanstack/query-devtools')
            .then((queryDevtools) => {
              devtools = new queryDevtools.TanstackQueryDevtoolsPanel({
                client,
                queryFlavor: 'Angular Query',
                version: '5',
                buttonPosition: 'bottom-left',
                position: 'bottom',
                initialIsOpen: true,
                errorTypes,
                styleNonce,
                shadowDOMTarget,
                onClose,
                onlineManager,
              })
              devtools.mount(hostElement.nativeElement)
            })
            .catch((error) => {
              console.error(
                'Install @tanstack/query-devtools or reinstall without --omit=optional.',
                error,
              )
            })
        } else if (devtools && hostElement) {
          devtools.setClient(client)
          devtools.setErrorTypes(errorTypes)
          onClose && devtools.setOnClose(onClose)
        } else if (devtools && !hostElement) {
          destroy()
        }
      })
    })

    destroyRef.onDestroy(destroy)

    return {
      destroy,
    }
  })
}
