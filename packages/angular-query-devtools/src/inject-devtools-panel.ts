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
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import { QueryClient, onlineManager } from '@tanstack/angular-query'
import { isPlatformBrowser } from '@angular/common'
import type { ElementRef } from '@angular/core'
import type { DevtoolsErrorType } from '@tanstack/query-devtools'

/**
 * Inject a TanStack Query devtools panel and render it in the DOM.
 *
 * Devtools panel allows programmatic control over the devtools, for example if you want to render
 * the devtools as part of your own devtools.
 *
 * Consider `withDevtools` instead if you don't need this.
 * @param optionsFn - A function that returns devtools panel options.
 * @param injector - The Angular injector to use.
 * @returns DevtoolsPanelRef
 * @see https://tanstack.com/query/v5/docs/framework/angular/devtools
 */
export function injectDevtoolsPanel(
  optionsFn: () => DevtoolsPanelOptions,
  injector?: Injector,
): DevtoolsPanelRef {
  !injector && assertInInjectionContext(injectDevtoolsPanel)
  const currentInjector = injector ?? inject(Injector)

  return runInInjectionContext(currentInjector, () => {
    const destroyRef = inject(DestroyRef)
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
    const injectedClient = inject(QueryClient, { optional: true })

    const options = computed(optionsFn)
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
      } = options()

      untracked(() => {
        if (!client) throw new Error('No QueryClient found')
        if (!devtools && hostElement) {
          devtools = new TanstackQueryDevtoolsPanel({
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

/**
 * A devtools panel, which can be manually destroyed.
 */
export interface DevtoolsPanelRef {
  /**
   * Destroy the panel, removing it from the DOM and stops listening to signal changes.
   */
  destroy: () => void
}

export interface DevtoolsPanelOptions {
  /**
   * Custom instance of QueryClient
   */
  client?: QueryClient
  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  errorTypes?: Array<DevtoolsErrorType>
  /**
   * Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
   */
  styleNonce?: string
  /**
   * Use this so you can attach the devtool's styles to specific element in the DOM.
   */
  shadowDOMTarget?: ShadowRoot

  /**
   * Callback function that is called when the devtools panel is closed
   */
  onClose?: () => unknown

  /**
   * Element where to render the devtools panel. When set to undefined or null, the devtools panel will not be created, or destroyed if existing.
   * If changed from undefined to a ElementRef, the devtools panel will be created.
   */
  hostElement?: ElementRef
}
